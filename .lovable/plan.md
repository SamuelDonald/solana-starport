# Launch pricing: 1 SOL fee + liquidity + simulated buys/sells

## What changes for the user

**Launch fee becomes 1 SOL** (currently 0.05 SOL).

**New "Funding" step in the launch wizard**, before Review. The user types SOL amounts for:
- Liquidity — SOL set aside for the coin's pool
- Simulated buys — SOL used for buy activity
- Simulated sells — SOL used for sell activity

Each is optional (blank or 0 allowed), with quick-pick buttons (0.1 / 0.5 / 1 / 5) and a live running total. A short note explains liquidity and simulated activity are held in the Sol Vault wallet for now and applied when pool launching goes live.

**Review step shows a full cost breakdown:**

```text
Launch fee            1.00 SOL
Liquidity             0.50 SOL
Simulated buys        0.25 SOL
Simulated sells       0.25 SOL
Network fee           0.05 SOL
------------------------------
Total                 2.05 SOL
```

The single signed transaction sends that whole total to the Sol Vault wallet
`DXVdPZ4SKvtbX7DxRgCB7n9Wh9Te1LrJqfnsSwMs8J9W` — one approval, one payment.
If the connected wallet's balance is below the total, the Launch button is disabled with a "Not enough SOL" message instead of a failed signature.

**Network label reads "Mainnet"** everywhere it is shown to visitors (review step, success screen, token pages, deposit page). This is display text only — the app keeps running on devnet underneath, so nothing charges real SOL until you say switch.

## Technical notes

- `src/config/solVault.ts`: `DEFAULT_SOL_VAULT_LAUNCH_FEE` → 1, add `DEFAULT_SOL_VAULT_NETWORK_FEE = 0.05` and a `NETWORK_DISPLAY_LABEL = "Mainnet"` constant.
- `feeService.functions.ts`: `PlatformConfig` gains `networkFeeSol` (env-overridable `SOL_VAULT_NETWORK_FEE`).
- `launchService.ts`: `buildLaunchTransaction` takes `extraSol` (liquidity + buys + sells + network fee) and folds it into the single `SystemProgram.transfer` to the receiving wallet; amounts computed in lamports with rounding.
- `launch.tsx`: new step between Socials and Review; `STEPS` becomes 5 entries; form state gains `liquiditySol`, `simBuySol`, `simSellSol` as strings parsed to numbers with non-negative validation; total memo; balance check via existing `useSolBalance`.
- `tokenService.functions.ts` / `solana.server.ts`: `registerTokenLaunch` accepts the breakdown, and `verifyLaunchTransaction` verifies the on-chain delta into the receiving wallet covers the full expected total (server recomputes the expected sum from the submitted breakdown + its own fee config, rather than trusting the client's total).
- Breakdown persisted as extra `transactions` rows (`LIQUIDITY`, `SIM_BUY`, `SIM_SELL`, `NETWORK_FEE`) linked to the token, so portfolio history shows where the SOL went. No schema change needed.
- Network display: a single exported label used by the UI; `CLIENT_NETWORK` still drives RPC and explorer cluster links.
