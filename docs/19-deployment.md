# Deployment Guide

## Purpose

This document describes the deployment architecture, environment configuration, deployment workflow, and operational considerations for the **SchoolHub – School Information System**.

---

# Deployment Overview

SchoolHub is deployed using **Vercel** as the hosting platform. The application consists of a React frontend and an Express backend running as Vercel Serverless Functions.

## Deployment Summary

| Component        | Technology                           |
| ---------------- | ------------------------------------ |
| Frontend         | React 19 + Vite                      |
| Backend          | Express.js                           |
| Hosting Platform | Vercel                               |
| API Runtime      | Vercel Serverless Functions          |
| Database         | SQLite (better-sqlite3)              |
| Authentication   | JWT                                  |
| Version Control  | GitHub                               |
| CI/CD            | GitHub → Vercel Automatic Deployment |

---

# Deployment Architecture

```text
                     Users
                        │
                        ▼
              Vercel Edge Network
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
 React Frontend                  Static Assets
        │
        ▼
 Express Serverless API
        │
        ▼
 SQLite Database
```

---

# Deployment Workflow

The application is automatically deployed whenever changes are pushed to the `main` branch.

```text
Developer
     │
     ▼
Git Commit
     │
     ▼
GitHub Repository
     │
     ▼
Vercel detects changes
     │
     ▼
Install Dependencies
     │
     ▼
Build Application
     │
     ▼
Deploy Serverless Functions
     │
     ▼
Production Website
```

---

# Frontend Deployment

## Framework

- React 19
- Vite
- Tailwind CSS

## Build Command

```bash
npm run build
```

## Output Directory

```text
client/dist
```

---

# Backend Deployment

The backend is implemented using **Express.js** and deployed as **Vercel Serverless Functions**.

Backend responsibilities include:

- Authentication
- Authorization
- Student Management
- Teacher Management
- Curriculum Management
- Announcement Management
- Chat API
- Contact Management

---

# Database

The current implementation uses SQLite via `better-sqlite3`.

## Advantages

- Simple setup
- Fast development
- No external database service required
- Suitable for demonstrations and academic projects

## Current Limitation

SQLite is stored within the serverless runtime.

Since Vercel Serverless Functions use ephemeral storage, SQLite is appropriate for development and demonstrations but is **not recommended for production environments requiring persistent data**.

Future production deployments should migrate to:

- PostgreSQL
- MySQL
- Supabase
- Neon
- PlanetScale

---

# Environment Variables

## Required Variables

| Variable   | Description                       |
| ---------- | --------------------------------- |
| JWT_SECRET | Secret key for JWT authentication |
| CLIENT_URL | Frontend origin used for CORS     |
| PORT       | Local development server port     |

Configure these variables in the Vercel Project Settings.

---

# CI/CD Pipeline

Deployment is fully automated.

```text
Developer

↓

Push to GitHub

↓

Vercel detects commit

↓

Install packages

↓

Build frontend

↓

Build serverless API

↓

Deploy

↓

Production
```

---

# Security

Current deployment includes:

- HTTPS (provided by Vercel)
- JWT Authentication
- Password hashing using bcryptjs
- Role-Based Access Control (RBAC)
- Protected API endpoints
- CORS configuration
- Environment variable management

---

# Monitoring

Current monitoring methods:

- Vercel Deployment Logs
- Vercel Function Logs
- GitHub Commit History

Future enhancements:

- Vercel Analytics
- Sentry
- UptimeRobot

---

# Rollback Strategy

If a deployment introduces issues:

1. Open the Vercel Dashboard.
2. Navigate to **Deployments**.
3. Select the previous successful deployment.
4. Promote that deployment to Production.

---

# Production Considerations

For future production deployments, the following improvements are recommended:

- Replace SQLite with PostgreSQL
- Store uploaded files in AWS S3 or Cloudinary
- Add Redis caching
- Enable centralized logging
- Configure automated database backups
- Add performance monitoring
- Enable custom domain and SSL configuration

---

# Deployment Checklist

Before each production deployment:

- Source code committed to GitHub
- Application builds successfully
- Environment variables configured
- JWT secret configured
- API endpoints verified
- Authentication tested
- RBAC permissions verified
- Frontend and backend communication validated

---

# Live Deployment

| Resource          | URL                                                  |
| ----------------- | ---------------------------------------------------- |
| Live Application  | https://schoolhub-mu.vercel.app                      |
| GitHub Repository | https://github.com/myoaung/School-Information-System |

---

# Conclusion

The current deployment architecture provides a lightweight, cloud-native solution suitable for academic demonstrations and small-scale deployments. Using Vercel enables automatic CI/CD, HTTPS, serverless APIs, and simplified project hosting while maintaining a clean development workflow.

For future production environments, the architecture can be extended by replacing SQLite with a managed relational database and introducing cloud storage, monitoring, and backup services.
