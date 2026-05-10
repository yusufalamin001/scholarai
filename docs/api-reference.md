# ScholarAI — API Reference

Base URL: `http://localhost:8000` (dev) | `https://your-render-url.onrender.com` (prod)

All protected endpoints require: `Authorization: Bearer <supabase_jwt_token>`

---

## Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register new user (name, email, password, faculty) |
| POST | /auth/login | Login, returns JWT token |
| GET  | /auth/me | Get current user profile |

## Courses
| Method | Endpoint | Description |
|---|---|---|
| GET    | /courses | List all courses for current user |
| POST   | /courses | Create a new course |
| GET    | /courses/{id} | Get course detail + documents |
| DELETE | /courses/{id} | Delete course + all its documents |

## Documents
| Method | Endpoint | Description |
|---|---|---|
| POST   | /documents/{course_id}/upload | Upload PDF to course |
| GET    | /documents/{course_id} | List documents for a course |
| DELETE | /documents/{doc_id} | Delete document |

## AI Query
| Method | Endpoint | Description |
|---|---|---|
| POST | /query | Ask a question. Body: `{course_id, question}` |

## Quiz
| Method | Endpoint | Description |
|---|---|---|
| POST | /quiz/generate | Generate quiz. Body: `{course_id, topic, num_questions}` |
| POST | /quiz/submit | Submit answers. Body: `{quiz_id, answers[]}` |

## Progress
| Method | Endpoint | Description |
|---|---|---|
| GET | /progress/{course_id} | Get topic coverage for a course |

## Study Rooms
| Method | Endpoint | Description |
|---|---|---|
| POST | /rooms | Create a study room |
| POST | /rooms/{id}/join | Join a room by invite code |
| GET  | /rooms | List rooms current user is in |
