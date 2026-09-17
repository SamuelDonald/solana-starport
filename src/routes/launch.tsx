import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Rocket, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppLayout, PageHeading } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WalletButton } from "@/components/wallet/WalletButton";
import depositQr from "@/assets/deposit-wallet-qr.png.asset.json";
import {
  DEFAULT_SOL_VAULT_RECEIVING_WALLET,
  TOKEN_DEFAULTS,
} from "@/config/solVault";
import {
  improveTokenDescription,
  suggestTokenIdeas,
  type TokenIdea,
} from "@/services/aiService.functions";
import { getPlatformConfig } from "@/services/feeService.functions";
import { buildLaunchTransaction } from "@/services/launchService";
import { uploadTokenImage } from "@/services/storageService.functions";
import { registerTokenLaunch } from "@/services/tokenService.functions";
import { TX_STATE_LABEL, type TxState } from "@/services/transactionService";
import { CLIENT_NETWORK, truncateAddress } from "@/services/walletService";

export const Route = createFileRoute("/launch")({
  head: () => ({
    meta: [
      { title: "Launch a Solana Token — Sol Vault" },
      {
        name: "description",
        content:
          "Create a real Solana SPL token in four guided steps. Name it, add a logo and socials, pay one flat launch fee and go live.",
      },
      { property: "og:title", content: "Launch a Solana Token — Sol Vault" },
      {
        property: "og:description",
        content: "Create a real Solana SPL token in four guided steps on Sol Vault.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaunchPage,
});

interface FormState {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  discordUrl: string;
}

const EMPTY: FormState = {
  name: "",
  symbol: "",
  description: "",
  imageUrl: "",
  websiteUrl: "",
  twitterUrl: "",
  telegramUrl: "",
  discordUrl: "",
};

const STEPS = ["Basics", "Branding", "Socials", "Review"] as const;

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ring-1 ${
              i < step
                ? "bg-success/20 text-success ring-success/50"
                : i === step
                  ? "bg-primary/25 text-foreground ring-primary/60"
                  : "text-muted-foreground ring-border/70"
            }`}
          >
            {i < step ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span
            className={`hidden text-xs sm:block ${
              i === step ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 ? (
            <span className="h-px flex-1 bg-border/60" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function LaunchPage() {
  const navigate = useNavigate();
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction } = useWallet();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [launched, setLaunched] = useState<{ mint: string; signature: string } | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const [aiPrompt, setAiPrompt] = useState("");

  const upload = useServerFn(uploadTokenImage);
  const register = useServerFn(registerTokenLaunch);
  const platformConfig = useServerFn(getPlatformConfig);
  const suggest = useServerFn(suggestTokenIdeas);

  const rewrite = useServerFn(improveTokenDescription);

  const ideas = useMutation<TokenIdea[], Error, string>({
    mutationFn: (prompt: string) => suggest({ data: { prompt } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const improve = useMutation<string, Error, void>({
    mutationFn: () =>
      rewrite({
        data: {
          name: form.name.trim(),
          symbol: form.symbol.trim(),
          description: form.description.trim(),
        },
      }),
    onSuccess: (description) => {
      setForm((f) => ({ ...f, description }));
      toast.success("Description improved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: config } = useQuery({
    queryKey: ["platform-config"],
    queryFn: () => platformConfig(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("Could not read that file"));
        reader.readAsDataURL(file);
      });
      return upload({
        data: { fileName: file.name, contentType: file.type, data: base64 },
      });
    },
    onSuccess: (res) => {
      setForm((f) => ({ ...f, imageUrl: res.url }));
      toast.success("Logo uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const basicsValid = form.name.trim().length > 1 && form.symbol.trim().length > 0;

  async function handleLaunch() {
    if (!publicKey || !signTransaction || !config) return;
    try {
      setTx({ phase: "preparing" });
      const { transaction, mint } = await buildLaunchTransaction({
        connection,
        payer: publicKey,
        receivingWallet: config.receivingWallet,
        launchFeeSol: config.launchFeeSol,
        decimals: TOKEN_DEFAULTS.decimals,
        totalSupply: TOKEN_DEFAULTS.totalSupply,
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      transaction.partialSign(mint);

      setTx({ phase: "awaiting_signature" });
      const signed = await signTransaction(transaction);

      const signature = await connection.sendRawTransaction(signed.serialize());
      setTx({ phase: "confirming", signature });
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      await register({
        data: {
          signature,
          mintAddress: mint.publicKey.toBase58(),
          creatorWallet: publicKey.toBase58(),
          name: form.name.trim(),
          symbol: form.symbol.trim().toUpperCase(),
          description: form.description.trim() || null,
          imageUrl: form.imageUrl || null,
          websiteUrl: form.websiteUrl || null,
          twitterUrl: form.twitterUrl || null,
          telegramUrl: form.telegramUrl || null,
          discordUrl: form.discordUrl || null,
          totalSupply: TOKEN_DEFAULTS.totalSupply,
          decimals: TOKEN_DEFAULTS.decimals,
        },
      });

      setTx({ phase: "success", signature });
      setLaunched({ mint: mint.publicKey.toBase58(), signature });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Launch failed";
      setTx({ phase: "error", message });
      toast.error(message);
    }
  }

  if (launched) {
    const cluster = CLIENT_NETWORK === "mainnet-beta" ? "" : `?cluster=${CLIENT_NETWORK}`;
    return (
      <AppLayout>
        <div className="glass rise-in mx-auto max-w-xl rounded-3xl p-8 text-center">
          <div className="float-slow mb-4 text-6xl">🚀</div>
          <h1 className="font-display text-2xl text-cosmic">
            {form.symbol.toUpperCase()} is live
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your token was created on Solana {CLIENT_NETWORK}.
          </p>
          <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
            {launched.mint}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/token/$mint" params={{ mint: launched.mint }}>
                View token page
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href={`https://explorer.solana.com/tx/${launched.signature}${cluster}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction
              </a>
            </Button>
            <Button variant="ghost" onClick={() => void navigate({ to: "/portfolio" })}>
              My launches
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeading
        eyebrow="Create"
        title="Launch your token"
        subtitle="Four short steps. We mint a real SPL token, send the full supply to your wallet and lock the supply so no more can ever be created."
      />

      <div className="mx-auto max-w-2xl">
        <Stepper step={step} />

        <div className="glass rounded-3xl p-6 sm:p-8">
          {step === 0 ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-secondary/30 p-4">
                <Label htmlFor="ai-prompt" className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" /> Need ideas? Describe your
                  vibe
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="ai-prompt"
                    value={aiPrompt}
                    maxLength={300}
                    placeholder="space dog coin, funny, for gamers"
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={ideas.isPending || aiPrompt.trim().length < 2}
                    onClick={() => ideas.mutate(aiPrompt.trim())}
                  >
                    {ideas.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Suggest
                  </Button>
                </div>
                {ideas.data && ideas.data.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {ideas.data.map((idea) => (
                      <li key={`${idea.name}-${idea.symbol}`}>
                        <button
                          type="button"
                          className="w-full rounded-xl bg-background/50 px-4 py-3 text-left ring-1 ring-border/60 transition-colors hover:bg-background"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              name: idea.name,
                              symbol: idea.symbol,
                              description: idea.description,
                            }));
                            toast.success("Idea applied — edit anything you like");
                          }}
                        >
                          <span className="text-sm text-foreground">
                            {idea.name}{" "}
                            <span className="text-accent">${idea.symbol}</span>
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {idea.description}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div>
                <Label htmlFor="name">Token name</Label>
                <Input
                  id="name"
                  value={form.name}
                  maxLength={48}
                  placeholder="Cosmic Doge"
                  onChange={(e) => set("name")(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="symbol">Symbol / ticker</Label>
                <Input
                  id="symbol"
                  value={form.symbol}
                  maxLength={12}
                  placeholder="CDOGE"
                  onChange={(e) => set("symbol")(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  maxLength={500}
                  rows={4}
                  placeholder="What is your token about?"
                  onChange={(e) => set("description")(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  disabled={improve.isPending || form.description.trim().length < 3}
                  onClick={() => improve.mutate()}
                >
                  {improve.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Improve my description
                </Button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <Label>Token logo (optional)</Label>
                <div className="mt-2 flex items-center gap-4">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Token logo preview"
                      className="size-16 rounded-xl object-cover ring-1 ring-border/70"
                    />
                  ) : (
                    <div className="grid size-16 place-items-center rounded-xl border border-dashed border-border/70 text-muted-foreground">
                      <Upload className="size-5" />
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadMutation.isPending}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    Upload image
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  PNG, JPG, GIF or WebP up to 2MB.
                </p>
              </div>
              <div>
                <Label htmlFor="image-url">Or paste an image URL</Label>
                <Input
                  id="image-url"
                  value={form.imageUrl}
                  placeholder="https://..."
                  onChange={(e) => set("imageUrl")(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              {(
                [
                  ["websiteUrl", "Website"],
                  ["twitterUrl", "Twitter / X"],
                  ["telegramUrl", "Telegram"],
                  ["discordUrl", "Discord"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={key}>{label} (optional)</Label>
                  <Input
                    id={key}
                    value={form[key]}
                    placeholder="https://..."
                    onChange={(e) => set(key)(e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="size-14 rounded-xl object-cover"
                  />
                ) : null}
                <div>
                  <p className="font-display text-lg text-foreground">
                    {form.name || "Unnamed"}{" "}
                    <span className="text-accent">${form.symbol || "???"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TOKEN_DEFAULTS.totalSupply.toLocaleString()} supply ·{" "}
                    {TOKEN_DEFAULTS.decimals} decimals · fixed supply
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-border/50 rounded-2xl bg-secondary/30 px-5 text-sm">
                <div className="flex justify-between py-3">
                  <dt className="text-muted-foreground">Network</dt>
                  <dd>{config?.network ?? CLIENT_NETWORK}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-muted-foreground">Launch fee</dt>
                  <dd>{config ? `${config.launchFeeSol} SOL` : "…"}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-muted-foreground">Paying wallet</dt>
                  <dd className="font-mono text-xs">
                    {truncateAddress(publicKey?.toBase58(), 4) || "—"}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary/30 p-5 sm:flex-row sm:items-center">
                <img
                  src={depositQr.url}
                  alt="QR code for the Sol Vault deposit wallet address"
                  className="size-28 shrink-0 rounded-xl bg-background p-2"
                  loading="lazy"
                />
                <div className="min-w-0 text-center sm:text-left">
                  <p className="text-sm font-medium text-foreground">Deposit wallet</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {config?.receivingWallet ?? DEFAULT_SOL_VAULT_RECEIVING_WALLET}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scan to send SOL to the Sol Vault wallet. The launch fee is charged
                    automatically when you sign.
                  </p>
                </div>
              </div>

              {tx.phase !== "idle" ? (
                <p
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                    tx.phase === "error"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/10 text-foreground"
                  }`}
                >
                  {tx.phase !== "error" && tx.phase !== "success" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {tx.phase === "error" ? tx.message : TX_STATE_LABEL[tx.phase]}
                </p>
              ) : null}

              {!connected ? (
                <div className="rounded-xl bg-secondary/40 p-4 text-center">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Connect your wallet to pay the fee and sign the launch.
                  </p>
                  <WalletButton />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {step < 3 ? (
              <Button
                disabled={step === 0 && !basicsValid}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                disabled={
                  !connected ||
                  !basicsValid ||
                  !config ||
                  (tx.phase !== "idle" && tx.phase !== "error")
                }
                onClick={() => void handleLaunch()}
              >
                <Rocket className="size-4" />
                Launch token
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
