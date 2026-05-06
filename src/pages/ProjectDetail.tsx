import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format, isPast } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Status = "todo" | "in-progress" | "review" | "done";
type Priority = "low" | "medium" | "high";

interface Task {
  id: string; title: string; description: string | null; status: Status; priority: Priority;
  due_date: string | null; assigned_to: string | null; project_id: string;
  assignee?: { full_name: string | null; avatar_url: string | null } | null;
}
interface Member { user_id: string; role: string; profiles: { full_name: string | null; avatar_url: string | null; email: string | null } }

const COLUMNS: { id: Status; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

const priColor: Record<Priority, string> = {
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  high: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};
const priBorder: Record<Priority, string> = {
  low: "border-l-emerald-500",
  medium: "border-l-amber-500",
  high: "border-l-rose-500",
};
const statusColor: Record<Status, string> = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-primary/15 text-primary",
  review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [openTask, setOpenTask] = useState(false);
  const [openMember, setOpenMember] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [sortBy, setSortBy] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "title", dir: "asc" });
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as Priority, assigned_to: "", due_date: "" });
  const titleErr = form.title.trim().length > 0 && form.title.trim().length < 3 ? "Title must be ≥ 3 characters" : form.title.length > 150 ? "Title too long" : "";
  const dueErr = form.due_date && new Date(form.due_date) < new Date(new Date().toDateString()) ? "Due date can't be in the past" : "";
  const formValid = form.title.trim().length >= 3 && !titleErr && !dueErr;

  const load = async () => {
    if (!id) return;
    const { data: p } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    setProject(p);
    const { data: ts } = await supabase.from("tasks").select("*, assignee:profiles!tasks_assigned_to_fkey(full_name, avatar_url)").eq("project_id", id);
    setTasks((ts as any) ?? []);
    const { data: ms } = await supabase.from("project_members").select("user_id, role, profiles(full_name, avatar_url, email)").eq("project_id", id);
    setMembers((ms as any) ?? []);
    const { data: us } = await supabase.from("profiles").select("id, full_name, email, avatar_url");
    setAllUsers(us ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const onDragEnd = async (r: DropResult) => {
    if (!r.destination) return;
    const newStatus = r.destination.droppableId as Status;
    const taskId = r.draggableId;
    const old = tasks.find(t => t.id === taskId);
    if (!old || old.status === newStatus) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    if (error) { toast.error(error.message); load(); } else { toast.success("Task moved"); }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    const { error } = await supabase.from("tasks").insert({
      project_id: id, title: form.title, description: form.description, priority: form.priority,
      assigned_to: form.assigned_to || null, due_date: form.due_date || null, created_by: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Task created");
    setOpenTask(false); setForm({ title: "", description: "", priority: "medium", assigned_to: "", due_date: "" });
    load();
  };

  const addMember = async (uid: string) => {
    const { error } = await supabase.from("project_members").insert({ project_id: id!, user_id: uid, role: "member" });
    if (error) toast.error(error.message); else { toast.success("Member added"); load(); }
  };
  const removeMember = async (uid: string) => {
    const { error } = await supabase.from("project_members").delete().eq("project_id", id!).eq("user_id", uid);
    if (error) toast.error(error.message); else { toast.success("Member removed"); load(); }
  };
  const deleteTask = async (tid: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", tid);
    if (error) toast.error(error.message); else { toast.success("Task deleted"); load(); }
  };

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold">{project?.name}</h1>
          {project?.description && <p className="text-muted-foreground mt-1">{project.description}</p>}

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <div className="flex -space-x-2">
              {members.slice(0, 6).map(m => (
                <div key={m.user_id} title={m.profiles?.full_name || ""} className="h-9 w-9 rounded-full bg-gradient-primary border-2 border-background grid place-items-center text-primary-foreground text-xs font-semibold">
                  {(m.profiles?.full_name || m.profiles?.email || "?")[0].toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"}</span>
            {role === "admin" && (
              <>
                <Button size="sm" variant="outline" onClick={() => setOpenMember(true)} className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Manage members</Button>
                <Button size="sm" onClick={() => setOpenTask(true)} className="bg-gradient-primary hover:opacity-90 shadow-glow gap-1.5"><Plus className="h-3.5 w-3.5" /> Add task</Button>
              </>
            )}
            <div className="ml-auto flex gap-1 p-1 rounded-lg bg-secondary/60">
              {(["kanban", "list"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3 h-8 text-xs font-medium rounded-md capitalize ${view === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{v}</button>
              ))}
            </div>
          </div>
        </motion.div>

        {view === "kanban" ? (

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col, ci) => (
              <motion.div key={col.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}>
                <Droppable droppableId={col.id}>
                  {(prov, snap) => (
                    <div ref={prov.innerRef} {...prov.droppableProps}
                      className={`p-3 rounded-2xl border min-h-[300px] transition-colors ${snap.isDraggingOver ? "bg-accent border-primary/40" : "bg-secondary/40 border-border"}`}>
                      <div className="flex items-center justify-between px-2 mb-3">
                        <h3 className="font-semibold text-sm">{col.title}</h3>
                        <span className="text-xs text-muted-foreground tabular-nums">{tasks.filter(t => t.status === col.id).length}</span>
                      </div>
                      <div className="space-y-2">
                        {tasks.filter(t => t.status === col.id).map((t, ti) => (
                          <Draggable key={t.id} draggableId={t.id} index={ti}>
                            {(dp, ds) => (
                              <div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps}
                                style={{ ...dp.draggableProps.style }}
                                onClick={() => setActiveTask(t)}
                                className={`group p-3 rounded-xl bg-card border border-border border-l-4 ${priBorder[t.priority]} shadow-card cursor-pointer ${ds.isDragging ? "shadow-lift rotate-1" : "hover:shadow-lift"} transition-shadow`}>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-sm leading-snug">{t.title}</h4>
                                  {role === "admin" && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                                {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>}
                                <div className="flex items-center justify-between mt-3 gap-2">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${priColor[t.priority]}`}>{t.priority}</span>
                                  <div className="flex items-center gap-2">
                                    {t.due_date && (
                                      <span className={`text-[10px] tabular-nums ${isPast(new Date(t.due_date)) && t.status !== "done" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                                        {format(new Date(t.due_date), "MMM d")}
                                      </span>
                                    )}
                                    {t.assignee && (
                                      <div title={t.assignee.full_name || ""} className="h-6 w-6 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-[10px] font-semibold">
                                        {(t.assignee.full_name || "?")[0].toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {prov.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </motion.div>
            ))}
          </div>
        </DragDropContext>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  {[{ k: "title", l: "Title" }, { k: "assignee", l: "Assignee" }, { k: "priority", l: "Priority" }, { k: "status", l: "Status" }, { k: "due_date", l: "Due" }].map(c => (
                    <th key={c.k} onClick={() => setSortBy(s => ({ key: c.k, dir: s.key === c.k && s.dir === "asc" ? "desc" : "asc" }))}
                      className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-primary">
                      {c.l} {sortBy.key === c.k ? (sortBy.dir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...tasks].sort((a: any, b: any) => {
                  const av = sortBy.key === "assignee" ? (a.assignee?.full_name || "") : (a[sortBy.key] || "");
                  const bv = sortBy.key === "assignee" ? (b.assignee?.full_name || "") : (b[sortBy.key] || "");
                  return (av > bv ? 1 : -1) * (sortBy.dir === "asc" ? 1 : -1);
                }).map(t => (
                  <tr key={t.id} onClick={() => setActiveTask(t)} className="border-t border-border hover:bg-secondary/40 cursor-pointer">
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.assignee?.full_name || "—"}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${priColor[t.priority]}`}>{t.priority}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-md ${statusColor[t.status]}`}>{t.status}</span></td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—"}</td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tasks yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Detail Drawer */}
      <AnimatePresence>
        {activeTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveTask(null)} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${priColor[activeTask.priority]}`}>{activeTask.priority}</span>
                <Button size="icon" variant="ghost" onClick={() => setActiveTask(null)}><X className="h-4 w-4" /></Button>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">{activeTask.title}</h2>
              {activeTask.description && <p className="text-sm text-muted-foreground mb-6 whitespace-pre-wrap">{activeTask.description}</p>}
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select value={activeTask.status}
                    disabled={role !== "admin" && activeTask.assigned_to !== user?.id}
                    onChange={async (e) => {
                      const newStatus = e.target.value as Status;
                      const tid = activeTask.id;
                      setActiveTask({ ...activeTask, status: newStatus });
                      setTasks(prev => prev.map(t => t.id === tid ? { ...t, status: newStatus } : t));
                      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", tid);
                      if (error) { toast.error(error.message); load(); } else toast.success("Updated");
                    }}
                    className="mt-1 w-full h-10 px-3 rounded-lg bg-secondary border border-border outline-none disabled:opacity-60">
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs text-muted-foreground">Assignee</div><div className="mt-1 font-medium">{activeTask.assignee?.full_name || "Unassigned"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Due date</div><div className={`mt-1 font-medium tabular-nums ${activeTask.due_date && isPast(new Date(activeTask.due_date)) && activeTask.status !== "done" ? "text-destructive" : ""}`}>{activeTask.due_date ? format(new Date(activeTask.due_date), "MMM d, yyyy") : "—"}</div></div>
                </div>
                {role === "admin" && (
                  <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm("Delete this task?")) { deleteTask(activeTask.id); setActiveTask(null); }
                  }}><Trash2 className="h-4 w-4 mr-2" /> Delete task</Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Add Task Drawer */}
      <AnimatePresence>
        {openTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenTask(false)} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold">New task</h2>
                <Button size="icon" variant="ghost" onClick={() => setOpenTask(false)}><X className="h-4 w-4" /></Button>
              </div>
              <form onSubmit={createTask} className="space-y-4">
                <div><label className="text-sm font-medium mb-1.5 block">Title</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`w-full h-11 px-3 rounded-lg bg-secondary border ${titleErr ? "border-destructive" : "border-border"} focus:border-primary outline-none`} />
                  {titleErr && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive mt-1">{titleErr}</motion.p>}</div>
                <div><label className="text-sm font-medium mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} maxLength={1000} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none resize-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1.5 block">Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })} className="w-full h-11 px-3 rounded-lg bg-secondary border border-border focus:border-primary outline-none">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select></div>
                  <div><label className="text-sm font-medium mb-1.5 block">Due date</label>
                    <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={`w-full h-11 px-3 rounded-lg bg-secondary border ${dueErr ? "border-destructive" : "border-border"} focus:border-primary outline-none`} />
                    {dueErr && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive mt-1">{dueErr}</motion.p>}</div>
                </div>
                <div><label className="text-sm font-medium mb-1.5 block">Assign to</label>
                  <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full h-11 px-3 rounded-lg bg-secondary border border-border focus:border-primary outline-none">
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.profiles?.email}</option>)}
                  </select></div>
                <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-glow">Create task</Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Members Drawer */}
      <AnimatePresence>
        {openMember && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenMember(false)} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold">Members</h2>
                <Button size="icon" variant="ghost" onClick={() => setOpenMember(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {allUsers.map(u => {
                  const isMember = members.some(m => m.user_id === u.id);
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-sm font-semibold shrink-0">{(u.full_name || u.email || "?")[0].toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.full_name || u.email}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                      {isMember ? (
                        <Button size="sm" variant="ghost" onClick={() => removeMember(u.id)}>Remove</Button>
                      ) : (
                        <Button size="sm" onClick={() => addMember(u.id)} className="bg-gradient-primary hover:opacity-90">Add</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default ProjectDetail;
