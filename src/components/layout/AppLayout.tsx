import type { ReactNode } from "react";

import { MobileTabBar, SiteHeader } from "@/components/layout/SiteHeader";
import { StarField } from "@/components/space/StarField";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <StarField />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 md:pb-16">
        {children}
      </main>
      <footer className="mx-auto hidden max-w-7xl px-6 pb-10 text-xs text-muted-foreground md:block">
        Sol Vault — launch on Solana. Always verify a token before you buy.
      </footer>
      <MobileTabBar />
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="rise-in mb-8">
      {eyebrow ? (
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-3xl tracking-wide text-cosmic sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
