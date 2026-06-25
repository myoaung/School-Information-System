<!--
Copy this file to member-proposals/<your-github-username>.md and fill it in.
Filename casing doesn't matter (WythWin.md or wythwin.md both work).
This is YOUR proposal — the relative-project you built in Chapter 2.
Sections 1-3 (Gist/Story/Why) due Chapter 2. Sections 4-6 due Chapter 3.
-->

# SchoolHub — Proposal by @myoaung

## Gist

A simple school web application where students, teachers, and parents can access class updates, announcements, and school information in one place.

## Story

Aye Aye is a secondary school student who often misses updates because announcements are shared in different places and sometimes forgotten. Her teacher also spends extra time repeating notices to students and parents. A school web app would help everyone stay connected with the latest information without confusion or delay.

## Why

This project makes school communication faster and more organized. It reduces missed announcements, saves time for teachers, and helps students and parents stay informed easily.

## Why Not

- This is not a full school management system with payroll or finance modules.
- It will not include online exams or grading automation at first.
- It will not support mobile app development in the first version.

## Tech Spec

**Stack:**

- **Frontend:** React.js with Tailwind CSS
- **Backend:** Node.js and Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT

**Main Pieces:**

- **User Accounts:** Separate roles for students, teachers, and admins.
- **Announcements:** Teachers or admins can post school news and class updates.
- **Class Information:** Students can view schedules, notices, and important documents.
- **Contact & Support:** A simple contact page for school inquiries.

## Definition of Done

- [ ] Users can register and log in with different roles
- [ ] Admin or teacher can create and publish announcements
- [ ] Students can view announcements and school updates
- [ ] Users can see basic class information and notices
- [ ] The app works properly on desktop and mobile screens
