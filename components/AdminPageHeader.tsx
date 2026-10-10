export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="admin-page-header"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function AdminEmpty({ title, description }: { title: string; description: string }) {
  return <div className="admin-empty"><span>＋</span><h2>{title}</h2><p>{description}</p></div>;
}
