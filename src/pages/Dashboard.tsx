import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, AlertTriangle, FolderKanban, Plus, Pencil, Check, UserPlus } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { isToday, isPast, startOfWeek, formatDistanceToNow, startOfDay } from "date-fns";

const CountUp = ({ to }: { to: number }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let r: number; const start = performance.now(); const dur = 1000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(p * to));
      if (p < 1) r = requestAnimationFrame(tick);
    };
    r = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r);
  }, [to]);
  return <>{n}</>;
};

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const priColor: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  high: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};
const statusColor: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-primary/15 text-primary",
  review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

const Skeleton = ({ className = "" }: { className?: string }) => <div className={`rounded-xl bg-secondary animate-pulse ${className}`} />;

const Dashboard = () => {
  const { profile, user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, dueToday: 0, overdue: 0, doneWeek: 0 });
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [priorityData, setPriorityData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [projectsOverview, setProjectsOverview] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const loadAll = async () => {
    if (!user) return;
    const today = startOfDay(new Date()).toISOString();
    const [projectsRes, tasksRes, myTasksRes, activityRes] = await Promise.all([
      supabase.from("projects").select("id, name"),
      supabase.from("tasks").select("id, status, priority, due_date, updated_at, project_id, projects(name)"),
      supabase.from("tasks").select("id, title, status, priority, due_date, updated_at, project_id, projects(name)").eq("assigned_to", user.id).order("updated_at", { ascending: false }).limit(5),
      supabase.from("tasks").select("id, title, status, created_at, updated_at, created_by, assigned_to, projects(name), creator:profiles!tasks_created_by_fkey(full_name)").order("updated_at", { ascending: false }).limit(10),
    ]);
    const projects = projectsRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const wkStart = startOfWeek(new Date());

    setStats({
      projects: projects.length,
      dueToday: tasks.filter(t => t.due_date && isToday(new Date(t.due_date))).length,
      overdue: tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done").length,
      doneWeek: tasks.filter(t => t.status === "done" && new Date(t.updated_at) >= wkStart).length,
    });

    const sCounts: Record<string, number> = { todo: 0, "in-progress": 0, review: 0, done: 0 };
    const pCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };
    tasks.forEach(t => { sCounts[t.status] = (sCounts[t.status] || 0) + 1; pCounts[t.priority] = (pCounts[t.priority] || 0) + 1; });
    setStatusData([
      { name: "To Do", value: sCounts.todo, color: "hsl(var(--muted-foreground))" },
      { name: "In Progress", value: sCounts["in-progress"], color: "hsl(var(--primary))" },
      { name: "Review", value: sCounts.review, color: "#f59e0b" },
      { name: "Done", value: sCounts.done, color: "#10b981" },
    ]);
    setPriorityData([
      { name: "Low", value: pCounts.low, color: "#10b981" },
      { name: "Medium", value: pCounts.medium, color: "#f59e0b" },
      { name: "High", value: pCounts.high, color: "#ef4444" },
    ]);

    setMyTasks(myTasksRes.data ?? []);

    const overview = projects.map(p => {
      const pts = tasks.filter(t => t.project_id === p.id);
      const done = pts.filter(t => t.status === "done").length;
      return { id: p.id, name: p.name, done, total: pts.length, pct: pts.length ? Math.round((done / pts.length) * 100) : 0 };
    });
    setProjectsOverview(overview);

    setActivity((activityRes.data ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      project: t.projects?.name,
      who: t.created_by === user.id ? "You" : t.creator?.full_name || "Someone",
      action: t.status === "done" ? "completed" : "updated",
      ts: t.updated_at,
    })));
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [user?.id]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("dash-tasks").on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => loadAll()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const cards = [
    { label: "Total Projects", value: stats.projects, icon: FolderKanban, color: "from-indigo-500 to-violet-500", to: "/projects" },
    { label: "Due Today", value: stats.dueToday, icon: Clock, color: "from-amber-500 to-orange-500" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "from-rose-500 to-red-500", accent: true, to: "/projects" },
    { label: "Done This Week", value: stats.doneWeek, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
  ];

  const dateStr = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }), []);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {greet()}, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "friend"}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening today.</p>
          </div>
          <span className="text-sm text-muted-foreground">{dateStr}</span>
        </motion.div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {loading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-32" />) : cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4 }} onClick={() => c.to && nav(c.to)}
              className={`p-5 rounded-2xl bg-card border ${c.accent ? "border-rose-500/40" : "border-border"} shadow-card ${c.to ? "cursor-pointer" : ""}`}>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center mb-4 shadow-glow`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-display font-bold tabular-nums"><CountUp to={c.value} /></div>
              <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 60/40 grid */}
        <div className="grid lg:grid-cols-5 gap-6 mt-6">
          {/* LEFT 60% */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-card">
              <h2 className="font-display font-semibold text-lg mb-4">Tasks by status</h2>
              {loading ? <Skeleton className="h-64" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} animationDuration={900}>
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-3 justify-center text-xs mt-2">
                {statusData.map(d => <div key={d.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />{d.name} ({d.value})</div>)}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-card">
              <h2 className="font-display font-semibold text-lg mb-4">Priority breakdown</h2>
              {loading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={900}>
                      {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          {/* RIGHT 40% */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-card">
              <h2 className="font-display font-semibold text-lg mb-4">My tasks</h2>
              {loading ? <Skeleton className="h-40" /> : myTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks assigned to you.</p>
              ) : (
                <div className="space-y-2">
                  {myTasks.map(t => (
                    <Link to={`/projects/${t.project_id}`} key={t.id}
                      className="block p-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">{t.title}</div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${priColor[t.priority]}`}>{t.priority}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{t.projects?.name}</span>
                        <span className={`px-2 py-0.5 rounded-md ${statusColor[t.status]}`}>{t.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-card">
              <h2 className="font-display font-semibold text-lg mb-4">Projects overview</h2>
              {loading ? <Skeleton className="h-40" /> : projectsOverview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="space-y-3">
                  {projectsOverview.map((p, i) => (
                    <Link to={`/projects/${p.id}`} key={p.id} className="block">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-muted-foreground tabular-nums text-xs">{p.done}/{p.total} · {p.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ delay: 0.5 + i * 0.05, duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-primary" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-6 p-6 rounded-2xl bg-card border border-border shadow-card">
          <h2 className="font-display font-semibold text-lg mb-4">Recent activity</h2>
          {loading ? <Skeleton className="h-40" /> : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {activity.map(a => {
                  const Icon = a.action === "completed" ? Check : Pencil;
                  return (
                    <motion.li key={a.id + a.ts} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50">
                      <div className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0"><Icon className="h-4 w-4" /></div>
                      <div className="flex-1 min-w-0 text-sm">
                        <span className="font-medium">{a.who}</span> {a.action} <span className="font-medium">{a.title}</span>
                        {a.project && <> in <span className="text-muted-foreground">{a.project}</span></>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(a.ts), { addSuffix: true })}</span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
