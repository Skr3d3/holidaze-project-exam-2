import { ReactNode } from "react";
import { getUser } from "../lib/auth";

export default function RequireManager({ children }: { children: ReactNode }) {
  const user = getUser<{ venueManager?: boolean }>();
  if (!user) return <div className="page">Please log in.</div>;
  if (!user.venueManager) return <div className="page">Only venue managers can access this page.</div>;
  return <>{children}</>;
}