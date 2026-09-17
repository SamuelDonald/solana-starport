import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const recordInput = z.object({
  signature: z.string().min(32),
  senderWallet: z.string().min(32),
});

const listInput = z.object({ wallet: z.string().min(32) });

export interface DepositRecord {
  id: string;
  wallet_address: string;
  transaction_signature: string;
  sol_amount: number;
  destination_wallet: string;
  status: string;
  created_at: string;
}

/** Verifies a deposit on-chain and stores it. */
export const recordDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => recordInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyDepositTransaction } = await import("./depositService.server");
    const verified = await verifyDepositTransaction({
      signature: data.signature,
      senderWallet: data.senderWallet,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("users")
      .upsert({ wallet_address: data.senderWallet }, { onConflict: "wallet_address" });

    const { data: row, error } = await supabaseAdmin
      .from("deposits")
      .upsert(
        {
          wallet_address: data.senderWallet,
          transaction_signature: data.signature,
          sol_amount: verified.solAmount,
          destination_wallet: verified.destination,
          status: "CONFIRMED",
        },
        { onConflict: "transaction_signature" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabaseAdmin.from("transactions").insert({
      wallet_address: data.senderWallet,
      transaction_signature: data.signature,
      type: "DEPOSIT",
      sol_amount: verified.solAmount,
      status: "CONFIRMED",
    });

    return row as DepositRecord;
  });

/** Deposits made by one wallet, newest first. */
export const listDeposits = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => listInput.parse(data))
  .handler(async ({ data }): Promise<DepositRecord[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("deposits")
      .select("*")
      .eq("wallet_address", data.wallet)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as DepositRecord[];
  });
