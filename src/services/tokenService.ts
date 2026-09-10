import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TokenRow = Tables<"tokens">;

export type TokenSort =
  | "newest"
  | "trending"
  | "volume"
  | "marketcap"
  | "recently_launched";

export async function listTokens(options: {
  search?: string;
  sort?: TokenSort;
  limit?: number;
}): Promise<TokenRow[]> {
  let query = supabase.from("tokens").select("*").limit(options.limit ?? 60);


  const search = options.search?.trim();
  if (search) {
    const escaped = search.replace(/[%,]/g, "");
    query = query.or(
      `name.ilike.%${escaped}%,symbol.ilike.%${escaped}%,mint_address.ilike.%${escaped}%`,
    );
  }

  // Market-derived sorts (trending / volume / market cap) require a live market
  // data provider — until one is connected they fall back to launch recency
  // rather than inventing numbers.
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTokenByMint(mintAddress: string): Promise<TokenRow | null> {
  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .eq("mint_address", mintAddress)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listTokensByCreator(wallet: string): Promise<TokenRow[]> {
  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .eq("creator_wallet", wallet)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
