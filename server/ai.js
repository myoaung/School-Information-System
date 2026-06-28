const Anthropic = require('@anthropic-ai/sdk');
const { getDb } = require('./db');
const { getToolDefinitions, executeTool } = require('./query-tools');

// ─── Client Initialization ───────────────────────────────────────────────────

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set. Add it to your .env file.');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  model: 'claude-haiku-4-5-20251001', // Fast + cheap for chat
  maxTokens: 1024,
  maxHistoryMessages: 10,
  maxToolRounds: 5, // Max tool call rounds per request
  cacheMaxSize: 200,
  cacheTTLms: 5 * 60 * 1000, // 5 minutes
};

// ─── Simple Response Cache ───────────────────────────────────────────────────

const responseCache = new Map();

function getCacheKey(message, userRole) {
  return `${userRole}:${message.toLowerCase().trim()}`;
}

function getCachedResponse(message, userRole) {
  const key = getCacheKey(message, userRole);
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.timestamp < CONFIG.cacheTTLms) {
    return entry.reply;
  }
  responseCache.delete(key);
  return null;
}

function setCachedResponse(message, userRole, reply) {
  if (responseCache.size >= CONFIG.cacheMaxSize) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  const key = getCacheKey(message, userRole);
  responseCache.set(key, { reply, timestamp: Date.now() });
}

// ─── System Prompt Builder ───────────────────────────────────────────────────

function buildSystemPrompt(userName, userRole) {
  const db = getDb();

  // Gather school context
  const announcementCount = db.prepare('SELECT COUNT(*) as c FROM announcements').get().c;
  const classCount = db.prepare('SELECT COUNT(*) as c FROM classes').get().c;
  const studentCount = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
  const teacherCount = db.prepare('SELECT COUNT(*) as c FROM teachers').get().c;

  const recentAnnouncements = db.prepare(`
    SELECT title, content, created_at FROM announcements
    ORDER BY created_at DESC LIMIT 3
  `).all();

  const classes = db.prepare(`
    SELECT c.name, c.schedule, c.room, u.name as teacher
    FROM classes c LEFT JOIN users u ON c.teacher_id = u.id
    ORDER BY c.name
  `).all();

  return `You are SchoolHub AI, the intelligent assistant for a school management system.

## Your Role
- Help students, teachers, and administrators with school-related questions
- Provide accurate information from the school database using query tools
- Be friendly, concise, and helpful
- Support both English and Myanmar language

## Current User
- Name: ${userName}
- Role: ${userRole}

## School Context
- ${announcementCount} announcements posted
- ${classCount} classes available
- ${studentCount} students enrolled
- ${teacherCount} teachers on staff

## Recent Announcements
${recentAnnouncements.map((a, i) => `${i + 1}. ${a.title} — ${a.content.substring(0, 80)}...`).join('\n')}

## Available Classes
${classes.map(c => `- ${c.name} | ${c.schedule || 'TBA'} | Room: ${c.room || 'TBA'} | Teacher: ${c.teacher || 'TBA'}`).join('\n')}

## Available Query Tools
You have access to these database query tools. USE THEM when users ask about data:
- query_attendance: Attendance records (filter by class, student, date, status)
- query_students: Student information (filter by name, grade, section)
- query_grades: Student grades and GPA (filter by student, course, class)
- query_classes: Class information (filter by name, teacher)
- query_teachers: Teacher information (filter by name, specialization)
- query_timetable: Class schedule (filter by class, teacher, day)
- query_announcements: School announcements (filter by keyword, author)
- query_assignments: Assignments and submissions (filter by course, student, status)
- query_stats: School statistics (total students, teachers, attendance rate)

## When to Use Tools
- "How many students?" → use query_stats
- "Show absent students" → use query_attendance with status=absent
- "What classes does Ms. Johnson teach?" → use query_classes with teacher_name
- "John Doe's grades" → use query_grades with student_name
- "Today's schedule" → use query_timetable

## Rules
- NEVER make up data — always use query tools for factual information
- Never share passwords or sensitive personal data
- Students can only see their own data
- Teachers can see their class data
- Admins can see all data
- If a query returns no results, say so clearly
- Keep responses under 300 words unless asked for more detail
- Use markdown formatting for readability
- Present data in tables when appropriate`;
}

// ─── Conversation History ────────────────────────────────────────────────────

function getConversationHistory(userId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT message, reply FROM chat_messages
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, CONFIG.maxHistoryMessages);

  return rows.reverse(); // Oldest first
}

// ─── Tool-Augmented Chat ─────────────────────────────────────────────────────

async function getAIReply(message, userName, userRole, userId) {
  // 1. Check cache (only for non-data queries)
  const cached = getCachedResponse(message, userRole);
  if (cached) {
    return cached;
  }

  // 2. Build messages array with conversation history
  const history = getConversationHistory(userId);
  const messages = [];

  for (const row of history) {
    if (row.message) {
      messages.push({ role: 'user', content: row.message });
    }
    if (row.reply) {
      messages.push({ role: 'assistant', content: row.reply });
    }
  }

  // Add current message
  messages.push({ role: 'user', content: message });

  // 3. Get tool definitions
  const tools = getToolDefinitions();

  // 4. Build user context for role-based filtering
  const userContext = { id: userId, name: userName, role: userRole };

  // 5. Call Claude API with tool loop
  const anthropic = getClient();
  const systemPrompt = buildSystemPrompt(userName, userRole);

  let response = await anthropic.messages.create({
    model: CONFIG.model,
    max_tokens: CONFIG.maxTokens,
    system: systemPrompt,
    messages,
    tools,
  });

  // 6. Handle tool calls (loop until Claude stops calling tools)
  let rounds = 0;
  while (response.stop_reason === 'tool_use' && rounds < CONFIG.maxToolRounds) {
    rounds++;
    const toolResults = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log(`[AI] Calling tool: ${block.name}`, block.input);
        const result = executeTool(block.name, userContext, block.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result, null, 2),
        });
      }
    }

    // Continue conversation with tool results
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await anthropic.messages.create({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      system: systemPrompt,
      messages,
      tools,
    });
  }

  // 7. Extract final text response
  const textBlock = response.content.find(b => b.type === 'text');
  const reply = textBlock ? textBlock.text : 'I could not generate a response. Please try again.';

  // 8. Cache the response (only if no tools were called — data queries vary)
  if (rounds === 0) {
    setCachedResponse(message, userRole, reply);
  }

  return reply;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = { getAIReply, CONFIG };
