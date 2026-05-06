import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Profile = () => {
  const { user, profile, role } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("tasks").select("id, title, status, priority, due_date, projects(name)").eq("assigned_to", user.id).order("due_date", { ascending: true })
      .then(({ data }) => setTasks(data ?? []));
  }, [user]);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-3xl bg-card border border-border shadow-card flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground text-3xl font-display font-bold shadow-glow">
            {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{profile?.full_name || "Unnamed"}</h1>
            <p className="text-muted-foreground">{profile?.email}</p>
            <span className="mt-2 inline-block text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-gradient-primary text-primary-foreground font-bold">{role}</span>
          </div>
        </motion.div>

        <h2 className="font-display text-xl font-semibold mt-10 mb-4">My tasks</h2>
        {tasks.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-border text-center text-muted-foreground">No tasks assigned to you.</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.projects?.name}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {t.due_date && <span className="text-xs text-muted-foreground tabular-nums">{format(new Date(t.due_date), "MMM d")}</span>}
                  <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded-md bg-secondary">{t.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Profile;
