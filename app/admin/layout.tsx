import type { ReactNode } from "react";
import AdminSessionBridge from "@/components/admin-session-bridge";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminSessionBridge />
      {children}
    </>
  );
}
