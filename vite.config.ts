// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// rpc-websockets (a @solana/web3.js dependency) exposes only "browser" and
// "node" export conditions, and its "browser" entry is not reachable through
// its exports map, so alias it to the real file.
const rpcWebsocketsBrowser = fileURLToPath(
  new URL("./node_modules/rpc-websockets/dist/index.browser.mjs", import.meta.url),
);

// The Solana SDK publishes only "browser" and "node" export conditions. The
// Cloudflare/workerd server build matches neither, so let those environments
// fall back to the browser entry points.
const workerConditions = [
  "workerd",
  "worker",
  "browser",
  "module",
  "production",
  "import",
  "default",
];

// @solana-mobile/wallet-adapter-mobile runs Node-only prototype wiring at
// import time and crashes the worker at runtime. Mobile wallet support is
// browser-only, so server builds get a harmless stub instead.
const solanaMobileSsrStub = fileURLToPath(
  new URL("./src/lib/solana-mobile-ssr-stub.ts", import.meta.url),
);

// Solana libraries read `Buffer`/`global` while their modules are still
// evaluating. Import order across route chunks isn't guaranteed, so every
// Solana-touching client module gets the polyfill injected ahead of its own
// code — this is what kept the published build from hydrating.
const bufferPolyfill = fileURLToPath(
  new URL("./src/lib/buffer-polyfill.ts", import.meta.url),
);

const bufferPolyfillPlugin = {
  name: "inject-buffer-polyfill",
  enforce: "pre" as const,
  applyToEnvironment: (env: { name: string }) => env.name === "client",
  transform(code: string, id: string) {
    const clean = id.split("?")[0] ?? id;
    if (clean === bufferPolyfill) return null;
    if (!/(@solana|bs58|rpc-websockets|buffer-layout|borsh)/.test(clean)) return null;
    return { code: `import ${JSON.stringify(bufferPolyfill)};\n${code}`, map: null };
  },
};

const solanaMobileServerStubPlugin = {
  name: "solana-mobile-server-stub",
  enforce: "pre" as const,
  applyToEnvironment: (env: { name: string }) => env.name !== "client",
  resolveId(source: string) {
    if (source === "@solana-mobile/wallet-adapter-mobile") return solanaMobileSsrStub;
    return null;
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [bufferPolyfillPlugin, solanaMobileServerStubPlugin],
    environments: {
      nitro: { resolve: { conditions: workerConditions } },
      ssr: { resolve: { conditions: workerConditions } },
    },
    resolve: {
      alias: [
        { find: /^rpc-websockets$/, replacement: rpcWebsocketsBrowser },
        {
          find: /^rpc-websockets\/dist\/lib\/client\/websocket\.js$/,
          replacement: rpcWebsocketsBrowser,
        },
      ],
    },
  },
});
