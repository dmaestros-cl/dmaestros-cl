import { SiteHeader } from "@/components/SiteHeader";
import { CustomerAccount } from "@/components/CustomerAccount";
import { createClient } from "@/lib/supabase/server";
import { COMMERCIAL_ORDERS_FILTER } from "@/lib/commerce-policy";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ recovery?: string }> }) {
  const { recovery } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("customer_profiles").select("first_name,last_name,email,phone,address").eq("id", user.id).maybeSingle() : { data: null };
  const { data: orders } = user ? await supabase.from("orders").select("id,order_number,status,shipping_status,total,created_at,payment_environment").eq("customer_email", user.email ?? "").or(COMMERCIAL_ORDERS_FILTER).order("created_at", { ascending: false }) : { data: [] };
  return <div className="shop-shell"><SiteHeader /><main className="customer-account-page"><CustomerAccount profile={profile} orders={orders ?? []} recovery={recovery === "1"} /></main></div>;
}
