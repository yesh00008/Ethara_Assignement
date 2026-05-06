# Ethara — Team Task Manager

> A modern, full-stack team task management application with Kanban boards, role-based access control, and a beautifully animated UI. Built for teams that ship.

**🌐 Live Demo:** [https://etharaassignement-production.up.railway.app/](https://etharaassignement-production.up.railway.app/)  
**📦 GitHub Repository:** [https://github.com/yesh00008/Ethara_Assignement](https://github.com/yesh00008/Ethara_Assignement)  
**👤 Author:** Yeshwanth Thotakura

---

## 🔑 Test Login Credentials

> **⚠️ Important Note:** Supabase email signups are currently hitting a rate limit on the free tier. To evaluate the application without needing to register, please use the pre-created test accounts below.

| Role | Email | Password |
|------|-------|----------|
| **Manager (Admin)** | `manager_ethara@ethara.com` | `manger@M` |
| **Employee (Member)** | `employe02@ethara.com` | `employe02@E` |

- Log in as **Manager** to experience Admin capabilities: creating projects, adding members, creating and deleting tasks, and managing the team.
- Log in as **Employee** to experience Member capabilities: viewing assigned projects and updating task statuses.

---

## Table of Contents

- [Test Login Credentials](#-test-login-credentials)
- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Reference (Supabase RPC & REST)](#api-reference)
- [Role-Based Access Control](#role-based-access-control)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Overview

Ethara is a full-stack team productivity application that allows organizations to create projects, manage team members, assign tasks, and track progress in real time. It features a beautiful Kanban board interface with drag-and-drop support, an animated dashboard with live statistics, and strict role-based access control enforced at both the application and database level.

The entire backend is powered by **Supabase** — a managed PostgreSQL database with built-in Auth, Row-Level Security (RLS), Edge Functions, and a real-time API — eliminating the need for a custom Express/Node server while maintaining enterprise-grade security.

---

## Features

### Authentication & Authorization
- Email/password signup and login via **Supabase Auth**
- Role selection at signup (Admin or Member)
- JWT-based session management, auto-refreshed by Supabase client
- Protected routes — unauthenticated users are redirected to login

### Project Management
- Admins can **create, edit, and delete projects**
- Each project has a name, description, owner, and status (active/archived)
- **Progress bars** on project cards show task completion percentage dynamically
- Members can view only the projects they have been added to

### Team Management
- Admins can **add and remove team members** per project
- Per-project roles (Admin / Member) independent of global roles
- Member list shows names, avatars, and roles

### Task Management
- Create tasks with title, description, priority, due date, and assignee
- **Priority badges:** Low (green), Medium (yellow), High (red)
- **Due date highlighting** — overdue tasks are visually flagged in red
- Assignee shown with avatar and name
- Tasks can be edited and deleted by authorized users

### Kanban Board
- Four columns: **To Do → In Progress → Review → Done**
- Full **drag-and-drop** support via `@hello-pangea/dnd`
- Status updates persist immediately to the database on drop
- Smooth animations powered by **Framer Motion**

### Dashboard
- Animated **count-up stat cards** showing: Total Tasks, Completed, In Progress, Overdue
- **Status distribution chart** (Recharts bar chart)
- **Due Today** section listing urgent tasks
- **Overdue Tasks** section for past-due items with highlighting
- All data fetched live from Supabase on every page visit

### UI & UX Polish
- **Framer Motion** page transitions and staggered reveal animations
- **Glass-morphism** card style with subtle backdrop blur
- Light / Dark theme toggle (persisted to localStorage)
- **Space Grotesk** (headings) + **Inter** (body) font pairing
- Toast notifications via `react-hot-toast` for all CRUD operations
- Fully responsive — works on mobile and desktop

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│                                                                      │
│   React 18 + Vite + TypeScript                                       │
│   ┌─────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │
│   │  Auth Pages     │  │  Dashboard         │  │  Kanban Board   │  │
│   │  (Login/Signup) │  │  (Stats + Charts)  │  │  (Drag & Drop)  │  │
│   └────────┬────────┘  └────────┬───────────┘  └────────┬────────┘  │
│            │                   │                        │           │
│            └───────────────────┼────────────────────────┘           │
│                                │                                     │
│                   Supabase JS SDK (v2)                               │
│              supabase.auth.*  supabase.from()*                       │
└────────────────────────────────┼────────────────────────────────────┘
                                 │  HTTPS (REST / Realtime WS)
┌────────────────────────────────▼────────────────────────────────────┐
│                        SUPABASE CLOUD                                │
│                                                                      │
│   ┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐    │
│   │  Auth Server │   │  PostgREST API   │   │  Postgres DB    │    │
│   │  (JWT/OAuth) │   │  (Auto REST from │   │  (Tables + RLS  │    │
│   │              │   │   schema)        │   │   + Triggers)   │    │
│   └──────────────┘   └──────────────────┘   └─────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                    Deployed on Railway
              (Static build served via Railway)
```

**How data flows:**
1. User signs up/logs in → Supabase Auth issues a JWT
2. The JWT is attached to every Supabase SDK request automatically
3. PostgREST receives the request and passes it through **Row-Level Security policies**
4. Postgres evaluates the policy against `auth.uid()` and returns only permitted rows
5. The React UI renders the filtered data

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 18 | Component-based UI |
| **Build Tool** | Vite | Fast HMR dev server & optimized production build |
| **Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS | Utility-first styling with custom HSL design tokens |
| **Animations** | Framer Motion | Page transitions, staggered lists, count-up effects |
| **Drag & Drop** | @hello-pangea/dnd | Accessible Kanban drag-and-drop |
| **Charts** | Recharts | Dashboard status distribution bar chart |
| **Notifications** | react-hot-toast | Non-blocking success/error feedback |
| **Backend/DB** | Supabase (PostgreSQL) | Database, Auth, RLS, Auto REST API |
| **Auth** | Supabase Auth | JWT-based email/password authentication |
| **Hosting** | Railway | Cloud deployment (live URL) |
| **Package Manager** | Bun + npm | Dependency management |
| **Linting** | ESLint | Code quality enforcement |

---

## Database Schema

All tables live in Supabase's managed PostgreSQL instance. Row-Level Security is **enabled on every table**.

### `profiles`
Extends `auth.users` with display information. Created automatically by a trigger on signup.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | References `auth.users.id` |
| `full_name` | text | Display name |
| `avatar_url` | text | Optional avatar image URL |
| `email` | text | Synced from auth.users |
| `created_at` | timestamptz | Auto |

### `user_roles`
Global role per user. Kept in a separate table to prevent privilege escalation via profile edits.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto |
| `user_id` | uuid (FK → profiles) | |
| `role` | text | `'admin'` or `'member'` |

### `projects`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto |
| `name` | text | Project name |
| `description` | text | Optional |
| `owner_id` | uuid (FK → profiles) | Creator |
| `status` | text | `'active'` or `'archived'` |
| `created_at` | timestamptz | Auto |

### `project_members`
Many-to-many join table for users ↔ projects.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto |
| `project_id` | uuid (FK → projects) | |
| `user_id` | uuid (FK → profiles) | |
| `role` | text | Per-project: `'admin'` or `'member'` |
| `joined_at` | timestamptz | Auto |

### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto |
| `project_id` | uuid (FK → projects) | |
| `title` | text | Required |
| `description` | text | Optional |
| `status` | text | `'todo'`, `'in_progress'`, `'review'`, `'done'` |
| `priority` | text | `'low'`, `'medium'`, `'high'` |
| `assigned_to` | uuid (FK → profiles) | Nullable |
| `created_by` | uuid (FK → profiles) | |
| `due_date` | date | Optional |
| `created_at` | timestamptz | Auto |

### Database Triggers

A `handle_new_user()` trigger fires on every `auth.users` INSERT to:
1. Auto-create a row in `profiles` with the user's email and full_name
2. Auto-insert a default `'member'` role in `user_roles`

This ensures every signed-up user has a complete profile immediately.

---

## API Reference

Since the backend is Supabase, all API calls are made via the **Supabase JS SDK**, which translates them into PostgREST HTTP calls under the hood. RLS policies act as the authorization layer.

### Authentication

```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({ email, password });

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Sign Out
await supabase.auth.signOut();

// Get current session
const { data: { session } } = await supabase.auth.getSession();
```

### Projects

```typescript
// Fetch all projects a user belongs to (RLS filters automatically)
const { data } = await supabase
  .from('projects')
  .select(`*, project_members!inner(user_id), tasks(id, status)`)
  .order('created_at', { ascending: false });

// Create a project
const { data } = await supabase
  .from('projects')
  .insert({ name, description, owner_id: user.id, status: 'active' })
  .select()
  .single();

// After creation, add creator as admin member:
await supabase.from('project_members').insert({
  project_id: project.id,
  user_id: user.id,
  role: 'admin'
});

// Update a project
await supabase.from('projects').update({ name, description }).eq('id', projectId);

// Delete a project
await supabase.from('projects').delete().eq('id', projectId);
```

### Tasks

```typescript
// Fetch all tasks for a project with assignee info
const { data } = await supabase
  .from('tasks')
  .select(`*, assigned_profile:profiles!tasks_assigned_to_fkey(full_name, avatar_url)`)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });

// Create a task
await supabase.from('tasks').insert({
  project_id, title, description,
  status: 'todo', priority, due_date, assigned_to,
  created_by: user.id
});

// Update task status (on Kanban drop)
await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);

// Delete a task
await supabase.from('tasks').delete().eq('id', taskId);
```

### Team Members

```typescript
// Fetch all members of a project
const { data } = await supabase
  .from('project_members')
  .select(`*, profiles(full_name, email, avatar_url)`)
  .eq('project_id', projectId);

// Add a member by email
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', email)
  .single();

await supabase.from('project_members').insert({
  project_id, user_id: profile.id, role: 'member'
});

// Remove a member
await supabase.from('project_members').delete()
  .eq('project_id', projectId).eq('user_id', userId);
```

### Dashboard Data

```typescript
// Fetch task statistics for current user
const { data: allTasks } = await supabase
  .from('tasks')
  .select(`*, projects!inner(project_members!inner(user_id))`)
  .eq('projects.project_members.user_id', user.id);

// Filter overdue tasks in-memory
const overdue = allTasks.filter(t =>
  t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
);
```

---

## Row-Level Security (RLS) Policies

RLS is the core security mechanism — policies run inside Postgres itself, so no client-side data filtering can be bypassed.

| Table | Policy | Rule |
|-------|--------|------|
| `profiles` | SELECT | Anyone can read profiles (for member search) |
| `profiles` | UPDATE | Users can only update their own profile |
| `user_roles` | SELECT | Users can read their own role |
| `projects` | SELECT | User must be in `project_members` for that project |
| `projects` | INSERT | Any authenticated user |
| `projects` | UPDATE/DELETE | Only project `owner_id` matches `auth.uid()` |
| `project_members` | SELECT | User must be a member of the project |
| `project_members` | INSERT | Only project admins (per-project role) |
| `project_members` | DELETE | Only project admins |
| `tasks` | SELECT | User must be a member of the task's project |
| `tasks` | INSERT | User must be a member of the project |
| `tasks` | UPDATE | Members update status; only admins can change other fields |
| `tasks` | DELETE | Only project admins or task creator |

---

## Role-Based Access Control

Ethara implements two levels of roles:

### Global Roles (`user_roles` table)
| Role | Capability |
|------|-----------|
| **Admin** | Can create projects, see admin UI elements |
| **Member** | Can view assigned projects and update task status |

### Per-Project Roles (`project_members.role`)
| Role | Capability |
|------|-----------|
| **Admin** | Add/remove members, create/delete/edit tasks, manage project settings |
| **Member** | View project, update status of tasks assigned to them |

---

## Project Structure

```
Ethara_Assignement/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui base components
│   │   ├── Auth/               # Login & Signup forms
│   │   ├── Dashboard/          # Stat cards, charts, overdue list
│   │   ├── Projects/           # Project list, project card
│   │   ├── Kanban/             # Board, Column, TaskCard, DnD logic
│   │   ├── Tasks/              # Task form, task detail modal
│   │   ├── Team/               # Member list, add member form
│   │   └── Layout/             # Sidebar, Header, ThemeToggle
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth state & session management
│   │   ├── useProjects.ts      # Project CRUD
│   │   ├── useTasks.ts         # Task CRUD + status updates
│   │   └── useTeam.ts          # Member management
│   ├── lib/
│   │   └── supabase.ts         # Supabase client initialization
│   ├── pages/
│   │   ├── Index.tsx           # Landing / redirect logic
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Projects.tsx
│   │   ├── ProjectDetail.tsx   # Kanban board view
│   │   └── Settings.tsx
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces for all entities
│   ├── App.tsx                 # Router + auth guard
│   └── main.tsx                # Entry point
├── supabase/
│   └── migrations/             # SQL migration files (schema + RLS)
├── .env                        # Supabase URL + anon key
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Supabase project (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yesh00008/Ethara_Assignement.git
cd Ethara_Assignement

# 2. Install dependencies
npm install
# or
bun install

# 3. Set up environment variables (see below)
cp .env.example .env

# 4. Run database migrations
# Go to your Supabase dashboard → SQL Editor
# Run all files in supabase/migrations/ in order

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are found in your Supabase project → Settings → API.

> The anon key is safe to expose client-side — it provides access only to data permitted by your RLS policies. Never commit your `service_role` key.

---

## Deployment

This application is deployed on **Railway**.

### Deploy to Railway

```bash
# 1. Push your code to GitHub

# 2. Go to railway.app → New Project → Deploy from GitHub

# 3. Select your repository

# 4. Add environment variables in Railway dashboard:
#    VITE_SUPABASE_URL
#    VITE_SUPABASE_ANON_KEY

# 5. Railway auto-detects Vite and runs:
#    npm run build → serves dist/ folder

# 6. Your live URL is provided by Railway
```

### Build Command
```bash
npm run build
```

### Start Command
```bash
# Railway serves the dist/ directory as a static site
# No server process needed — Supabase is the backend
```

---

## Validations

- **Signup:** Email format validation, password minimum length (6 chars), full name required
- **Project creation:** Name required, max 100 chars
- **Task creation:** Title required, due date must be today or future, assignee must be a project member
- **Member addition:** Email must belong to a registered user, duplicate members prevented
- **Role enforcement:** All mutations check role both client-side (UI) and server-side (RLS)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |

---

## License

MIT — feel free to use, modify, and distribute.

---

*Built by Yeshwanth Thotakura as part of the Ethara Engineering Assignment.*
