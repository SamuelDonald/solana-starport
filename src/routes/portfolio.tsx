import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppLayout, PageHeading } from "@/components/layout/AppLayout";
import { TokenCard, TokenAvatar } from "@/components/token/TokenCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletButton } from "@/components/wallet/WalletButton";
import { listTokensByCreator } from "@/services/tokenService";
import { listWalletActivity } from "@/services/transactionService.functions";
import {
  truncateAddress,
  useSolBalance,
  useWalletHoldings,
} from "@/services/walletService";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Your Portfolio — Sol Vault" },
      {
        name: "description",
        content:
          "See your SOL balance, token holdings, launches and on-chain activity in one place.",
      },
      { property: "og:title", content: "Your Portfolio — Sol Vault" },
      {
        property: "og:description",
        content: "Your SOL balance, holdings, launches and activity on Sol Vault.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toBase58();
  const { data: balance } = useSolBalance();
  const holdings = useWalletHoldings();

  const launches = useQuery({
    queryKey: ["my-launches", wallet],
    enabled: !!wallet,
    queryFn: () => listTokensByCreator(wallet!),
  });

  const activity = useQuery({
    queryKey: ["activity", wallet],
    enabled: !!wallet,
    queryFn: () => listWalletActivity({ data: { wallet: wallet! } }),
  });

  if (!connected || !wallet) {
    return (
      <AppLayout>
        <PageHeading eyebrow="Portfolio" title="Your holdings" />
        <EmptyState
          icon="👛"
          title="Connect your wallet"
          description="Connect a Solana wallet to see your balance, holdings, launches and activity."
          action={<WalletButton />}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeading
        eyebrow="Portfolio"
        title="Your holdings"
        subtitle={`Wallet ${truncateAddress(wallet, 6)}`}
      />

      <div className="glass mb-8 flex flex-wrap items-center gap-8 rounded-2xl p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            SOL balance
          </p>
          <p className="mt-1 font-display text-2xl text-cosmic">
            {balance !== undefined ? `${balance.toFixed(4)} SOL` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Tokens held
          </p>
          <p className="mt-1 font-display text-2xl text-cosmic">
            {holdings.data?.length ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Launches
          </p>
          <p className="mt-1 font-display text-2xl text-cosmic">
            {launches.data?.length ?? "—"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="holdings">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="launches">My launches</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="mt-6">
          {holdings.isLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : holdings.data && holdings.data.length > 0 ? (
            <ul className="glass divide-y divide-border/50 rounded-2xl">
              {holdings.data.map((h) => (
                <li
                  key={h.mint}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <Link
                    to="/token/$mint"
                    params={{ mint: h.mint }}
                    className="min-w-0 font-mono text-xs text-muted-foreground hover:text-accent"
                  >
                    {truncateAddress(h.mint, 8)}
                  </Link>
                  <span className="font-display text-sm text-foreground">
                    {h.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="🪐"
              title="No tokens yet"
              description="Tokens you hold in this wallet will appear here."
              action={
                <Button asChild variant="outline">
                  <Link to="/explore">Explore tokens</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="launches" className="mt-6">
          {launches.isLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : launches.data && launches.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {launches.data.map((t) => (
                <TokenCard key={t.id} token={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🚀"
              title="No launches yet"
              description="Create your first token and it will show up here."
              action={
                <Button asChild>
                  <Link to="/launch">Launch a token</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {activity.isLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : activity.data && activity.data.length > 0 ? (
            <ul className="glass divide-y divide-border/50 rounded-2xl">
              {activity.data.map((tx) => (
                <li key={tx.id} className="flex items-center gap-4 px-5 py-4">
                  {tx.tokens ? (
                    <TokenAvatar token={tx.tokens} size="size-9" />
                  ) : (
                    <div className="size-9 rounded-xl bg-secondary/60" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {tx.type.replaceAll("_", " ")}
                      {tx.tokens ? ` · ${tx.tokens.symbol}` : ""}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {truncateAddress(tx.transaction_signature, 8)}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-foreground">
                      {tx.sol_amount ? `${tx.sol_amount} SOL` : "—"}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="🛰️"
              title="No activity yet"
              description="Launches and trades made with this wallet will be listed here."
            />
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
