# Ethara — Team Task Manager

A modern, full-stack team task manager with Kanban boards, role-based access, and beautifully animated UI. Built for teams that ship.

## ✨ Features

- 🔐 **Auth** — Email/password signup & login via Supabase Auth, role chosen at signup (Admin / Member)
- 🛡️ **Row-Level Security** — All data access enforced at the database with Postgres RLS policies
- 📋 **Projects** — Admins create projects; members see what they belong to with progress bars
- 🗂️ **Kanban Board** — Drag tasks across To Do → In Progress → Review → Done with smooth animations
- 👥 **Team management** — Admins add/remove members per project
- 🏷️ **Tasks** — Title, description, priority badges (low/medium/high), due dates with overdue highlighting, assignee avatars
- 📊 **Dashboard** — Animated count-up stat cards, status chart, due-today/overdue tracking
- 🎨 **Polish** — Framer Motion page transitions, glass cards, staggered reveals, light/dark theme toggle, react-hot-toast feedback

## 🧱 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS, custom HSL design tokens, Space Grotesk + Inter
- **Animations**: Framer Motion + @hello-pangea/dnd (drag & drop)
- **Backend**: Supabase (Postgres + Auth + RLS) — replaces a custom Express server. All API access is via the Supabase JS SDK directly from the client, secured by RLS.
- **Charts**: Recharts
- **Toasts**: react-hot-toast

## 🗄️ Database Schema

- `profiles` (1:1 with `auth.users`) — full_name, avatar_url, email
- `user_roles` — global role per user (admin / member), separate table to prevent privilege escalation
- `projects` — name, description, owner_id, status
- `project_members` — many-to-many users ↔ projects, with per-project role
- `tasks` — project_id, title, description, assigned_to, created_by, status, priority, due_date

A trigger auto-creates the profile + default role on signup.

## 🚀 Run locally

```bash
git clone <repo-url>
cd ethara
npm install
npm run dev
```

The Supabase URL & publishable key need to be configured in your environment.

## 🔑 Roles

- **Admin** — Create/edit/delete projects, add/remove members, create/delete tasks, assign anyone
- **Member** — View their projects, update status of tasks assigned to them

## 📦 Deployment

Deploy to your preferred hosting provider (Vercel, Netlify, etc.) by connecting your repository and configuring the necessary environment variables.
