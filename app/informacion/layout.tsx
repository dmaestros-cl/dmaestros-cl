import { SiteHeader } from "@/components/SiteHeader";

export default function InformationLayout({ children }: { children: React.ReactNode }) {
  return <div className="shop-shell"><SiteHeader />{children}</div>;
}
