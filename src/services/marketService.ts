/**
 * Market data abstraction.
 *
 * No Solana market-data provider is connected yet, so this service reports
 * "unavailable" instead of inventing numbers. Connecting a provider later only
 * requires implementing `MarketDataProvider` and assigning it to `provider`.
 */

export interface MarketSnapshot {
  marketCapUsd: number | null;
  liquiditySol: number | null;
  volume24hSol: number | null;
  holders: number | null;
  priceChange24hPercent: number | null;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface MarketDataProvider {
  readonly name: string;
  getSnapshot(mintAddress: string): Promise<MarketSnapshot>;
  getPriceHistory(mintAddress: string, range: "1H" | "24H" | "7D"): Promise<PricePoint[]>;
}

let provider: MarketDataProvider | null = null;

export function registerMarketDataProvider(next: MarketDataProvider) {
  provider = next;
}

export const marketService = {
  get isConnected() {
    return provider !== null;
  },
  get providerName() {
    return provider?.name ?? null;
  },
  async getSnapshot(mintAddress: string): Promise<MarketSnapshot> {
    if (!provider) {
      return {
        marketCapUsd: null,
        liquiditySol: null,
        volume24hSol: null,
        holders: null,
        priceChange24hPercent: null,
      };
    }
    return provider.getSnapshot(mintAddress);
  },
  async getPriceHistory(
    mintAddress: string,
    range: "1H" | "24H" | "7D" = "24H",
  ): Promise<PricePoint[]> {
    if (!provider) return [];
    return provider.getPriceHistory(mintAddress, range);
  },
};

export function formatMetric(
  value: number | null | undefined,
  format: (v: number) => string,
): string {
  if (value === null || value === undefined) return "—";
  return format(value);
}

export function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function tokenAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
