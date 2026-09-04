import { createServerFn } from "@tanstack/react-start";

import {
  DEFAULT_SOLANA_NETWORK,
  DEFAULT_SOL_VAULT_LAUNCH_FEE,
  DEFAULT_SOL_VAULT_RECEIVING_WALLET,
  defaultRpcUrl,
  type PlatformConfig,
  type SolanaNetwork,
} from "@/config/solVault";

/**
 * Server-owned fee configuration. The frontend only ever *reads* this — the
 * receiving wallet and fee amount can never be modified by a user.
 */
export function readPlatformConfig(): PlatformConfig {
  const network = (process.env["SOL_VAULT_NETWORK"] ??
    DEFAULT_SOLANA_NETWORK) as SolanaNetwork;
  const feeRaw = process.env["SOL_VAULT_LAUNCH_FEE"];
  const parsedFee = feeRaw ? Number(feeRaw) : Number.NaN;

  return {
    receivingWallet:
      process.env["SOL_VAULT_RECEIVING_WALLET"] ?? DEFAULT_SOL_VAULT_RECEIVING_WALLET,
    launchFeeSol: Number.isFinite(parsedFee) ? parsedFee : DEFAULT_SOL_VAULT_LAUNCH_FEE,
    network,
    rpcUrl: process.env["SOL_VAULT_RPC_URL"] ?? defaultRpcUrl(network),
  };
}

export const getPlatformConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlatformConfig> => readPlatformConfig(),
);
