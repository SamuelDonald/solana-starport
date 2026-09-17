import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout, PageHeading } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { WalletButton } from "@/components/wallet/WalletButton";
import depositQr from "@/assets/deposit-wallet-qr.png.asset.json";
import { DEFAULT_SOL_VAULT_RECEIVING_WALLET } from "@/config/solVault";
import { listDeposits, recordDeposit } from "@/services/depositService.functions";
import { getPlatformConfig } from "@/services/feeService.functions";
import { CLIENT_NETWORK, useSolBalance } from "@/services/walletService";

export const Route = createFileRoute("/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit SOL — Sol Vault" },
      {
        name: "description",
        content:
          "Send SOL to your Sol Vault balance. Scan the QR code or pay straight from your connected Solana wallet.",
      },
      { property: "og:title", content: "Deposit SOL — Sol Vault" },
      {
        property: "og:description",
        content: "Send SOL to your Sol Vault balance from any Solana wallet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DepositPage,
});

function DepositPage() {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const platformConfig = useServerFn(getPlatformConfig);
  const record = useServerFn(recordDeposit);
  const fetchDeposits = useServerFn(listDeposits);
  const { data: balance } = useSolBalance();
  const [amount, setAmount] = useState("0.1");

  const { data: config } = useQuery({
    queryKey: ["platform-config"],
    queryFn: () => platformConfig(),
  });

  const wallet = publicKey?.toBase58();
  const address = config?.receivingWallet ?? DEFAULT_SOL_VAULT_RECEIVING_WALLET;

  const { data: deposits } = useQuery({
    queryKey: ["deposits", wallet],
    enabled: !!wallet,
    queryFn: () => fetchDeposits({ data: { wallet: wallet! } }),
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!publicKey || !sendTransaction) throw new Error("Connect your wallet first");
      const sol = Number(amount);
      if (!Number.isFinite(sol) || sol <= 0) throw new Error("Enter a valid SOL amount");

      const { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } = await import(
        "@solana/web3.js"
      );
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(address),
          lamports: Math.round(sol * LAMPORTS_PER_SOL),
        }),
      );
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      return record({ data: { signature, senderWallet: publicKey.toBase58() } });
    },
    onSuccess: () => {
      toast.success("Deposit confirmed");
      void queryClient.invalidateQueries({ queryKey: ["deposits", wallet] });
      void queryClient.invalidateQueries({ queryKey: ["sol-balance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cluster = CLIENT_NETWORK === "mainnet-beta" ? "" : `?cluster=${CLIENT_NETWORK}`;

  return (
    <AppLayout>
      <PageHeading
        eyebrow="Wallet"
        title="Deposit SOL"
        subtitle="Every deposit goes to the Sol Vault wallet. Scan the code from any wallet app, or send it straight from your connected wallet."
      />

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <div className="glass rounded-3xl p-6 text-center">
          <img
            src={depositQr.url}
            alt="QR code for the Sol Vault deposit wallet address"
            className="mx-auto size-44 rounded-2xl bg-background p-3"
          />
          <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
            {address}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              void navigator.clipboard.writeText(address);
              toast.success("Address copied");
            }}
          >
            <Copy className="size-4" /> Copy address
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Solana {config?.network ?? CLIENT_NETWORK} only. Sending from another network
            will lose the funds.
          </p>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg text-foreground">
            Send from connected wallet
          </h2>
          {connected ? (
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="amount">Amount in SOL</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Wallet balance:{" "}
                  {balance !== undefined ? `${balance.toFixed(4)} SOL` : "…"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0.05, 0.1, 0.5, 1].map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(v))}
                  >
                    {v} SOL
                  </Button>
                ))}
              </div>
              <Button
                className="w-full"
                disabled={send.isPending}
                onClick={() => send.mutate()}
              >
                {send.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {send.isPending ? "Confirming…" : "Send deposit"}
              </Button>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                Connect a wallet to deposit in one click.
              </p>
              <WalletButton />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        <h2 className="mb-3 font-display text-lg text-foreground">Your deposits</h2>
        {!wallet ? (
          <EmptyState
            title="No wallet connected"
            description="Connect your wallet to see the deposits you've made."
          />
        ) : deposits && deposits.length > 0 ? (
          <ul className="glass divide-y divide-border/50 rounded-2xl">
            {deposits.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleString()}
                </span>
                <span className="text-foreground">
                  {Number(d.sol_amount).toFixed(4)} SOL
                </span>
                <a
                  className="text-xs text-accent underline-offset-4 hover:underline"
                  href={`https://explorer.solana.com/tx/${d.transaction_signature}${cluster}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No deposits yet"
            description="Your confirmed deposits will appear here with a link to the blockchain record."
          />
        )}
      </div>
    </AppLayout>
  );
}
