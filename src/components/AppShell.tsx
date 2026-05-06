import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FolderKanban, User as UserIcon, LogOut, Moon, Sun, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { profile, role, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar p-5 gap-2 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">Ethara</div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Task Manager</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
            }>
              {({ isActive }) => (
                <>
                  {isActive && <motion.div layoutId="navpill" className="absolute inset-0 rounded-lg bg-accent -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <l.icon className="h-4 w-4" /> {l.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <button onClick={toggle} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {theme === "dark" ? "Light" : "Dark"} mode
          </button>
          <div className="p-3 rounded-xl bg-secondary/60 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-sm shrink-0">
              {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{profile?.full_name || profile?.email}</div>
              <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">{role}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={async () => { await signOut(); toast.success("Signed out"); nav("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
};
