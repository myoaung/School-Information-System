/**
 * Multi-channel Notification Service
 * Supports: In-app, Email (Nodemailer), SMS (Twilio), Push (Web Push)
 */

const { db } = require('../data');

// ─── Configuration ─────────────────────────────────────────────

const config = {
  email: {
    enabled: !!process.env.SMTP_HOST,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  },
  sms: {
    enabled: !!process.env.TWILIO_ACCOUNT_SID,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_PHONE_NUMBER,
  },
  push: {
    enabled: !!process.env.VAPID_PUBLIC_KEY,
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@schoolhub.com',
  },
};

// ─── Email Sender ──────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  if (!config.email.enabled) {
    console.log('[Notification] Email not configured, skipping');
    return { success: false, error: 'Email not configured' };
  }

  try {
    // Dynamic import for nodemailer (optional dependency)
    const nodemailer = await import('nodemailer').catch(() => null);
    if (!nodemailer) {
      return { success: false, error: 'nodemailer not installed' };
    }

    const transporter = nodemailer.default.createTransport(config.email);

    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (err) {
    console.error('[Notification] Email error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── SMS Sender ────────────────────────────────────────────────

async function sendSMS(to, message) {
  if (!config.sms.enabled) {
    console.log('[Notification] SMS not configured, skipping');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    // Dynamic import for twilio (optional dependency)
    const twilio = await import('twilio').catch(() => null);
    if (!twilio) {
      return { success: false, error: 'twilio not installed' };
    }

    const client = twilio.default(config.sms.accountSid, config.sms.authToken);

    await client.messages.create({
      body: message,
      from: config.sms.from,
      to,
    });

    return { success: true };
  } catch (err) {
    console.error('[Notification] SMS error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Push Sender ───────────────────────────────────────────────

async function sendPush(subscription, title, body, url = '/') {
  if (!config.push.enabled) {
    console.log('[Notification] Push not configured, skipping');
    return { success: false, error: 'Push not configured' };
  }

  try {
    const webPush = await import('web-push').catch(() => null);
    if (!webPush) {
      return { success: false, error: 'web-push not installed' };
    }

    webPush.default.setVapidDetails(
      config.push.subject,
      config.push.publicKey,
      config.push.privateKey
    );

    await webPush.default.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        url,
      })
    );

    return { success: true };
  } catch (err) {
    console.error('[Notification] Push error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Create & Send Notification ────────────────────────────────

/**
 * Create an in-app notification and optionally send via other channels
 * @param {Object} options
 * @param {number} options.userId - Recipient user ID
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Type: attendance, fee, exam, announcement, emergency, general
 * @param {string} options.link - Optional URL link
 * @param {string[]} options.channels - Channels to send: ['in_app', 'email', 'sms', 'push']
 * @param {Object} options.data - Additional data for templates
 */
async function createAndSend({
  userId,
  title,
  message,
  type = 'general',
  link = null,
  channels = ['in_app'],
  data = {},
}) {
  const results = {};

  // 1. Create in-app notification
  if (channels.includes('in_app')) {
    try {
      const result = await db.run(
        `INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
         VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [userId, title, message, type, link]
      );
      results.in_app = { success: true, id: result.lastInsertRowid };
    } catch (err) {
      results.in_app = { success: false, error: err.message };
    }
  }

  // 2. Get user preferences and contact info
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return results;

  const prefs = await db.get('SELECT * FROM notification_preferences WHERE user_id = ?', [userId]);

  // 3. Check if user has this notification type enabled
  const typeEnabled = !prefs || prefs[`${type}s`] !== 0;
  if (!typeEnabled && type !== 'emergency') {
    return results;
  }

  // 4. Send email if enabled
  if (channels.includes('email') && prefs?.email_enabled && user.email) {
    const html = generateEmailHtml(title, message, type, link);
    const emailResult = await sendEmail(user.email, title, html);
    results.email = emailResult;

    // Log email
    await logNotification(
      results.in_app?.id,
      'email',
      emailResult.success ? 'sent' : 'failed',
      user.email,
      emailResult.error
    );
  }

  // 5. Send SMS if enabled and phone available
  if (channels.includes('sms') && prefs?.sms_enabled && user.phone) {
    const smsResult = await sendSMS(user.phone, message);
    results.sms = smsResult;

    // Log SMS
    await logNotification(
      results.in_app?.id,
      'sms',
      smsResult.success ? 'sent' : 'failed',
      user.phone,
      smsResult.error
    );
  }

  return results;
}

// ─── Send to Multiple Users ────────────────────────────────────

async function sendToUsers(userIds, options) {
  const results = [];
  for (const userId of userIds) {
    const result = await createAndSend({ ...options, userId });
    results.push({ userId, ...result });
  }
  return results;
}

// ─── Send to Role ──────────────────────────────────────────────

async function sendToRole(role, options) {
  const users = await db.all('SELECT id FROM users WHERE role = ?', [role]);
  return sendToUsers(
    users.map((u) => u.id),
    options
  );
}

// ─── Helper: Generate Email HTML ───────────────────────────────

function generateEmailHtml(title, message, type, link) {
  const typeColors = {
    attendance: '#ef4444',
    fee: '#f59e0b',
    exam: '#8b5cf6',
    announcement: '#3b82f6',
    emergency: '#dc2626',
    general: '#6366f1',
  };

  const color = typeColors[type] || typeColors.general;
  const baseUrl = process.env.APP_URL || 'https://schoolhub-mm.vercel.app';
  const fullLink = link ? `${baseUrl}${link}` : baseUrl;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
        <div style="background:${color};padding:20px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">🏫 SchoolHub</h1>
        </div>
        <div style="padding:30px;">
          <h2 style="color:#1f2937;margin-top:0;">${title}</h2>
          <p style="color:#4b5563;line-height:1.6;">${message}</p>
          ${
            link
              ? `
            <a href="${fullLink}" style="display:inline-block;background:${color};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:15px;">
              View Details
            </a>
          `
              : ''
          }
        </div>
        <div style="background:#f9fafb;padding:15px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            This is an automated notification from SchoolHub.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Helper: Log Notification Delivery ─────────────────────────

async function logNotification(notificationId, channel, status, recipient, errorMessage) {
  try {
    await db.run(
      `INSERT INTO notification_logs (notification_id, channel, status, recipient, sent_at, error_message)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [notificationId, channel, status, recipient, errorMessage || null]
    );
  } catch (err) {
    console.error('[Notification] Log error:', err.message);
  }
}

// ─── Get Notification Stats ────────────────────────────────────

async function getStats() {
  const total = await db.get('SELECT COUNT(*) as c FROM notifications');
  const unread = await db.get('SELECT COUNT(*) as c FROM notifications WHERE read = 0');
  const byType = await db.all('SELECT type, COUNT(*) as count FROM notifications GROUP BY type');
  const byChannel = await db.all(
    'SELECT channel, status, COUNT(*) as count FROM notification_logs GROUP BY channel, status'
  );

  return {
    total: total?.c || 0,
    unread: unread?.c || 0,
    byType: byType || [],
    byChannel: byChannel || [],
  };
}

module.exports = {
  sendEmail,
  sendSMS,
  sendPush,
  createAndSend,
  sendToUsers,
  sendToRole,
  getStats,
  config,
};
