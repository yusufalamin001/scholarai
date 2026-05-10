<div align="center">

# 🎓 ScholarAI

### An AI-Powered, Discipline-Aware Study Assistant for Nigerian University Students

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C?style=flat-square)](https://langchain.com/)
[![Gemini API](https://img.shields.io/badge/Gemini-Google-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

> **Software Engineering II — Group Project | Lagos State University | 2024/2025 Session**

[Live Demo](#) · [API Docs](./docs/api-reference.md) · [Database Schema](./docs/database-schema.md)

</div>

---

## 📖 About ScholarAI

ScholarAI is a full-stack, AI-powered web application that helps university students study smarter. Students upload their course materials, ask questions grounded in their own documents, track what topics they have covered, generate mock exam quizzes, collaborate with peers in shared study rooms, and plan their study schedule — all from a single responsive platform that works on desktop and mobile.

What makes ScholarAI different from generic AI tools is its **discipline-aware AI layer**. The system automatically adapts its behaviour based on the student's faculty — providing step-by-step engineering calculations with equation rendering for Engineering students, statute citation and legal reasoning for Law students, clinical explanations for Medical students, and general academic support for everyone else.

The platform is built on a **Retrieval-Augmented Generation (RAG)** architecture, meaning the AI answers questions strictly from the student's own uploaded documents — not from generic internet knowledge.

---

## 🎯 Features

| Feature | Description | Timeline |
|---|---|---|
| 🔐 **Google Auth** | One-click sign in with Google, faculty selection on first login | Week 1 |
| 📚 **Course Management** | Create courses, upload multiple documents per course | Week 1 |
| 🤖 **Discipline-Aware AI Q&A** | Answers grounded in your documents, adapted to your faculty | Week 1 |
| ∑ **Equation Rendering** | KaTeX renders mathematical expressions for Engineering & Sciences | Week 2 |
| 📊 **Topic Progress Tracker** | See which topics you have and have not covered per course | Week 2 |
| 🧪 **Quiz Generator** | AI-generated mock exams from your uploaded materials | Week 2 |
| 👥 **Collaborative Study Rooms** | Share document pools and query together with classmates | Week 3 |
| 📅 **CGPA Study Planner** | AI-generated study schedule based on courses and target grades | Week 3 |
| ⚙️ **Settings & Profile** | Account management, dark/light mode, connected accounts | Week 3 |
| 📱 **Fully Responsive** | Works on desktop and mobile browsers | Throughout |

---

## 🧠 Discipline-Aware AI — Faculty Prompt Library

ScholarAI uses a dynamic system prompt that adapts to the student's faculty at runtime. The RAG pipeline stays identical across all faculties — only the prompt changes:

| Faculty | AI Behaviour |
|---|---|
| ⚙️ Engineering & Sciences | Step-by-step calculations, correct notation, KaTeX rendering, derivations |
| ⚖️ Law | Statute citation, case law references, structured IRAC legal argument |
| 🏥 Medicine & Health Sciences | Anatomy, physiology, pharmacology — clinically relevant, no diagnostic advice |
| 📊 Business & Management | Financial models, frameworks, structured case study analysis |
| 📖 General / Other | Clear, balanced academic tutor style across any subject |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│     Next.js 15 · React · Tailwind CSS · KaTeX · Vercel      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────────────┐
│                        API LAYER                            │
│              FastAPI (Python) · REST Endpoints · Render      │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
┌──────────────▼────────────┐  ┌──────────▼──────────────────┐
│       AI / RAG LAYER      │  │         DATA LAYER           │
│  LangChain · ChromaDB     │  │  Supabase Auth (Google OAuth)│
│  Google Gemini API        │  │  PostgreSQL · Storage Buckets│
│  Faculty Prompt Library   │  │                              │
└───────────────────────────┘  └──────────────────────────────┘
```

### Request Flow
1. Student selects a course and submits a question
2. Next.js frontend calls a FastAPI REST endpoint with a Supabase JWT token
3. Backend authenticates the request and reads the student's faculty
4. Backend loads the appropriate faculty system prompt from the prompt library
5. LangChain retrieves the 5 most relevant chunks from that course's ChromaDB collection
6. Chunks + system prompt + question are sent to the Gemini API
7. Response is returned, rendered on the frontend with KaTeX where needed
8. Interaction is logged to PostgreSQL for the topic progress tracker

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 + React | UI framework, routing, server components |
| Styling | Tailwind CSS | Mobile-first responsive design |
| Equation Rendering | KaTeX | LaTeX math rendering for Engineering & Sciences |
| Backend | FastAPI (Python) | REST API, business logic |
| AI Orchestration | LangChain | RAG pipeline, document loading, chaining |
| Vector Database | ChromaDB | Per-course document collections, similarity search |
| AI — Q&A | Gemini 2.5 Flash | Strong reasoning for student questions |
| AI — Quiz & Summary | Gemini 2.5 Flash-Lite | Cost-efficient for structured generation tasks |
| Auth | Supabase Auth + Google OAuth | Authentication, session management |
| Database | PostgreSQL via Supabase | App data, topic progress, study rooms |
| File Storage | Supabase Storage | Uploaded PDFs and course documents |
| Frontend Deploy | Vercel | Zero-config Next.js deployment |
| Backend Deploy | Render | FastAPI deployment |
| Version Control | GitHub | Source control, CI/CD |

---

## 📁 Repository Structure

```
scholarai/
│
├── frontend/                        # Next.js 15 application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx        # Login — Google + email
│   │   │   └── signup/page.tsx       # Sign up — Google + email + faculty
│   │   ├── (dashboard)/
│   │   │   ├── courses/page.tsx      # Course list + create course
│   │   │   ├── courses/[id]/page.tsx # Course detail + upload + AI chat
│   │   │   ├── progress/page.tsx     # Topic progress tracker
│   │   │   ├── rooms/page.tsx        # Collaborative study rooms
│   │   │   ├── planner/page.tsx      # CGPA study planner
│   │   │   └── settings/page.tsx     # Profile, appearance, accounts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                       # Base components (buttons, inputs, cards)
│   │   ├── chat/                     # AI Q&A interface + KaTeX renderer
│   │   ├── course/                   # Course cards, document list, upload
│   │   ├── progress/                 # Topic tiles, progress bars
│   │   └── quiz/                     # Timer, MCQ layout, score screen
│   ├── lib/
│   │   ├── supabase.ts               # Supabase browser client
│   │   └── api.ts                    # Backend API fetch utility
│   ├── .env.example                  # Copy to .env.local and fill in
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.ts
│
├── backend/                         # FastAPI Python server
│   ├── api/routes/
│   │   ├── auth.py                   # Auth + profile endpoints
│   │   ├── courses.py                # Course CRUD
│   │   ├── documents.py              # File upload + management
│   │   ├── query.py                  # AI Q&A endpoint
│   │   ├── quiz.py                   # Quiz generate + submit
│   │   ├── progress.py               # Topic progress endpoints
│   │   ├── rooms.py                  # Study rooms endpoints
│   │   └── planner.py                # Study planner endpoint
│   ├── models/                       # Pydantic request/response models
│   ├── services/                     # Business logic layer
│   ├── db/client.py                  # Supabase client singleton
│   ├── main.py                       # FastAPI app + route registration
│   ├── requirements.txt
│   └── .env.example                  # Copy to .env and fill in
│
├── ai/                              # RAG pipeline + prompt library
│   ├── pipeline/
│   │   ├── ingestor.py               # PDF → chunks → ChromaDB
│   │   ├── retriever.py              # Similarity search per course
│   │   ├── chain.py                  # Q&A chain — Gemini 2.5 Flash
│   │   ├── summarizer.py             # Summarisation — Gemini 2.5 Flash-Lite
│   │   └── quiz_gen.py               # Quiz generation — Gemini 2.5 Flash-Lite
│   ├── prompts/
│   │   ├── engineering.py
│   │   ├── law.py
│   │   ├── medicine.py
│   │   ├── business.py
│   │   ├── general.py
│   │   └── loader.py                 # Dynamic faculty prompt selector
│   ├── embeddings/config.py          # HuggingFace embedding model (local, free)
│   ├── chroma_store/                 # Local ChromaDB data (gitignored)
│   ├── requirements.txt
│   └── .env.example                  # Copy to .env and fill in
│
├── docs/
│   ├── api-reference.md
│   ├── database-schema.md
│   ├── prompt-library.md
│   └── user-manual.md
│
├── .github/
│   ├── workflows/ci.yml              # Lint on push/PR
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .gitignore
└── README.md
```

---

## 👥 Team

> **Group [Your Group Number] — Lagos State University**

| Role | Name | Matric No. | Responsibilities |
|---|---|---|---|
| **Lead Developer & AI Engineer** | Yusuf [Surname] | [Matric] | AI/RAG pipeline, project coordination, DevOps, deployment |
| **Frontend Developer** | [Name] | [Matric] | Next.js pages, components, KaTeX, responsive design |
| **Backend Developer** | [Name] | [Matric] | FastAPI endpoints, Supabase integration, auth middleware |

---

## 📅 Build Timeline

### ⚙️ Week 1 — Backend & AI Foundation

```
Day 1–2  [Database & Auth]
  ✦ Supabase schema created (all 7 tables)
  ✦ Storage bucket configured
  ✦ Google OAuth enabled in Supabase + Google Cloud Console
  ✦ All three .env files filled in locally

Day 3–4  [Backend]
  ✦ FastAPI running locally
  ✦ Auth middleware (Supabase JWT validation)
  ✦ Course and document endpoints working
  ✦ File upload saving to Supabase Storage

Day 5–7  [AI Pipeline]
  ✦ ChromaDB running with per-course collections
  ✦ ingestor.py: PDF → chunks → ChromaDB (tested with real notes)
  ✦ retriever.py: similarity search returning correct chunks
  ✦ chain.py: full Q&A working (Gemini 2.5 Flash)
  ✦ All 5 faculty prompts tested
  ✦ quiz_gen.py and summarizer.py working (Gemini 2.5 Flash-Lite)
  ✦ Backend deployed to Render
```

### 🔨 Week 2 — Frontend Core

```
Day 8–9   [Auth Pages]
  ✦ Login — Google button + email form
  ✦ Signup — faculty selection
  ✦ Complete Profile — first Google login faculty tile selection
  ✦ Auth connected to Supabase, redirects working

Day 10–11  [Dashboard + Courses]
  ✦ Dashboard — stat cards, course grid, recent activity
  ✦ Course creation and management
  ✦ Document upload UI + file list
  ✦ All pages responsive (desktop + mobile)

Day 12–14  [AI Chat Interface]
  ✦ Chat UI — document context panel, topic suggestion pills
  ✦ Message bubbles with correct styling
  ✦ KaTeX rendering for equations in AI responses
  ✦ Source citation expandable section
  ✦ Connected to backend query endpoint end to end
  ✦ Frontend deployed to Vercel
```

### 🚀 Week 3 — Remaining Features + Polish

```
Day 15–16  [Progress + Quiz]
  ✦ Topic progress tracker dashboard
  ✦ Quiz setup + active quiz + score screen
  ✦ Quiz results feeding into progress tracker

Day 17–18  [Study Rooms + Planner]
  ✦ Study rooms — create, join, shared AI chat
  ✦ CGPA study planner — input form + calendar output

Day 19     [Settings]
  ✦ Profile settings, faculty change, dark/light mode

Day 20     [Deployment]
  ✦ Full end-to-end test on deployed URLs
  ✦ Environment variables confirmed on Vercel + Render

Day 21     [Demo Prep]
  ✦ Test accounts with preloaded course materials
  ✦ Demo rehearsed across all features
```

---

## ⚙️ Local Setup

### Prerequisites
Verify these are installed before anything else:
```bash
node --version    # Must be v18 or higher
python --version  # Must be 3.11 or higher
git --version     # Any recent version
```

### 1. Clone the repo
```bash
git clone https://github.com/[your-username]/scholarai.git
cd scholarai
git checkout develop
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Open .env.local and fill in your Supabase URL and anon key
npm run dev
# Runs at http://localhost:3000
```

### 3. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Open .env and fill in Supabase + Google API keys
uvicorn main:app --reload
# Runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 4. AI Pipeline
```bash
cd ai
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Open .env and fill in your Google API key
```

> ⚠️ Backend and AI each have their **own separate virtual environment**. This prevents package conflicts. Always activate the correct venv before working in that folder.

### Environment Variables

**`frontend/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**`backend/.env`**
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_API_KEY=your-google-api-key
CHROMA_PERSIST_PATH=../ai/chroma_store
ALLOWED_ORIGINS=http://localhost:3000
APP_ENV=development
```

**`ai/.env`**
```
GOOGLE_API_KEY=your-google-api-key
CHROMA_PERSIST_PATH=./chroma_store
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

> ⚠️ Never commit `.env` or `.env.local` files. Share values with teammates via WhatsApp only.

---

## 🌿 Git Workflow

### Branch Strategy

| Branch | Purpose | Rules |
|---|---|---|
| `main` | Production — triggers Vercel deploy | PR required · tested and approved |
| `develop` | Integration — active development | PR required · 1 teammate approval |
| `feature/*` | Individual features | Open PR to develop when complete |
| `fix/*` | Bug fixes | Open PR to develop when fixed |

### Daily Loop

```bash
# Start of every session
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work and commit often
git add .
git commit -m "feat: describe what you built"

# Push and open PR to develop
git push origin feature/your-feature-name
# Open PR on GitHub → request review from a teammate → merge after approval
```

### Commit Format

```
feat:     feat: add KaTeX rendering to AI chat component
fix:      fix: resolve ChromaDB collection scoping bug
docs:     docs: update API reference for query endpoint
refactor: refactor: clean up faculty prompt loader
chore:    chore: update Google API key environment variable name
```

### Branch Naming

```
feature/google-auth
feature/course-management
feature/rag-pipeline
feature/ai-chat-interface
feature/progress-tracker
feature/quiz-generator
feature/study-rooms
feature/study-planner
feature/settings-page
fix/katex-mobile-rendering
```

---

## 🔒 Golden Rules

1. Never push directly to `main` or `develop` — always through a PR
2. Never commit `.env` files or API keys to GitHub
3. Every PR to `develop` needs at least **1 teammate approval**
4. `main` only receives merges from `develop` when fully working and tested
5. Delete your feature branch after it is merged
6. Pull from `develop` at the start of every session before creating a branch
7. If you break `develop`, fixing it is your priority before anything else

---

## 📄 Documentation

| Document | Description |
|---|---|
| [API Reference](./docs/api-reference.md) | All endpoints with request/response shapes |
| [Database Schema](./docs/database-schema.md) | Supabase tables with full SQL |
| [Prompt Library](./docs/prompt-library.md) | Faculty prompts and how to extend them |
| [User Manual](./docs/user-manual.md) | End-user guide for students |

---

<div align="center">

**ScholarAI · Lagos State University · Software Engineering II · 2025**

*Group [Your Group Number] — Built with purpose for Nigerian university students*

*Powered by [Google Gemini](https://ai.google.dev) · [Supabase](https://supabase.com) · [Vercel](https://vercel.com)*

</div>