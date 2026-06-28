/**
 * AI Scheduler Engine
 * Phase 5 — Constraint-based timetable generation and optimization
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getDb } = require('./db');

const CONFIG = { model: 'claude-haiku-4-5-20251001', maxTokens: 2048 };

// ─── Constraint Collection ──────────────────────────────────────────────────────

/**
 * Collect all scheduling constraints from the database.
 */
function collectConstraints() {
  const db = getDb();

  // Teachers with their assigned classes
  const teachers = db.prepare(`
    SELECT u.id, u.name, t.teacher_id as code, t.specialization
    FROM teachers t
    JOIN users u ON t.user_id = u.id
    WHERE t.status = 'active'
  `).all();

  // Classes with their current teacher assignments
  const classes = db.prepare(`
    SELECT c.id, c.name, c.teacher_id, u.name as teacher_name,
           c.schedule, c.room
    FROM classes c
    LEFT JOIN users u ON c.teacher_id = u.id
  `).all();

  // Subjects with their grade requirements
  const subjects = db.prepare(`
    SELECT s.id, s.code, s.name, s.category,
           COUNT(gs.grade_id) as grade_count
    FROM subjects s
    LEFT JOIN grade_subjects gs ON s.id = gs.subject_id
    GROUP BY s.id
  `).all();

  // Grade-subject mappings (which subjects are required for which grades)
  const gradeSubjects = db.prepare(`
    SELECT g.code as grade_code, g.name as grade_name,
           s.code as subject_code, s.name as subject_name,
           gs.weekly_periods, gs.is_required
    FROM grade_subjects gs
    JOIN grades g ON gs.grade_id = g.id
    JOIN subjects s ON gs.subject_id = s.id
    ORDER BY g.display_order, s.code
  `).all();

  // Existing timetable entries (to avoid conflicts)
  const existingEntries = db.prepare(`
    SELECT t.*, s.name as subject_name, u.name as teacher_name,
           c.name as class_name
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN users u ON t.teacher_id = u.id
    LEFT JOIN classes c ON t.class_id = c.id
    ORDER BY t.day_of_week, t.start_time
  `).all();

  // Rooms (extracted from classes and timetable)
  const rooms = db.prepare(`
    SELECT DISTINCT room FROM (
      SELECT room FROM classes WHERE room IS NOT NULL
      UNION
      SELECT room FROM timetable WHERE room IS NOT NULL
    ) ORDER BY room
  `).all().map(r => r.room);

  // Time slots (standard school hours)
  const timeSlots = generateTimeSlots();

  return {
    teachers,
    classes,
    subjects,
    gradeSubjects,
    existingEntries,
    rooms,
    timeSlots,
  };
}

/**
 * Generate standard time slots for a school day.
 */
function generateTimeSlots() {
  const slots = [];
  const startHour = 8;
  const endHour = 16;
  const periodMinutes = 50;
  const breakMinutes = 10;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += periodMinutes + breakMinutes) {
      const startH = hour + Math.floor(min / 60);
      const startM = min % 60;
      const endMin = min + periodMinutes;
      const endH = hour + Math.floor(endMin / 60);
      const endM = endMin % 60;

      if (endH <= endHour) {
        slots.push({
          start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
          end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        });
      }
    }
  }

  return slots;
}

// ─── Conflict Detection ─────────────────────────────────────────────────────────

/**
 * Detect all scheduling conflicts in the current timetable.
 */
