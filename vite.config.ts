// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// rpc-websockets (pulled in by @solana/web3.js) only declares "browser" and
// "node" export conditions, so neither the browser nor the Cloudflare/workerd
// build can resolve it through its exports map. Alias it to the real file.
const rpcWebsocketsBrowser = fileURLToPath(
  new URL("./node_modules/rpc-websockets/dist/index.browser.mjs", import.meta.url),
);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Most @solana/* packages only publish "browser" and "node" export
    // conditions. The Cloudflare/workerd server build matches neither, so allow
    // it to fall back to the browser entry points.
    ssr: {
      resolve: {
        conditions: ["workerd", "worker", "browser", "module", "import", "default"],
        externalConditions: ["workerd", "worker", "browser", "module", "import", "default"],
      },
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



