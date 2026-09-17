import { readPlatformConfig } from "./feeService.functions";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface RpcTransaction {
  slot: number;
  meta: {
    err: unknown;
    preBalances: number[];
    postBalances: number[];
  } | null;
  transaction: { message: { accountKeys: string[] } };
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

/**
 * Confirms on-chain that a deposit transaction actually moved SOL from the
 * sender into the Sol Vault receiving wallet. Nothing is trusted from the
 * browser: the amount recorded is the amount the chain reports.
 */
export async function verifyDepositTransaction(params: {
  signature: string;
  senderWallet: string;
}): Promise<{ solAmount: number; destination: string }> {
  const { receivingWallet } = readPlatformConfig();

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
  if (!keys.includes(params.senderWallet)) {
    throw new Error("That wallet did not sign this transaction");
  }

  const index = keys.indexOf(receivingWallet);
  if (index === -1) throw new Error("This transaction did not pay the Sol Vault wallet");

  const delta =
    (tx.meta.postBalances[index] ?? 0) - (tx.meta.preBalances[index] ?? 0);
  const solAmount = delta / LAMPORTS_PER_SOL;
  if (solAmount <= 0) throw new Error("No SOL reached the Sol Vault wallet");

  return { solAmount, destination: receivingWallet };
}
