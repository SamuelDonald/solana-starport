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
  decimals: number;
  totalSupply: number;
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
    createMintToInstruction(mint.publicKey, ata, payer, rawAmount),
    createSetAuthorityInstruction(mint.publicKey, payer, AuthorityType.MintTokens, null),
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(params.receivingWallet),
      lamports: Math.round(params.launchFeeSol * LAMPORTS_PER_SOL),
    }),
  );

  return { transaction, mint };
}
