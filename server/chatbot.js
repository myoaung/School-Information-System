const { getDb } = require('./db');

// Rule-based chatbot that answers school questions from the database
function getReply(message, userName, userRole) {
  const db = getDb();
  const msg = message.toLowerCase().trim();

  // --- Greetings ---
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|mingalaba|မင်္ဂလာပါ)/i.test(msg)) {
    const roleGreeting = {
      student: `Hello ${userName}! 👋 I'm your SchoolHub assistant. I can help you with announcements, classes, curriculum, and more. What would you like to know?`,
      teacher: `Hello ${userName}! 👋 Welcome back. I can help you check announcements, class schedules, or curriculum details. How can I assist?`,
      admin: `Hello ${userName}! 👋 Admin dashboard is ready. I can help with announcements, classes, curriculum, or system info. What do you need?`,
    };
    return roleGreeting[userRole] || roleGreeting.student;
  }

  // --- Announcements ---
  if (/announcement|news|update|ကြေညာ|သတင်း/i.test(msg)) {
    const rows = db.prepare(`
      SELECT a.title, a.content, u.name as author, a.created_at
      FROM announcements a LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC LIMIT 5
    `).all();

    if (rows.length === 0) return 'No announcements yet. Check back later!';

    let reply = '📢 **Latest Announcements:**\n\n';
    rows.forEach((r, i) => {
      reply += `${i + 1}. **${r.title}**\n   ${r.content.substring(0, 100)}${r.content.length > 100 ? '...' : ''}\n   — ${r.author || 'Admin'}\n\n`;
    });
    reply += 'Visit the Announcements page for full details.';
    return reply;
  }

  // --- Classes ---
  if (/class|schedule|timetable|အတန်း|အချိန်ဇယား/i.test(msg)) {
    const rows = db.prepare(`
      SELECT c.name, c.description, c.schedule, c.room, u.name as teacher,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) as student_count
      FROM classes c LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.name
    `).all();

    if (rows.length === 0) return 'No classes available yet.';

    let reply = '📚 **Available Classes:**\n\n';
    rows.forEach((r) => {
      reply += `• **${r.name}** — ${r.schedule || 'TBA'} | Room: ${r.room || 'TBA'} | Teacher: ${r.teacher || 'TBA'} | ${r.student_count} student(s)\n`;
    });
    reply += '\nVisit the Classes page to see more details or enroll.';
    return reply;
  }

  // --- Curriculum ---
  if (/curriculum|subject|grade|သင်ရိုး|ဘာသာရပ်|အတန်း/i.test(msg)) {
    const levels = db.prepare('SELECT * FROM education_levels ORDER BY id').all();
    const grades = db.prepare('SELECT g.*, el.name as level_name FROM grades g JOIN education_levels el ON g.education_level_id = el.id ORDER BY g.display_order').all();

    let reply = '🎓 **Myanmar Basic Education Curriculum:**\n\n';
    for (const level of levels) {
      const levelGrades = grades.filter(g => g.level_name === level.name);
      reply += `**${level.name}**: ${levelGrades.map(g => g.name).join(', ')}\n`;
    }
    reply += '\nVisit the Curriculum page to see subjects by grade.';
    return reply;
  }

  // --- Enrollment ---
  if (/enroll|register|sign\s*up|စာရင်းသွင်း/i.test(msg)) {
    if (userRole === 'student') {
      return '📝 **How to Enroll:**\n\n1. Go to the **Classes** page\n2. Browse available classes\n3. Contact your teacher or admin to enroll you\n\nYou can also ask your admin for help with enrollment.';
    }
    return '📝 Students can enroll in classes from the Classes page. Admins can manage enrollments from the admin dashboard.';
  }

  // --- Contact ---
  if (/contact|email|phone|reach|ဆက်သွယ်/i.test(msg)) {
    return '📞 **Contact Us:**\n\n• **Email:** info@schoolhub.com\n• **Phone:** (555) 123-4567\n• **Address:** 123 School Street, City, State 12345\n\nOr use the Contact page to send us a message directly.';
  }

  // --- Password / Account ---
  if (/password|account|profile|login|အကောင့်/i.test(msg)) {
    return '🔐 **Account Help:**\n\n• Your profile info is on the **Dashboard** page\n• To change your password, please contact the admin\n• Demo accounts use password: `password123`';
  }

  // --- Help / What can you do ---
  if (/help|what can you|feature|assist|ကူညီ|ဘာလုပ်/i.test(msg)) {
    return `🤖 **I can help you with:**\n\n• 📢 **Announcements** — "Show me recent announcements"\n• 📚 **Classes** — "What classes are available?"\n• 🎓 **Curriculum** — "What subjects are taught?"\n• 📝 **Enrollment** — "How do I enroll in a class?"\n• 📞 **Contact** — "How can I contact the school?"\n• 🔐 **Account** — "Help with my account"\n\nJust type your question naturally!`;
  }

  // --- Thank you ---
  if (/thank|thanks|ကျေးဇူး/i.test(msg)) {
    return `You're welcome, ${userName}! 😊 Let me know if you need anything else.`;
  }

  // --- Default fallback ---
  return `I'm not sure I understand that, ${userName}. Here's what I can help with:\n\n• 📢 Announcements — type "announcements"\n• 📚 Classes — type "classes"\n• 🎓 Curriculum — type "curriculum"\n• 📝 Enrollment — type "enroll"\n• 📞 Contact — type "contact"\n• ❓ Help — type "help"\n\nTry asking in English or Myanmar!`;
}

module.exports = { getReply };
