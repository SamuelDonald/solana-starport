import {
  AuthorityType,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export interface LaunchTransactionParams {
  connection: Connection;
  payer: PublicKey;
  receivingWallet: string;
  launchFeeSol: number;
  /** Liquidity + simulated buys + simulated sells + network fee, in SOL. */
  extraSol?: number;
  decimals: number;
  totalSupply: number;
  /** Percentage of the supply the creator keeps (0-100). The rest is released
   *  to the Sol Vault wallet and held there until pool launching goes live. */
  creatorPercent?: number;
}

export interface BuiltLaunchTransaction {
  transaction: Transaction;
  mint: Keypair;
}

/**
 * Builds the real SPL token creation transaction:
 *  - create + initialize the mint
 *  - create the creator's associated token account
 *  - mint the full supply to the creator
 *  - revoke the mint authority (fixed supply)
 *  - pay the Sol Vault platform fee
 */
export async function buildLaunchTransaction(
  params: LaunchTransactionParams,
): Promise<BuiltLaunchTransaction> {
  const { connection, payer, decimals, totalSupply } = params;
  const mint = Keypair.generate();
  const rent = await getMinimumBalanceForRentExemptMint(connection);
  const ata = getAssociatedTokenAddressSync(mint.publicKey, payer);
  const rawAmount = BigInt(Math.round(totalSupply)) * BigInt(10) ** BigInt(decimals);

  const percent = Math.min(100, Math.max(0, params.creatorPercent ?? 100));
  const creatorAmount = (rawAmount * BigInt(Math.round(percent))) / BigInt(100);
  const releasedAmount = rawAmount - creatorAmount;

  const vaultOwner = new PublicKey(params.receivingWallet);
  const vaultAta = getAssociatedTokenAddressSync(mint.publicKey, vaultOwner, true);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: rent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mint.publicKey, decimals, payer, payer),
    createAssociatedTokenAccountInstruction(payer, ata, payer, mint.publicKey),
  );

  if (creatorAmount > BigInt(0)) {
    transaction.add(createMintToInstruction(mint.publicKey, ata, payer, creatorAmount));
  }

  if (releasedAmount > BigInt(0)) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        vaultAta,
        vaultOwner,
        mint.publicKey,
      ),
      createMintToInstruction(mint.publicKey, vaultAta, payer, releasedAmount),
    );
  }

  transaction.add(
    createSetAuthorityInstruction(mint.publicKey, payer, AuthorityType.MintTokens, null),
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(params.receivingWallet),
      lamports: Math.round(
        (params.launchFeeSol + (params.extraSol ?? 0)) * LAMPORTS_PER_SOL,
      ),
    }),
  );

  return { transaction, mint };
}
