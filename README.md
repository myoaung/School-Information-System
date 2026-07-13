# 🏫 SchoolHub — School Information System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A full-stack school management platform built with React, Express, and Supabase — designed for schools in Myanmar with multi-language support.

![Homepage](screenshots/01-homepage.png)

## ✨ Features

| Module | Description |
|--------|-------------|
| 📚 **Student Management** | Register, view, and manage student records with profile photos |
| 👩‍🏫 **Teacher Management** | Teacher profiles, workload tracking, and class assignments |
| 📋 **Attendance** | Daily attendance tracking with present/absent/late/leave status |
| 📅 **Timetable** | Weekly class scheduling with AI-powered auto-generation |
| 📖 **Courses & Curriculum** | Course management with grade-level subject mapping |
| 📝 **Assignments & Quizzes** | Create, submit, and grade assessments |
| 📊 **Gradebook** | GPA tracking and final grade computation |
| 📈 **Reports** | School overview stats and individual student report cards |
| 📢 **Announcements** | School-wide announcements with grade/class filtering |
| 💬 **AI Chat Assistant** | Built-in chat widget for instant help |
| 🌍 **Multi-language** | English and Myanmar (မြန်မာ) language support |
| 🔐 **Role-based Access** | Admin, Teacher, Student, and Parent roles |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Express.js + Supabase (PostgreSQL) |
| Auth | JWT with role-based access control |
| AI Features | OpenAI integration for chat & schedule generation |
| Deployment | Vercel (serverless) |
| PWA | Service worker for offline support |

## 📸 Screenshots

| Homepage | Login | Dashboard |
|----------|-------|-----------|
| ![Homepage](screenshots/01-homepage.png) | ![Login](screenshots/02-login.png) | ![Dashboard](screenshots/07-dashboard.png) |

| Announcements | Classes | Contact |
|---------------|---------|---------|
| ![Announcements](screenshots/04-announcements.png) | ![Classes](screenshots/05-classes.png) | ![Contact](screenshots/06-contact.png) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/myoaung/School-Information-System.git
cd School-Information-System

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development servers
npm run dev
```

The app starts at:
- **Client:** http://localhost:5173
- **Server:** http://localhost:5000

### Default Login

| Role | Email | Password |
|------|-------|----------|
| 🔑 Admin | admin@school.com | admin123 |
| 👩‍🏫 Teacher | teacher@school.com | teacher123 |
| 🎓 Student | student@school.com | student123 |

## 📁 Project Structure

```
School-Information-System/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (Auth, Language)
│   │   ├── pages/          # Page components (28 pages)
│   │   └── services/       # API service layer
│   └── index.html
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── middleware/          # Auth & role middleware
│   ├── utils/              # Error handling utilities
│   └── db.js               # Database connection
├── screenshots/            # App screenshots
├── docs/                   # Project documentation
└── vercel.json             # Deployment configuration
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/students` | List students |
| GET | `/api/teachers` | List teachers |
| GET | `/api/classes` | List classes |
| GET | `/api/announcements` | List announcements |
| GET | `/api/timetable` | Get timetable |
| POST | `/api/ai/chat` | AI chat assistant |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for schools in Myanmar**
