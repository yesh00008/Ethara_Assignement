import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, AlertTriangle, FolderKanban } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { isToday, isPast, startOfWeek } from "date-fns";

const CountUp = ({ to }: { to: number }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let r: number; const start = performance.now(); const dur = 800;
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

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ projects: 0, dueToday: 0, overdue: 0, doneWeek: 0 });
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: projects }, { data: tasks }] = await Promise.all([
        supabase.from("projects").select("id"),
        supabase.from("tasks").select("status, due_date, updated_at"),
      ]);
      const ts = tasks ?? [];
      const wkStart = startOfWeek(new Date());
      setStats({
        projects: projects?.length ?? 0,
        dueToday: ts.filter(t => t.due_date && isToday(new Date(t.due_date))).length,
        overdue: ts.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done").length,
        doneWeek: ts.filter(t => t.status === "done" && new Date(t.updated_at) >= wkStart).length,
      });
      const counts: Record<string, number> = { todo: 0, "in-progress": 0, review: 0, done: 0 };
      ts.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
      setStatusData([
        { name: "To Do", value: counts.todo, color: "hsl(var(--muted-foreground))" },
        { name: "In Progress", value: counts["in-progress"], color: "hsl(var(--primary))" },
        { name: "Review", value: counts.review, color: "hsl(var(--warning))" },
        { name: "Done", value: counts.done, color: "hsl(var(--success))" },
      ]);
    })();
  }, []);

  const cards = [
    { label: "Projects", value: stats.projects, icon: FolderKanban, color: "from-indigo-500 to-violet-500" },
    { label: "Due today", value: stats.dueToday, icon: Clock, color: "from-amber-500 to-orange-500" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "from-rose-500 to-red-500" },
    { label: "Done this week", value: stats.doneWeek, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Welcome back, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "friend"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your workspace today.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4 }} className="p-5 rounded-2xl bg-card border border-border shadow-card">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center mb-4 shadow-glow`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-display font-bold tabular-nums"><CountUp to={c.value} /></div>
              <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 p-6 rounded-2xl bg-card border border-border shadow-card">
          <h2 className="font-display font-semibold text-lg mb-4">Tasks by status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
