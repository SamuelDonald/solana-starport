import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Globe, MessageCircle, Send, Twitter } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { TokenAvatar } from "@/components/token/TokenCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMetric, formatUsd, marketService, tokenAge } from "@/services/marketService";
import { getTokenByMint } from "@/services/tokenService";
import { CLIENT_NETWORK, truncateAddress } from "@/services/walletService";

export const Route = createFileRoute("/token/$mint")({
  head: ({ params }) => {
    const title = `Token ${params.mint.slice(0, 6)}… — Sol Vault`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Details, supply and on-chain links for the Solana token ${params.mint} launched on Sol Vault.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Details and on-chain links for Solana token ${params.mint}.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TokenDetailPage,
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-lg text-foreground">{value}</p>
    </div>
  );
}

function TokenDetailPage() {
  const { mint } = Route.useParams();

  const { data: token, isLoading } = useQuery({
    queryKey: ["token", mint],
    queryFn: () => getTokenByMint(mint),
  });

  const { data: snapshot } = useQuery({
    queryKey: ["market", mint],
    queryFn: () => marketService.getSnapshot(mint),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-64 rounded-3xl" />
      </AppLayout>
    );
  }

  if (!token) {
    return (
      <AppLayout>
        <EmptyState
          icon="🔭"
          title="Token not found"
          description="We couldn't find a token with that mint address in the vault."
          action={
            <Button asChild variant="outline">
              <Link to="/explore">Back to explore</Link>
            </Button>
          }
        />
      </AppLayout>
    );
  }

  const cluster = CLIENT_NETWORK === "mainnet-beta" ? "" : `?cluster=${CLIENT_NETWORK}`;
  const socials = [
    { url: token.website_url, label: "Website", Icon: Globe },
    { url: token.twitter_url, label: "Twitter", Icon: Twitter },
    { url: token.telegram_url, label: "Telegram", Icon: Send },
    { url: token.discord_url, label: "Discord", Icon: MessageCircle },
  ].filter((s) => !!s.url);

  return (
    <AppLayout>
      <div className="glass rise-in rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <TokenAvatar token={token} size="size-20" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl tracking-wide text-cosmic sm:text-3xl">
              {token.name}{" "}
              <span className="text-accent">${token.symbol}</span>
            </h1>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(token.mint_address);
                toast.success("Mint address copied");
              }}
              className="mt-2 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-accent"
            >
              {truncateAddress(token.mint_address, 8)} <Copy className="size-3" />
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Launched {tokenAge(token.created_at)} ago by{" "}
              <span className="font-mono">{truncateAddress(token.creator_wallet, 4)}</span>
            </p>
          </div>
          <Button asChild variant="outline">
            <a
              href={`https://explorer.solana.com/address/${token.mint_address}${cluster}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Solana Explorer
            </a>
          </Button>
        </div>

        {token.description ? (
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {token.description}
          </p>
        ) : null}

        {socials.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map(({ url, label, Icon }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="size-3.5" /> {label}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total supply" value={Number(token.total_supply).toLocaleString()} />
        <Stat label="Decimals" value={String(token.decimals)} />
        <Stat
          label="Market cap"
          value={formatMetric(snapshot?.marketCapUsd, formatUsd)}
        />
        <Stat
          label="Holders"
          value={formatMetric(snapshot?.holders, (v) => v.toLocaleString())}
        />
      </div>

      <div className="glass mt-6 rounded-3xl p-6">
        <h2 className="font-display text-sm tracking-wide text-foreground">
          Price chart & trading
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This token has no liquidity pool yet, so there is no price, chart or buy/sell
          market to show. Charts and swapping turn on automatically once a market data
          and liquidity provider is connected in a later phase.
        </p>
        <div className="mt-5 grid h-40 place-items-center rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground">
          Chart unavailable — no market data connected
        </div>
      </div>
    </AppLayout>
  );
}
