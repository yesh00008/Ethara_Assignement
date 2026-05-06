import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, Users, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background bg-mesh overflow-hidden">
      <header className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">Ethara</span>
        </div>
        <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
      </header>

      <section className="relative px-6 md:px-12 pt-12 pb-32 max-w-6xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> A modern team task manager
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          Plan, assign, ship.<br />
          <span className="text-gradient">Beautifully together.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Ethara is a Linear-fast, Asana-friendly Kanban workspace for high-trust teams. Role-based, real-time, and designed to disappear.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow gap-2 h-12 px-6">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth"><Button size="lg" variant="outline" className="h-12 px-6">Sign in</Button></Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 grid md:grid-cols-3 gap-4 text-left">
          {[
            { icon: Zap, t: "Lightning Kanban", d: "Drag, drop, done. Zero-latency boards built for speed." },
            { icon: Users, t: "Role-based", d: "Admins lead, members ship. Enforced at the database." },
            { icon: CheckCircle2, t: "Always in sync", d: "Live updates, animated charts, beautiful detail." },
          ].map((f, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="p-6 rounded-2xl glass shadow-card">
              <f.icon className="h-6 w-6 text-primary mb-3" />
              <div className="font-semibold mb-1">{f.t}</div>
              <div className="text-sm text-muted-foreground">{f.d}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;
