# Sol Launchpad

Build Prompt — Sol Vault User MVP

Build the first functional MVP of Sol Vault, a Solana memecoin launchpad with a futuristic space/galaxy aesthetic.

The goal of this phase is to build the basic user-facing functionality only. Keep the architecture modular so more advanced trading, liquidity, analytics, admin controls, and additional platform wallets can be added later.

1. Core Concept

Sol Vault allows users to:

Connect a Solana wallet

Browse recently launched memecoins

Create/launch a token

View token details

See basic market information

Buy/sell tokens where supported

View their wallet/portfolio activity

Pay Sol Vault's platform/launch fee

For now, use this wallet as the Sol Vault receiving wallet for platform fees:

DXVdPZ4SKvtbX7DxRgCB7n9Wh9Te1LrJqfnsSwMs8J9W

Do NOT expose this wallet as a user-editable setting. Store it as a centralized configuration value so it can easily be replaced later.

2. Landing Page

Create a visually impressive landing page.

Hero

Headline:

Launch Your Token Into Orbit.

Subheading:

Create, discover, and trade the next generation of Solana memecoins.

Primary CTA:

🚀 Launch Token

Secondary CTA:

🔭 Explore Tokens

Wallet button:

Connect Wallet

Visual Style

Use:

Deep space background

Black/navy base

Stars

Subtle animated particles

Nebula effects

Neon blue/purple accents

Glassmorphism cards

Soft glowing borders

Futuristic typography

Smooth animations

The website should feel like a premium crypto space station, not a generic dashboard.

3. Wallet Connection

Implement Solana wallet connectivity.

Support:

Phantom

Solflare

Backpack

Other wallets supported by the Solana wallet adapter

When connected, display:

Truncated wallet address

SOL balance

Disconnect option

Example:

DXVd...8J9W

Do not require users to create an account/password.

The wallet should act as the user's primary identity.

4. Explore Tokens

Create an Explore page showing launched tokens.

Each token card should contain:

Token logo

Token name

$TICKER

Short description

Market cap

Liquidity

Volume

Holders

Token age

Creator wallet

Status

Example:

🚀 MoonCat

$MOONCAT

Market Cap: $125K

Liquidity: 42 SOL

Volume: 87 SOL

Holders: 1,284

Status:

🟢 LIVE

Buttons:

View Token

Buy

5. Token Search

Add a search bar at the top of Explore.

Users can search by:

Token name

Ticker

Contract address

Example placeholder:

Search tokens, tickers or contract addresses...

Add basic filters:

Newest

Trending

Highest volume

Highest market cap

Recently launched

6. Launch Token

This is the primary user action.

Create a dedicated Launch Token page.

Use a clean multi-step form.

Step 1 — Token Information

Fields:

Token name

Token symbol

Description

Token image/logo

Example:

Token Name
MoonCat

Symbol
MOONCAT

Description
The cats are going to the moon.

Token Image
[ Upload Image ]


Step 2 — Social Links

Optional:

Website

X/Twitter

Telegram

Discord

Do not require social links.

Step 3 — Token Configuration

Allow the creator to configure:

Total supply

Decimals

Initial launch amount

Creator allocation

Use sensible defaults so a beginner can launch without understanding advanced token mechanics.

Step 4 — Launch Preview

Display a confirmation card:

┌─────────────────────────────┐
│        🌕 MOONCAT           │
│                             │
│  Supply       1,000,000,000 │
│  Decimals               9   │
│  Creator Allocation       0%│
│                             │
│  Launch Fee           X SOL │
└─────────────────────────────┘


Show the exact transaction cost/fee before asking the user to sign.

CTA:

🚀 LAUNCH INTO ORBIT

7. Platform Fee

For the MVP, implement a simple Solana platform fee.

The receiving wallet is:

DXVdPZ4SKvtbX7DxRgCB7n9Wh9Te1LrJqfnsSwMs8J9W

Make the fee configurable through one backend/environment configuration value.

Do NOT hardcode the wallet throughout the frontend.

Use:

SOL_VAULT_RECEIVING_WALLET


as the configuration variable.

The initial value should be:

DXVdPZ4SKvtbX7DxRgCB7n9Wh9Te1LrJqfnsSwMs8J9W

Also create:

SOL_VAULT_LAUNCH_FEE


so the launch fee can be changed later without rewriting application logic.

The frontend should retrieve/display the configured fee.

8. Token Creation Flow

When the user clicks Launch Into Orbit:

Validate the form.

Connect/check wallet.

Display launch fee.

Generate the required Solana transaction(s).

Send the transaction to the user's wallet for approval.

User signs.

Submit transaction to Solana.

Wait for confirmation.

Retrieve the created token/mint address.

Save token metadata.

Create the token's database record.

Display successful launch screen.

Success screen:

🚀 TOKEN LAUNCHED

