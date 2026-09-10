import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Coins, Rocket, ShieldCheck, Sparkles } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { TokenCard } from "@/components/token/TokenCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listTokens } from "@/services/tokenService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sol Vault — Launch Solana Memecoins in Minutes" },
      {
        name: "description",
        content:
          "Sol Vault is a Solana launchpad for memecoins. Connect a wallet, mint a real SPL token in four steps and track every launch on-chain.",
      },
      { property: "og:title", content: "Sol Vault — Launch Solana Memecoins" },
      {
        property: "og:description",
        content:
          "Connect a wallet, mint a real SPL token in four steps and track every launch on-chain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Rocket,
    title: "Launch in four steps",
    body: "Name, logo, socials, confirm. No code, no token standards to learn.",
  },
  {
    icon: ShieldCheck,
    title: "Real, verifiable tokens",
    body: "Every mint happens on Solana and is verified on-chain before it appears here.",
  },
  {
    icon: Coins,
    title: "One flat launch fee",
    body: "A single transparent fee, shown to you before you sign anything.",
  },
];

function Landing() {
  const { data, isLoading } = useQuery({
    queryKey: ["tokens", "", "newest", "home"],
    queryFn: () => listTokens({ sort: "newest", limit: 6 }),
  });

  return (
    <AppLayout>
      <section className="rise-in relative overflow-hidden rounded-3xl border border-border/60 px-6 py-16 text-center sm:px-10 sm:py-24">
        <div className="nebula pointer-events-none absolute inset-0 -z-10" />
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-accent">
          <Sparkles className="size-3" />
          Solana launchpad
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl leading-tight tracking-wide text-cosmic sm:text-6xl">
          Send your memecoin into orbit
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground sm:text-base">
          Sol Vault turns an idea into a real Solana token in minutes. Connect your
          wallet, fill in four short steps and watch it go live.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/launch">Launch a token</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/explore">Explore tokens</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5">
            <f.icon className="size-5 text-accent" />
            <h2 className="mt-3 font-display text-sm tracking-wide text-foreground">
              {f.title}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-xl tracking-wide text-cosmic">
            Fresh launches
          </h2>
          <Link to="/explore" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No tokens launched yet"
            description="The vault is waiting for its first coin. It could be yours."
            action={
              <Button asChild>
                <Link to="/launch">Launch the first token</Link>
              </Button>
            }
          />
        )}
      </section>
    </AppLayout>
  );
}
