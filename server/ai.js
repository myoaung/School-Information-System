const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('./data');
const { getToolDefinitions, executeTool } = require('./query-tools');

// ─── Client Initialization ───────────────────────────────────────────────────

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic({ apiKey, timeout: 30000 }); // 30s timeout
  }
  return client;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 1024,
  maxHistoryMessages: 10,
  maxToolRounds: 5,
  cacheMaxSize: 200,
  cacheTTLms: 5 * 60 * 1000,
  maxInputLength: 2000,
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

// ─── Input Sanitization ─────────────────────────────────────────────────────

function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  // Truncate and strip control characters (except newlines/tabs)
  return text.slice(0, CONFIG.maxInputLength).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// ─── System Prompt Builder ───────────────────────────────────────────────────

async function buildSystemPrompt(userName, userRole) {
  const announcementRow = await db.get('SELECT COUNT(*) as c FROM announcements');
  const classRow = await db.get('SELECT COUNT(*) as c FROM classes');
  const studentRow = await db.get('SELECT COUNT(*) as c FROM students');
  const teacherRow = await db.get('SELECT COUNT(*) as c FROM teachers');

  const announcementCount = announcementRow?.c || 0;
  const classCount = classRow?.c || 0;
  const studentCount = studentRow?.c || 0;
  const teacherCount = teacherRow?.c || 0;

  const recentAnnouncements = await db.all(`
    SELECT title, content, created_at FROM announcements
    ORDER BY created_at DESC LIMIT 3
  `);

  const classes = await db.all(`
    SELECT c.name, c.schedule, c.room, u.name as teacher
    FROM classes c LEFT JOIN users u ON c.teacher_id = u.id
    ORDER BY c.name
  `);

  // Sanitize user name to prevent prompt injection
  const safeName = String(userName || 'User')
    .replace(/[<>{}[\]\\]/g, '')
    .slice(0, 50);
  const safeRole = String(userRole || 'student').replace(/[^a-z]/g, '');

  return `You are SchoolHub AI, the intelligent assistant for a school management system.

## Your Role
- Help students, teachers, and administrators with school-related questions
- Provide accurate information from the school database using query tools
- Be friendly, concise, and helpful
- Support both English and Myanmar language

## Current User
- Name: ${safeName}
- Role: ${safeRole}

## School Context
- ${announcementCount} announcements posted
- ${classCount} classes available
- ${studentCount} students enrolled
- ${teacherCount} teachers on staff

## Recent Announcements
${recentAnnouncements.map((a, i) => `${i + 1}. ${a.title} — ${a.content.substring(0, 80)}...`).join('\n')}

## Available Classes
${classes.map((c) => `- ${c.name} | ${c.schedule || 'TBA'} | Room: ${c.room || 'TBA'} | Teacher: ${c.teacher || 'TBA'}`).join('\n')}

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

async function getConversationHistory(userId) {
  const rows = await db.all(
    `
    SELECT message, reply FROM chat_messages
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,
    [userId, CONFIG.maxHistoryMessages]
  );

  return rows.reverse();
}

// ─── Tool-Augmented Chat ─────────────────────────────────────────────────────

async function getAIReply(message, userName, userRole, userId) {
  // Sanitize input
  const cleanMessage = sanitizeInput(message);
  if (!cleanMessage) {
    return 'Please enter a message.';
  }

  // Check cache
  const cached = getCachedResponse(cleanMessage, userRole);
  if (cached) {
    return cached;
  }

  // Build messages with history
  const history = await getConversationHistory(userId);
  const messages = [];

  for (const row of history) {
    if (row.message) messages.push({ role: 'user', content: row.message });
    if (row.reply) messages.push({ role: 'assistant', content: row.reply });
  }

  messages.push({ role: 'user', content: cleanMessage });

  const tools = getToolDefinitions();
  const userContext = { id: userId, name: userName, role: userRole };
  const anthropic = getClient();
  const systemPrompt = await buildSystemPrompt(userName, userRole);

  let response;
  try {
    response = await anthropic.messages.create({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      system: systemPrompt,
      messages,
      tools,
    });
  } catch (err) {
    console.error('[AI] API call failed:', err.message);
    throw err;
  }

  // Handle tool calls with error protection
  let rounds = 0;
  while (response.stop_reason === 'tool_use' && rounds < CONFIG.maxToolRounds) {
    rounds++;
    const toolResults = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        try {
          console.log(`[AI] Tool call: ${block.name}`);
          const result = executeTool(block.name, userContext, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result, null, 2),
          });
        } catch (toolErr) {
          console.error(`[AI] Tool ${block.name} failed:`, toolErr.message);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: 'Tool execution failed' }),
            is_error: true,
          });
        }
      }
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    try {
      response = await anthropic.messages.create({
        model: CONFIG.model,
        max_tokens: CONFIG.maxTokens,
        system: systemPrompt,
        messages,
        tools,
      });
    } catch (err) {
      console.error('[AI] Follow-up API call failed:', err.message);
      break;
    }
  }

  // Extract response
  const textBlock = response.content.find((b) => b.type === 'text');
  const reply = textBlock ? textBlock.text : 'I could not generate a response. Please try again.';

  // Cache if no tools used
  if (rounds === 0) {
    setCachedResponse(cleanMessage, userRole, reply);
  }

  return reply;
}

module.exports = { getAIReply, CONFIG };
