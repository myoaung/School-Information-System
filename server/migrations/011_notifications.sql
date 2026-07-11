-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id),
  email_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  push_enabled INTEGER DEFAULT 1,
  attendance_alerts INTEGER DEFAULT 1,
  fee_reminders INTEGER DEFAULT 1,
  exam_notices INTEGER DEFAULT 1,
  announcements INTEGER DEFAULT 1,
  emergency_alerts INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification delivery log
CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER REFERENCES notifications(id),
  channel TEXT CHECK(channel IN ('in_app','email','sms','push')) NOT NULL,
  status TEXT CHECK(status IN ('pending','sent','failed')) DEFAULT 'pending',
  recipient TEXT,
  sent_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
