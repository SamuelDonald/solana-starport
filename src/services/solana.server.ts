import { readPlatformConfig } from "./feeService.functions";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface RpcTransaction {
  slot: number;
  meta: {
    err: unknown;
    preBalances: number[];
    postBalances: number[];
  } | null;
  transaction: {
    message: {
      accountKeys: string[];
    };
  };
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const { rpcUrl } = readPlatformConfig();
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Solana RPC error: ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`Solana RPC error: ${json.error.message}`);
  return json.result as T;
}

export interface VerifiedLaunch {
  slot: number;
  feePaidSol: number;
}

/**
 * Verifies on-chain that:
 *  - the transaction exists and succeeded,
 *  - the platform fee actually landed in the configured receiving wallet,
 *  - the payer wallet and the new mint were part of the transaction.
 *
 * Nothing is trusted from the frontend.
 */
export async function verifyLaunchTransaction(params: {
  signature: string;
  payerWallet: string;
  mintAddress: string;
  liquiditySol?: number;
  simBuySol?: number;
  simSellSol?: number;
}): Promise<VerifiedLaunch> {
  const { receivingWallet, launchFeeSol, networkFeeSol } = readPlatformConfig();
  // The server recomputes the expected total; the client total is never trusted.
  const expectedTotalSol =
    launchFeeSol +
    networkFeeSol +
    Math.max(0, params.liquiditySol ?? 0) +
    Math.max(0, params.simBuySol ?? 0) +
    Math.max(0, params.simSellSol ?? 0);

  let tx: RpcTransaction | null = null;
  for (let attempt = 0; attempt < 8 && !tx; attempt++) {
    tx = await rpc<RpcTransaction | null>("getTransaction", [
      params.signature,
      { encoding: "json", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
    ]);
    if (!tx) await new Promise((r) => setTimeout(r, 1500));
  }

  if (!tx) throw new Error("Transaction not found on Solana");
  if (!tx.meta) throw new Error("Transaction metadata unavailable");
  if (tx.meta.err) throw new Error("Transaction failed on Solana");

  const keys = tx.transaction.message.accountKeys;
  if (!keys.includes(params.payerWallet)) {
    throw new Error("Wallet did not sign this transaction");
  }
  if (!keys.includes(params.mintAddress)) {
    throw new Error("Mint address is not part of this transaction");
  }

  const feeIndex = keys.indexOf(receivingWallet);
  if (feeIndex === -1) throw new Error("Platform fee was not paid");

  const delta =
    (tx.meta.postBalances[feeIndex] ?? 0) - (tx.meta.preBalances[feeIndex] ?? 0);
  const feePaidSol = delta / LAMPORTS_PER_SOL;
  // small tolerance for rounding
  if (feePaidSol + 1e-9 < expectedTotalSol) {
    throw new Error("Payment amount is insufficient");
  }

  const mintInfo = await rpc<{ value: unknown }>("getAccountInfo", [
    params.mintAddress,
    { encoding: "base64", commitment: "confirmed" },
  ]);
  if (!mintInfo?.value) throw new Error("Mint account does not exist on Solana");

  return { slot: tx.slot, feePaidSol };
}
