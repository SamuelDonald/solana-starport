/**
 * Centralised Sol Vault platform configuration.
 *
 * The receiving wallet and the launch fee live here (and in environment
 * variables) ONLY. Never hardcode them anywhere else in the application, and
 * never expose them as user-editable settings.
 *
 * Later phases can extend this with multiple receiving wallets, revenue
 * splitting, creator fees, trading fees and referral fees.
 */

export const DEFAULT_SOL_VAULT_RECEIVING_WALLET =
  "DXVdPZ4SKvtbX7DxRgCB7n9Wh9Te1LrJqfnsSwMs8J9W";

/** Launch fee in SOL. */
export const DEFAULT_SOL_VAULT_LAUNCH_FEE = 0.05;

export const DEFAULT_SOLANA_NETWORK = "devnet" as const;

export type SolanaNetwork = "devnet" | "mainnet-beta" | "testnet";

export interface PlatformConfig {
  receivingWallet: string;
  launchFeeSol: number;
  network: SolanaNetwork;
  rpcUrl: string;
}

export function defaultRpcUrl(network: SolanaNetwork): string {
  if (network === "mainnet-beta") return "https://api.mainnet-beta.solana.com";
  if (network === "testnet") return "https://api.testnet.solana.com";
  return "https://api.devnet.solana.com";
}

/** Token launch defaults so a beginner can launch without tuning anything. */
export const TOKEN_DEFAULTS = {
  totalSupply: 1_000_000_000,
  decimals: 9,
  initialLaunchAmountPercent: 100,
  creatorAllocationPercent: 0,
};
