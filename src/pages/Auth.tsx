import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const FloatingInput = ({ label, type = "text", value, onChange, error }: any) => (
  <div className="relative">
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      className={`peer w-full h-14 px-4 pt-5 pb-1 rounded-xl bg-secondary/60 border ${error ? "border-destructive" : "border-border"} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
    />
    <label className="absolute left-4 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none">
      {label}
    </label>
  </div>
);

const Auth = () => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName, role } },
        });
        if (error) throw error;
        toast.success("Account created!");
        nav("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        nav("/dashboard");
      }
    } catch (err: any) {
      setShake(true); setTimeout(() => setShake(false), 400);
      toast.error(err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background bg-mesh grid place-items-center p-4">
      <Link to="/" className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-md p-8 rounded-3xl glass shadow-lift ${shake ? "animate-shake" : ""}`}>
        <div className="flex items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-xl leading-none">Ethara</div>
            <div className="text-xs text-muted-foreground">Team Task Manager</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.h2 key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="font-display text-3xl font-bold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </motion.h2>
        </AnimatePresence>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "login" ? "Sign in to continue to your workspace." : "Start collaborating in seconds."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                <FloatingInput label="Full name" value={fullName} onChange={(e: any) => setFullName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/60 rounded-xl">
                  {(["member", "admin"] as const).map(r => (
                    <button type="button" key={r} onClick={() => setRole(r)}
                      className={`relative h-10 rounded-lg text-sm font-medium capitalize transition-colors ${role === r ? "text-primary-foreground" : "text-muted-foreground"}`}>
                      {role === r && <motion.div layoutId="rolepill" className="absolute inset-0 rounded-lg bg-gradient-primary -z-10" />}
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <FloatingInput label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <FloatingInput label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />

          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-glow font-semibold">
            {loading ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : (mode === "login" ? "Sign in" : "Create account")}
          </Button>
        </form>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <span className="text-primary font-semibold">{mode === "login" ? "Sign up" : "Sign in"}</span>
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
