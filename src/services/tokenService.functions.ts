import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const launchInput = z.object({
  signature: z.string().min(32),
  mintAddress: z.string().min(32),
  creatorWallet: z.string().min(32),
  name: z.string().min(1).max(48),
  symbol: z.string().min(1).max(12),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
  websiteUrl: z.string().url().max(300).optional().nullable(),
  twitterUrl: z.string().url().max(300).optional().nullable(),
  telegramUrl: z.string().url().max(300).optional().nullable(),
  discordUrl: z.string().url().max(300).optional().nullable(),
  totalSupply: z.number().positive().max(1e15),
  decimals: z.number().int().min(0).max(9),
  liquiditySol: z.number().min(0).max(1e6).optional().default(0),
  simBuySol: z.number().min(0).max(1e6).optional().default(0),
  simSellSol: z.number().min(0).max(1e6).optional().default(0),
});

export type RegisterLaunchInput = z.infer<typeof launchInput>;

/**
 * Called after the user's wallet has submitted the launch transaction.
 * The token is ONLY recorded once the transaction is verified on Solana.
 */
export const registerTokenLaunch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => launchInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyLaunchTransaction } = await import("./solana.server");
    const verified = await verifyLaunchTransaction({
      signature: data.signature,
      payerWallet: data.creatorWallet,
      mintAddress: data.mintAddress,
      liquiditySol: data.liquiditySol,
      simBuySol: data.simBuySol,
      simSellSol: data.simSellSol,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("users")
      .upsert({ wallet_address: data.creatorWallet }, { onConflict: "wallet_address" });

    const { data: token, error } = await supabaseAdmin
      .from("tokens")
      .upsert(
        {
          mint_address: data.mintAddress,
          name: data.name,
          symbol: data.symbol.toUpperCase(),
          description: data.description ?? null,
          image_url: data.imageUrl ?? null,
          website_url: data.websiteUrl ?? null,
          twitter_url: data.twitterUrl ?? null,
          telegram_url: data.telegramUrl ?? null,
          discord_url: data.discordUrl ?? null,
          creator_wallet: data.creatorWallet,
          total_supply: data.totalSupply,
          decimals: data.decimals,
          status: "LIVE",
        },
        { onConflict: "mint_address" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { readPlatformConfig } = await import("./feeService.functions");
    const { launchFeeSol, networkFeeSol } = readPlatformConfig();

    const rows: Array<{
      wallet_address: string;
      token_id: string;
      transaction_signature: string;
      type: string;
      amount?: number | null;
      sol_amount: number;
      status: string;
    }> = [
      {
        wallet_address: data.creatorWallet,
        token_id: token.id,
        transaction_signature: data.signature,
        type: "TOKEN_LAUNCH",
        amount: data.totalSupply,
        sol_amount: verified.feePaidSol,
        status: "CONFIRMED",
      },
      {
        wallet_address: data.creatorWallet,
        token_id: token.id,
        transaction_signature: data.signature,
        type: "PLATFORM_FEE",
        sol_amount: launchFeeSol,
        status: "CONFIRMED",
      },
      {
        wallet_address: data.creatorWallet,
        token_id: token.id,
        transaction_signature: data.signature,
        type: "NETWORK_FEE",
        sol_amount: networkFeeSol,
        status: "CONFIRMED",
      },
    ];

    const extras: Array<[string, number]> = [
      ["LIQUIDITY", data.liquiditySol],
      ["SIM_BUY", data.simBuySol],
      ["SIM_SELL", data.simSellSol],
    ];
    for (const [type, sol] of extras) {
      if (sol > 0) {
        rows.push({
          wallet_address: data.creatorWallet,
          token_id: token.id,
          transaction_signature: data.signature,
          type,
          sol_amount: sol,
          status: "CONFIRMED",
        });
      }
    }

    await supabaseAdmin.from("transactions").insert(rows);

    return { token, feePaidSol: verified.feePaidSol };
  });
