/**
 * Solana libraries (bs58, @solana/buffer-layout, web3.js) touch `Buffer` and
 * `global` while their modules are still evaluating. Importing this module
 * FIRST — before any Solana import — guarantees both exist in the browser.
 */
import { Buffer } from "buffer";

const g = globalThis as unknown as { Buffer?: typeof Buffer; global?: unknown };

if (typeof g.Buffer === "undefined") g.Buffer = Buffer;
if (typeof g.global === "undefined") g.global = globalThis;

export {};
