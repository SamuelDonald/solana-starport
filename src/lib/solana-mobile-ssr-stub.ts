// SSR/worker stub for @solana-mobile/wallet-adapter-mobile.
// The real package initialises Node-style prototypes at import time and crashes
// the Cloudflare worker. Mobile wallet support is browser-only anyway, so the
// server build resolves this file instead.

export const SolanaMobileWalletAdapterWalletName = "Mobile Wallet Adapter" as const;

export class SolanaMobileWalletAdapter {
  constructor(..._args: unknown[]) {
    throw new Error("SolanaMobileWalletAdapter is not available on the server");
  }
}

export function createDefaultAddressSelector() {
  return {
    select: async (addresses: string[]) => addresses[0]!,
  };
}

export function createDefaultAuthorizationResultCache() {
  return {
    clear: async () => {},
    get: async () => undefined,
    set: async () => {},
  };
}

export function createDefaultWalletNotFoundHandler() {
  return async () => {};
}

export default {};