$MOONCAT is now in orbit.

Display:

Token name

Token symbol

Contract address

Creator wallet

Transaction signature

Buttons:

View Token

Copy Contract

Share

9. Token Detail Page

Every token should have its own route.

Example:

/token/{mintAddress}

Display:

Header

Token logo

MoonCat

$MOONCAT

Contract address with copy button.

Stats

Market Cap
$125K

Liquidity
42 SOL

24h Volume
87 SOL

Holders
1,284


Chart

Add a basic price/market-cap chart.

If live market data isn't available during the initial implementation, build the chart component with a clean data abstraction so a Solana market-data provider can be connected later.

Socials

Show available:

Website

X

Telegram

Discord

Trading

Include:

Buy

Sell

with:

SOL amount

Estimated token amount

Slippage

Price impact

Transaction fee

Confirm button

If trading infrastructure is not implemented yet, build the UI and service abstraction without creating fake transactions.

10. Portfolio

Create:

/portfolio

When the wallet is connected, display:

Wallet

SOL balance

Token Holdings

For each token:

Token logo

Token name

Symbol

Balance

Estimated value

Percentage change

Recent Activity

Show:

Token launches

Buys

Sells

Platform fees

Transaction status

If a wallet isn't connected:

Display:

Connect your wallet to view your portfolio.

11. My Launches

Create a section:

My Launches

Show tokens created by the connected wallet.

Each card:

Token

Market cap

Liquidity

Volume

Holders

Launch date

Contract address

Buttons:

View

Copy Contract

12. Transaction States

Every blockchain action must have clear states.

Before transaction

Preparing launch...

Waiting for wallet

Waiting for wallet approval...

Submitted

Transaction submitted...

Confirming

Confirming on Solana...

Success

🚀 Successfully launched

Failure

Transaction failed

Show a useful error message and allow:

Try Again

Never leave users with an unexplained loading screen.

13. Database Structure

Create the minimum required entities.

Users

id
wallet_address
created_at
updated_at


Tokens

id
mint_address
name
symbol
description
image_url
website_url
twitter_url
telegram_url
discord_url
creator_wallet
total_supply
decimals
status
created_at
updated_at


Transactions

id
wallet_address
token_id
transaction_signature
type
amount
sol_amount
status
created_at


Transaction types:

TOKEN_LAUNCH
BUY
SELL
PLATFORM_FEE


14. Security Requirements

Do not trust frontend data.

Validate all important values on the backend.

Never allow the user to modify:

Sol Vault receiving wallet

Platform fee recipient

Transaction verification

Token ownership records

Verify blockchain transactions before marking actions as successful.

Never mark a token as successfully launched simply because the frontend submitted a transaction.

The backend should verify the transaction on Solana.

15. Navigation

Desktop navigation:

SOL VAULT

Explore
Launch
Portfolio

                  Connect Wallet


Mobile navigation:

Home
Explore
Launch
Portfolio
Wallet


16. Empty States

Design polished empty states.

Example:

No tokens found

The galaxy is quiet...

Try another search.

No portfolio

Your vault is empty.

Launch or discover your first token.

No launches

You haven't launched anything yet.

🚀 Launch Your First Token

17. Responsive Design

The application must work beautifully on:

Desktop

Tablet

Mobile

The launch flow should be particularly optimized for mobile wallet usage.

Avoid tiny buttons, dense tables, and excessive information.

18. Important MVP Constraints

Do NOT build these yet:

Advanced copy trading

Sniper bots

Limit orders

Perpetuals

Leverage

Complex DAO functionality

Staking

Token governance

Referral system

Advanced creator analytics

Multi-chain support

Multiple platform wallets

Complex admin controls

Custom AMM from scratch

Build the foundation correctly first.

19. Architecture

Keep blockchain functionality separated into services.

Example:

/services
    walletService
    tokenService
    transactionService
    marketService
    feeService


The receiving wallet should only exist in configuration:

SOL_VAULT_RECEIVING_WALLET


The launch fee should exist in:

SOL_VAULT_LAUNCH_FEE


This allows the platform to later support:

Multiple receiving wallets

Revenue splitting

Different fees

Creator fees

Trading fees

Referral fees

without rebuilding the application.

20. Definition of Done

The MVP is complete when a user can:

Open Sol Vault → Connect Phantom → Browse tokens → Open a token → Connect wallet → Launch a token → Pay the configured SOL fee → Sign the transaction → Token is created → Token appears in Explore → Token has its own detail page → User can view their launch and portfolio.

Prioritize real functionality over mock data. Blockchain transactions must be real and verifiable on Solana.

If a feature cannot yet be connected to real Solana infrastructure, create a clean service abstraction rather than pretending the transaction succeeded.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://solana-starport.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f089b186-eaa2-43c7-b4db-cebd6aeb8607).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
