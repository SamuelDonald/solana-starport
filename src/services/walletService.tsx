import "@/lib/buffer-polyfill";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";

import { defaultRpcUrl, type SolanaNetwork } from "@/config/solVault";


export const CLIENT_NETWORK: SolanaNetwork =
  (import.meta.env["VITE_SOL_VAULT_NETWORK"] as SolanaNetwork | undefined) ?? "devnet";

export const CLIENT_RPC_URL =
  (import.meta.env["VITE_SOL_VAULT_RPC_URL"] as string | undefined) ??
  defaultRpcUrl(CLIENT_NETWORK);

export function SolanaWalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={CLIENT_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}

export { WalletAdapterNetwork };

export function truncateAddress(address?: string | null, size = 4) {
  if (!address) return "";
  return `${address.slice(0, size)}...${address.slice(-size)}`;
}

export function useSolBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ["sol-balance", publicKey?.toBase58(), CLIENT_RPC_URL],
    enabled: !!publicKey,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!publicKey) return 0;
      const lamports = await connection.getBalance(publicKey);
      return lamports / LAMPORTS_PER_SOL;
    },
  });
}

export interface WalletTokenHolding {
  mint: string;
  amount: number;
  decimals: number;
}

/** Reads the SPL token accounts owned by the connected wallet. */
export function useWalletHoldings() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ["wallet-holdings", publicKey?.toBase58(), CLIENT_RPC_URL],
    enabled: !!publicKey,
    queryFn: async (): Promise<WalletTokenHolding[]> => {
      if (!publicKey) return [];
      const res = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new (await import("@solana/web3.js")).PublicKey(
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        ),
      });
      return res.value
        .map((item) => {
          const info = item.account.data.parsed.info;
          return {
            mint: info.mint as string,
            amount: Number(info.tokenAmount.uiAmount ?? 0),
            decimals: Number(info.tokenAmount.decimals ?? 0),
          };
        })
        .filter((h) => h.amount > 0);
    },
  });
}
