import { Link } from "@tanstack/react-router";
import { Compass, Home, Rocket, Wallet as WalletIcon } from "lucide-react";

import { WalletButton } from "@/components/wallet/WalletButton";

const NAV = [
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/launch", label: "Launch", icon: Rocket },
  { to: "/portfolio", label: "Portfolio", icon: WalletIcon },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="relative grid size-8 place-items-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
            <Rocket className="size-4 text-accent" />
          </span>
          <span className="font-display text-sm tracking-[0.25em] text-cosmic sm:text-base">
            SOL VAULT
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              activeProps={{ className: "bg-secondary/70 text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const items = [{ to: "/", label: "Home", icon: Home } as const, ...NAV];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <Link
              to={item.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground transition-colors"
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-accent" }}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
