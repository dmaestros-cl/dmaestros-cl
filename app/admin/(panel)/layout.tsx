import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return <AdminShell email={user.email ?? ""}>{children}</AdminShell>;
}
