import type { ReactNode } from "react";

export function EmptyState({
  icon = "🛰️",
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass rise-in flex flex-col items-center rounded-3xl px-6 py-16 text-center">
      <div className="float-slow mb-5 text-5xl">{icon}</div>
      <h3 className="font-display text-lg tracking-wide text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
