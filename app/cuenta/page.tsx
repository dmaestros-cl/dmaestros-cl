import { SiteHeader } from "@/components/SiteHeader";
import { CustomerAccount } from "@/components/CustomerAccount";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ recovery?: string }> }) {
  const { recovery } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("customer_profiles").select("first_name,last_name,email,phone,address").eq("id", user.id).maybeSingle() : { data: null };
  return <div className="shop-shell"><SiteHeader /><main className="customer-account-page"><CustomerAccount profile={profile} recovery={recovery === "1"} /></main></div>;
}
