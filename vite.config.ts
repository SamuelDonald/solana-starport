// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * The Solana SDK (and rpc-websockets) publish only "browser" and "node" export
 * conditions. The Cloudflare/workerd server build matches neither, so module
 * resolution fails at build time. Map each of those packages straight to its
 * browser ESM entry, which is Worker-compatible.
 */
function browserOnlyAliases() {
  const aliases: { find: RegExp; replacement: string }[] = [];
  const candidates: string[] = ["rpc-websockets"];

  const scopeDir = join(rootDir, "node_modules", "@solana");
  if (existsSync(scopeDir)) {
    for (const name of readdirSync(scopeDir)) candidates.push(`@solana/${name}`);
  }

  for (const pkg of candidates) {
    const pkgDir = join(rootDir, "node_modules", pkg);
    const manifestPath = join(pkgDir, "package.json");
    if (!existsSync(manifestPath)) continue;

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      exports?: Record<string, unknown>;
    };
    const exportsField = manifest.exports;
    if (!exportsField || typeof exportsField !== "object") continue;
    if (exportsField["."] || exportsField["default"]) continue;

    const browser = exportsField["browser"] as { import?: string } | undefined;
    const entry = browser?.import;
    if (!entry) continue;

    const resolved = join(pkgDir, entry);
    if (!existsSync(resolved)) continue;

    aliases.push({
      find: new RegExp(`^${pkg.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}$`),
      replacement: resolved,
    });
  }

  return aliases;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: browserOnlyAliases(),
    },
  },
});
