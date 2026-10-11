import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "dmaestros.cl@gmail.com";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  const isAdmin =
    user.email?.toLowerCase() === ADMIN_EMAIL &&
    user.app_metadata?.role === "admin";
  if (!isAdmin) redirect("/admin/login?error=unauthorized");

  return { supabase, user };
}
