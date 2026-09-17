import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { TransactionRow } from "@/services/transactionService";

const input = z.object({ wallet: z.string().min(32) });

/** Activity for one wallet, read server-side so the table stays private. */
export const listWalletActivity = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<TransactionRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("transactions")
      .select("*, tokens(name, symbol, image_url, mint_address)")
      .eq("wallet_address", data.wallet)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as TransactionRow[];
  });
