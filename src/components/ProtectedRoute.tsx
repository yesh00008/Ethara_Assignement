import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center bg-mesh"><div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};
