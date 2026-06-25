---
name: reply-templates
description: Use when the user wants to create consistent message formats for bots and chats.
---

# Reply Templates

1. Define template structure:
   - **Greeting** — Welcome messages
   - **Response** — Standard replies
   - **Error** — Error messages
   - **Confirmation** — Action confirmations
   - **Notification** — Alert messages
2. Support variables:
   - `{{user_name}}` — User's name
   - `{{date}}` — Current date
   - `{{time}}` — Current time
   - `{{count}}` — Number of items
   - `{{link}}` — URL link
3. Format options:
   - Plain text
   - Markdown
   - HTML (for Telegram)
   - Embed (for Discord)
4. Maintain consistency across all bot responses.
