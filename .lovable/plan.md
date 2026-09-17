# Sol Vault — Get It Live

Goal: a working public site with AI-assisted token creation, reliable wallet connection, and all SOL payments going to the Sol Vault address. No liquidity/pool launching in this phase.

## 1. Fix the crash that blocks the live site

The Explore page (and any page that touches Solana code) currently crashes in the browser with "Cannot read properties of undefined". A Solana library needs a browser helper that loads too late. Fix: load that helper at app start-up, before any Solana code runs, so every page renders on the published site.

## 2. AI token suggestions

Add an "AI ideas" helper to step 1 of the launch wizard:
- A prompt box: user types a vibe ("space dog coin, funny").
- Returns 3-5 suggestions, each with name, ticker, and a short description.
- One click fills the form fields; the user can still edit everything.
- Also a "Improve my description" button that rewrites what they typed.
- Runs through the built-in AI (no API key needed), rate-limited per wallet/session, with clear friendly errors if the AI is busy.

## 3. Wallet connection

- Keep Phantom and Solflare, add Backpack plus automatic detection of any other installed Solana wallet.
- Mobile: deep-link support so phone wallets can connect.
- Remember the last wallet and reconnect on return.
- Clear states everywhere: connecting, connected (address + SOL balance), wrong network warning, disconnect.
- A single wallet panel showing balance, address copy, and network.

## 4. Deposits to the Sol Vault address

All SOL flows to `DXVdPZ4SKvtbX7DxRgCB7n9Wh9Te1LrJqfnsSwMs8J9W`.
- The launch fee is already charged to this address when the user signs; keep that as the only fee path.
- Add a dedicated Deposit page/panel: QR code + address + copy button, and a "Send from connected wallet" box where the user enters a SOL amount and signs a transfer straight to the Sol Vault address.
- Every deposit is verified on-chain server-side and recorded (wallet, amount, signature, time) so it shows in the user's history with an explorer link.
- Deposits are a balance record only for now; spending/trading comes later.

## 5. Before going live

- Resolve the flagged security issue on uploaded logo files so uploads are properly protected.
- Confirm each page has correct titles and previews, empty states, and works on mobile.
- Decide devnet vs mainnet before publishing (currently devnet).
- Publish and check every page on the live URL.

## Not in this phase

Liquidity pools, trading, charts, market data, admin controls, multiple platform wallets — these come after the above works.

## Technical notes

- Buffer polyfill moved to the client entry / Vite define so `bs58`/`@solana/web3.js` evaluate safely; verified on the production build, not just dev.
- AI suggestions via a `createServerFn` calling the Lovable AI gateway (google/gemini-2.5-flash), zod-validated JSON output, handler-only env reads.
- Wallet list extended with Backpack + Wallet Standard auto-detect; the existing SSR stub for the mobile adapter stays.
- New `deposits` table (wallet, lamports, signature unique, status, created_at) with GRANTs, RLS public-read of own rows, service-role writes; a server function fetches the tx by signature, verifies destination == Sol Vault address and amount, then inserts.
- Storage finding: keep the `token-images` bucket private and serve via signed URLs generated server-side.
