import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, X } from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string; name: string; description: string | null; status: string;
  member_count?: number; done?: number; total?: number;
}

const Projects = () => {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("id, name, description, status").order("created_at", { ascending: false });
    const enriched = await Promise.all((data ?? []).map(async (p) => {
      const [{ count: mc }, { data: ts }] = await Promise.all([
        supabase.from("project_members").select("id", { count: "exact", head: true }).eq("project_id", p.id),
        supabase.from("tasks").select("status").eq("project_id", p.id),
      ]);
      const total = ts?.length ?? 0;
      const done = ts?.filter(t => t.status === "done").length ?? 0;
      return { ...p, member_count: mc ?? 0, total, done };
    }));
    setProjects(enriched);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase.from("projects").insert({ name, description: desc, owner_id: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("project_members").insert({ project_id: data.id, user_id: user.id, role: "admin" });
    toast.success("Project created");
    setOpen(false); setName(""); setDesc(""); load();
  };

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">All the work you're part of.</p>
          </div>
          {role === "admin" && (
            <Button onClick={() => setOpen(true)} className="bg-gradient-primary hover:opacity-90 shadow-glow gap-2">
              <Plus className="h-4 w-4" /> New project
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No projects yet. {role === "admin" ? "Create your first one!" : "Ask an admin to add you."}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => {
              const pct = p.total ? Math.round((p.done! / p.total!) * 100) : 0;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}>
                  <Link to={`/projects/${p.id}`}>
                    <motion.div whileHover={{ y: -4, boxShadow: "var(--shadow-lift)" }} className="p-5 rounded-2xl bg-card border border-border shadow-card h-full transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                          <FolderKanban className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-muted-foreground font-semibold">{p.status}</span>
                      </div>
                      <h3 className="font-display font-semibold text-lg">{p.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">{p.description || "No description"}</p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{p.member_count} member{p.member_count === 1 ? "" : "s"}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.06 }} className="h-full bg-gradient-primary rounded-full" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold">New project</h2>
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
              </div>
              <form onSubmit={create} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full h-11 px-3 rounded-lg bg-secondary border border-border focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none resize-none" />
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-glow">Create project</Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default Projects;
