import type { Tables } from "@/integrations/supabase/types";

export type TransactionRow = Tables<"transactions"> & {
  tokens?: Pick<Tables<"tokens">, "name" | "symbol" | "image_url" | "mint_address"> | null;
};

export type TxState =
  | { phase: "idle" }
  | { phase: "preparing" }
  | { phase: "awaiting_signature" }
  | { phase: "submitted"; signature: string }
  | { phase: "confirming"; signature: string }
  | { phase: "success"; signature: string }
  | { phase: "error"; message: string };

export const TX_STATE_LABEL: Record<TxState["phase"], string> = {
  idle: "",
  preparing: "Preparing launch...",
  awaiting_signature: "Waiting for wallet approval...",
  submitted: "Transaction submitted...",
  confirming: "Confirming on Solana...",
  success: "🚀 Successfully launched",
  error: "Transaction failed",
};
