# Testing Strategy

## Purpose

This document describes the testing approach used to verify the functionality, reliability, security, and usability of the SchoolHub – School Information System.

---

# Testing Objectives

The testing process ensures that:

- System requirements are satisfied
- Features function as expected
- Security controls are enforced
- Performance meets acceptable standards
- User workflows operate correctly

---

# Testing Types

## 1. Unit Testing

Purpose

Verify individual functions and components.

Examples

- JWT generation
- Password hashing
- Utility functions
- Chatbot keyword matching

---

## 2. Integration Testing

Purpose

Verify communication between modules.

Examples

- Login → Dashboard
- Authentication → API
- Enrollment → Database
- Chatbot → Database

---

## 3. API Testing

Purpose

Verify REST API endpoints.

Examples

| Endpoint        | Method | Expected Result |
| --------------- | ------ | --------------- |
| /api/auth/login | POST   | JWT Token       |
| /api/classes    | GET    | Class List      |
| /api/chat       | POST   | AI Response     |

---

## 4. User Interface Testing

Verify:

- Navigation
- Forms
- Responsive layout
- Language switching
- Accessibility

---

## 5. Authentication Testing

Verify

- Login
- Logout
- Invalid password
- Expired token
- Unauthorized access

---

## 6. RBAC Testing

Verify permissions for each role.

| Role    | Expected Access        |
| ------- | ---------------------- |
| Admin   | Full access            |
| Teacher | Teaching features only |
| Student | Student features only  |

---

## 7. Functional Testing

Features tested:

- Registration
- Login
- Announcements
- Classes
- Curriculum
- Contact Form
- Chatbot
- Language Switching
- Font Accessibility

---

## 8. Database Testing

Verify:

- CRUD operations
- Foreign key relationships
- Data validation
- Duplicate prevention

---

## 9. Security Testing

Verify:

- JWT authentication
- Password hashing
- Route protection
- SQL injection prevention
- XSS prevention
- CORS configuration

---

## 10. Performance Testing

Measure:

- Page load time
- API response time
- Database query speed

Target:

- Homepage < 2 seconds
- API < 500 ms

---

## 11. Browser Compatibility

Tested Browsers

- Chrome
- Edge
- Firefox

---

## 12. Device Testing

- Desktop
- Tablet
- Mobile

---

# Testing Tools

| Category        | Tool            |
| --------------- | --------------- |
| API Testing     | Postman         |
| Browser Testing | Chrome DevTools |
| Manual Testing  | Browser         |
| Version Control | GitHub          |

---

# Test Results Summary

| Module         | Status    |
| -------------- | --------- |
| Authentication | ✅ Passed |
| Announcements  | ✅ Passed |
| Classes        | ✅ Passed |
| Curriculum     | ✅ Passed |
| Contact        | ✅ Passed |
| Chatbot        | ✅ Passed |
| RBAC           | ✅ Passed |

---

# Known Limitations

- SQLite is intended for development and demonstration purposes.
- Serverless execution may introduce cold-start latency.
- High concurrent traffic has not been benchmarked.

---

# Conclusion

The testing activities demonstrate that the SchoolHub system satisfies the functional requirements for an academic School Information System. Core features, authentication, authorization, API endpoints, and user workflows were successfully validated through manual and integration testing.
