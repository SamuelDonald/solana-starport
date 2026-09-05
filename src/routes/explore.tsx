import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { AppLayout, PageHeading } from "@/components/layout/AppLayout";
import { TokenCard } from "@/components/token/TokenCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listTokens, type TokenSort } from "@/services/tokenService";

const SORTS: { value: TokenSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "recently_launched", label: "Recently launched" },
  { value: "trending", label: "Trending" },
  { value: "volume", label: "Volume" },
  { value: "marketcap", label: "Market cap" },
];

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Solana Tokens — Sol Vault" },
      {
        name: "description",
        content:
          "Browse and search every memecoin launched through Sol Vault. Verify the mint address before you trade.",
      },
      { property: "og:title", content: "Explore Solana Tokens — Sol Vault" },
      {
        property: "og:description",
        content: "Browse and search every memecoin launched through Sol Vault.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TokenSort>("newest");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tokens", search, sort],
    queryFn: () => listTokens({ search, sort }),
  });

  return (
    <AppLayout>
      <PageHeading
        eyebrow="Discover"
        title="Explore the vault"
        subtitle="Every token launched on Sol Vault, straight from the chain."
      />

      <div className="glass mb-8 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, symbol or mint address"
            className="pl-9"
            aria-label="Search tokens"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                sort === s.value
                  ? "bg-primary/25 text-foreground ring-1 ring-primary/50"
                  : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {sort !== "newest" && sort !== "recently_launched" ? (
        <p className="mb-6 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
          Market-based sorting needs a live market data feed, which isn&apos;t connected
          yet — showing the most recent launches instead.
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load tokens"
          description={(error as Error).message}
        />
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? "No tokens match that search" : "The vault is empty"}
          description={
            search
              ? "Try a different name, symbol or mint address."
              : "No tokens have been launched yet. Be the first to send one into orbit."
          }
          action={
            <Button asChild>
              <Link to="/launch">Launch a token</Link>
            </Button>
          }
        />
      )}
    </AppLayout>
  );
}