function detectConflicts() {
  const db = getDb();

  const entries = db.prepare(`
    SELECT t.*, s.name as subject_name, u.name as teacher_name,
           c.name as class_name
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN users u ON t.teacher_id = u.id
    LEFT JOIN classes c ON t.class_id = c.id
    ORDER BY t.day_of_week, t.start_time
  `).all();

  const conflicts = [];

  // Check each pair of entries
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];

      // Same day check
      if (a.day_of_week !== b.day_of_week) continue;

      // Time overlap check
      if (a.start_time < b.end_time && b.start_time < a.end_time) {
        // Teacher conflict
        if (a.teacher_id && b.teacher_id && a.teacher_id === b.teacher_id) {
          conflicts.push({
            type: 'teacher',
            severity: 'high',
            entryA: { id: a.id, subject: a.subject_name, class: a.class_name, time: `${a.start_time}-${a.end_time}` },
            entryB: { id: b.id, subject: b.subject_name, class: b.class_name, time: `${b.start_time}-${b.end_time}` },
            message: `Teacher "${a.teacher_name}" is double-booked on ${getDayName(a.day_of_week)} at ${a.start_time}-${a.end_time}`,
          });
        }

        // Room conflict
        if (a.room && b.room && a.room === b.room && a.class_id !== b.class_id) {
          conflicts.push({
            type: 'room',
            severity: 'medium',
            entryA: { id: a.id, subject: a.subject_name, class: a.class_name, time: `${a.start_time}-${a.end_time}` },
            entryB: { id: b.id, subject: b.subject_name, class: b.class_name, time: `${b.start_time}-${b.end_time}` },
            message: `Room "${a.room}" is double-booked on ${getDayName(a.day_of_week)} at ${a.start_time}-${a.end_time}`,
          });
        }

        // Class conflict
        if (a.class_id === b.class_id) {
          conflicts.push({
            type: 'class',
            severity: 'high',
            entryA: { id: a.id, subject: a.subject_name, time: `${a.start_time}-${a.end_time}` },
            entryB: { id: b.id, subject: b.subject_name, time: `${b.start_time}-${b.end_time}` },
            message: `Class "${a.class_name}" has overlapping lessons on ${getDayName(a.day_of_week)}`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Get day name from day_of_week number.
 */
function getDayName(day) {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day] || 'Unknown';
}

// ─── Schedule Generator ─────────────────────────────────────────────────────────

/**
 * Generate an optimal schedule for a class using constraint satisfaction.
 * Returns proposed timetable entries (not yet saved to DB).
 */
function generateSchedule(classId, options = {}) {
  const db = getDb();
  const { respectExisting = true, preferredDays = [0, 1, 2, 3, 4] } = options;

  // Get class info
  const classInfo = db.prepare(`
    SELECT c.*, u.name as teacher_name
    FROM classes c
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE c.id = ?
  `).get(classId);

  if (!classInfo) return { error: 'Class not found' };

  // Get required subjects for this class's grade
  const gradeId = db.prepare(`
    SELECT grade_id FROM students
    WHERE user_id IN (SELECT student_id FROM enrollments WHERE class_id = ?)
    LIMIT 1
  `).get(classId)?.grade_id;

  let requiredSubjects;
  if (gradeId) {
    requiredSubjects = db.prepare(`
      SELECT s.id, s.code, s.name, gs.weekly_periods, gs.is_required
      FROM grade_subjects gs
      JOIN subjects s ON gs.subject_id = s.id
      WHERE gs.grade_id = ?
      ORDER BY gs.is_required DESC, s.code
    `).all(gradeId);
  } else {
    // Fallback: use subjects from existing timetable
    requiredSubjects = db.prepare(`
      SELECT DISTINCT s.id, s.code, s.name, 2 as weekly_periods, 1 as is_required
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.class_id = ?
    `).all(classId);
  }

  // Get existing entries for this class (to preserve)
  const existingEntries = respectExisting
    ? db.prepare('SELECT * FROM timetable WHERE class_id = ?').all(classId)
    : [];

  // Get all existing entries (for conflict checking)
  const allExisting = db.prepare(`
    SELECT * FROM timetable WHERE class_id != ?
  `).all(classId);

  // Get available teachers for each subject
  const teacherMap = {};
  for (const subj of requiredSubjects) {
    // Find teachers who teach this subject (based on specialization or existing assignments)
    const teachers = db.prepare(`
      SELECT DISTINCT u.id, u.name
      FROM users u
      JOIN teachers t ON t.user_id = u.id
      WHERE t.status = 'active'
      AND (t.specialization LIKE ? OR u.id IN (
        SELECT teacher_id FROM timetable WHERE subject_id = ?
      ))
    `).all(`%${subj.name}%`, subj.id);

    teacherMap[subj.id] = teachers.length > 0 ? teachers : [{ id: classInfo.teacher_id, name: classInfo.teacher_name }];
  }

  // Generate schedule using greedy algorithm
  const proposed = [];
  const usedSlots = new Set(); // "day-startTime-endTime-teacherId"
  const classSlots = new Set(); // "day-startTime-endTime"

  // Mark existing entries
  for (const entry of existingEntries) {
    usedSlots.add(`${entry.day_of_week}-${entry.start_time}-${entry.end_time}-${entry.teacher_id}`);
    classSlots.add(`${entry.day_of_week}-${entry.start_time}-${entry.end_time}`);
  }

  // Standard time slots
  const timeSlots = [
    { start: '08:00', end: '08:50' },
    { start: '09:00', end: '09:50' },
    { start: '10:00', end: '10:50' },
    { start: '11:00', end: '11:50' },
    { start: '13:00', end: '13:50' },
    { start: '14:00', end: '14:50' },
    { start: '15:00', end: '15:50' },
  ];

  // Distribute subjects across the week
  for (const subj of requiredSubjects) {
    const periods = subj.weekly_periods || 2;
    const teachers = teacherMap[subj.id];
    let assigned = 0;

    // Try to assign each period
    for (const day of preferredDays) {
      if (assigned >= periods) break;

      for (const slot of timeSlots) {
        if (assigned >= periods) break;

        const classKey = `${day}-${slot.start}-${slot.end}`;
        if (classSlots.has(classKey)) continue;

        // Find available teacher
        let assignedTeacher = null;
        for (const teacher of teachers) {
          const teacherKey = `${day}-${slot.start}-${slot.end}-${teacher.id}`;
          if (!usedSlots.has(teacherKey)) {
            assignedTeacher = teacher;
            break;
          }
        }

        if (!assignedTeacher) continue;

        // Check room availability
        const room = classInfo.room || 'TBA';
        const roomConflict = allExisting.some(e =>
          e.day_of_week === day &&
          e.start_time < slot.end &&
          e.end_time > slot.start &&
          e.room === room
        );

        if (roomConflict) continue;

        // Assign this slot
        proposed.push({
          class_id: classId,
          subject_id: subj.id,
          subject_name: subj.name,
          teacher_id: assignedTeacher.id,
          teacher_name: assignedTeacher.name,
          day_of_week: day,
          day_name: getDayName(day),
          start_time: slot.start,
          end_time: slot.end,
          room: room,
          is_new: true,
        });

        usedSlots.add(`${day}-${slot.start}-${slot.end}-${assignedTeacher.id}`);
        classSlots.add(classKey);
        assigned++;
      }
    }
  }

  return {
    class: classInfo,
    existing: existingEntries,
    proposed: proposed,
    total_periods: proposed.length + existingEntries.length,
    new_periods: proposed.length,
    subjects_covered: [...new Set(proposed.map(p => p.subject_name))],
  };
}

// ─── AI Schedule Suggestions ────────────────────────────────────────────────────

const SCHEDULE_PROMPT = `You are a school scheduling expert. Analyze the timetable and suggest improvements.

Rules:
- Focus on reducing teacher workload gaps
- Minimize student back-to-back difficult subjects
- Ensure adequate breaks between classes
- Balance subjects across the week
- Keep suggestions practical and specific
- Output clean HTML using <ul><li> format`;

/**
 * Generate AI suggestions for improving an existing schedule.
 */
async function generateScheduleSuggestions(classId) {
  const db = getDb();

  const entries = db.prepare(`
    SELECT t.*, s.name as subject_name, u.name as teacher_name
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN users u ON t.teacher_id = u.id
    WHERE t.class_id = ?
    ORDER BY t.day_of_week, t.start_time
  `).all(classId);

  if (entries.length === 0) {
    return '<p>No timetable entries found for this class.</p>';
  }

  // Build schedule summary
  const scheduleByDay = {};
  entries.forEach(e => {
    const day = getDayName(e.day_of_week);
    if (!scheduleByDay[day]) scheduleByDay[day] = [];
    scheduleByDay[day].push(`${e.start_time}-${e.end_time}: ${e.subject_name} (${e.teacher_name})`);
  });

  let scheduleText = '';
  for (const [day, lessons] of Object.entries(scheduleByDay)) {
    scheduleText += `\n${day}:\n  ${lessons.join('\n  ')}`;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return generateFallbackSuggestions(entries, scheduleByDay);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      system: SCHEDULE_PROMPT,
      messages: [{
        role: 'user',
        content: `Current timetable (${entries.length} periods/week):${scheduleText}\n\nSuggest improvements.`,
      }],
    });

    const text = response.content.find(b => b.type === 'text');
    return text?.text || generateFallbackSuggestions(entries, scheduleByDay);
  } catch (err) {
    console.error('[Scheduler] AI suggestions failed:', err.message);
    return generateFallbackSuggestions(entries, scheduleByDay);
  }
}

/**
 * Fallback schedule suggestions (template-based).
 */
function generateFallbackSuggestions(entries, scheduleByDay) {
  const suggestions = [];

  // Check for gaps in the schedule
  const days = Object.keys(scheduleByDay);
  for (const day of days) {
    const lessons = scheduleByDay[day];
    if (lessons.length === 1) {
      suggestions.push(`<li><strong>${day}:</strong> Only one lesson scheduled. Consider adding more subjects to maximize this day.</li>`);
    }
  }

  // Check for subject distribution
  const subjectCounts = {};
  entries.forEach(e => {
    subjectCounts[e.subject_name] = (subjectCounts[e.subject_name] || 0) + 1;
  });

  const subjects = Object.entries(subjectCounts);
  const maxCount = Math.max(...subjects.map(([, c]) => c));
  const minCount = Math.min(...subjects.map(([, c]) => c));

  if (maxCount - minCount > 2) {
    const heavy = subjects.filter(([, c]) => c === maxCount).map(([s]) => s);
    suggestions.push(`<li><strong>Balance:</strong> ${heavy.join(', ')} ${heavy.length > 1 ? 'have' : 'has'} ${maxCount} periods while some subjects have only ${minCount}. Consider redistributing.</li>`);
  }

  // Check for teacher workload
  const teacherCounts = {};
  entries.forEach(e => {
    teacherCounts[e.teacher_name] = (teacherCounts[e.teacher_name] || 0) + 1;
  });

  const teachers = Object.entries(teacherCounts);
  if (teachers.length > 1) {
    const heavyTeacher = teachers.reduce((a, b) => a[1] > b[1] ? a : b);
    if (heavyTeacher[1] > entries.length * 0.5) {
      suggestions.push(`<li><strong>Workload:</strong> ${heavyTeacher[0]} teaches ${heavyTeacher[1]} of ${entries.length} periods. Consider distributing more evenly.</li>`);
    }
  }

  // Check for back-to-back same subject
  const dayNumbers = [...new Set(entries.map(e => e.day_of_week))];
  for (const day of dayNumbers) {
    const dayEntries = entries.filter(e => e.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 0; i < dayEntries.length - 1; i++) {
      if (dayEntries[i].subject_id === dayEntries[i + 1].subject_id) {
        suggestions.push(`<li><strong>${getDayName(day)}:</strong> "${dayEntries[i].subject_name}" is scheduled back-to-back. Consider splitting with another subject.</li>`);
      }
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('<li><strong>Good job!</strong> The schedule looks well-balanced. No major improvements needed.</li>');
  }

  return `<ul>${suggestions.join('')}</ul>`;
}

// ─── Apply Schedule ─────────────────────────────────────────────────────────────

/**
 * Save proposed schedule entries to the database.
 */
function applySchedule(proposedEntries) {
  const db = getDb();

  const insert = db.prepare(`
    INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const results = [];
  const applyInsert = db.transaction(() => {
    for (const entry of proposedEntries) {
      const result = insert.run(
        entry.class_id,
        entry.subject_id,
        entry.teacher_id,
        entry.day_of_week,
        entry.start_time,
        entry.end_time,
        entry.room
      );
      results.push(result.lastInsertRowid);
    }
  });

  applyInsert();
  return results;
}

/**
 * Clear all timetable entries for a class.
 */
function clearSchedule(classId) {
  const db = getDb();
  return db.prepare('DELETE FROM timetable WHERE class_id = ?').run(classId);
}

module.exports = {
  collectConstraints,
  detectConflicts,
  generateSchedule,
  generateScheduleSuggestions,
  applySchedule,
  clearSchedule,
  getDayName,
};
