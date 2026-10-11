"use client";

import { useEffect, useState } from "react";

const tabs = [
  { id: "ventas", label: "Ventas y WhatsApp" },
  { id: "redes", label: "Redes sociales" },
  { id: "footer", label: "Pie de página" },
  { id: "hero", label: "Hero principal" },
] as const;
type TabId = (typeof tabs)[number]["id"];

export function AdminSettingsTabs({ panels }: { panels: Record<TabId, React.ReactNode> }) {
  const [active, setActive] = useState<TabId>("ventas");

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1) as TabId;
      if (tabs.some((tab) => tab.id === hash)) setActive(hash);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function selectTab(id: TabId) {
    setActive(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
  }

  return <div className="admin-settings-tabs-shell">
    <div className="admin-settings-nav" role="tablist" aria-label="Secciones de configuración">
      {tabs.map((tab) => <button id={`tab-${tab.id}`} className={active === tab.id ? "is-active" : ""} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => selectTab(tab.id)} key={tab.id}>{tab.label}</button>)}
    </div>
    {tabs.map((tab) => <section id={`panel-${tab.id}`} className="admin-settings-section" role="tabpanel" aria-labelledby={`tab-${tab.id}`} hidden={active !== tab.id} key={tab.id}>{panels[tab.id]}</section>)}
  </div>;
}
