import { Link } from "@tanstack/react-router";

import { tokenAge } from "@/services/marketService";
import type { TokenRow } from "@/services/tokenService";
import { truncateAddress } from "@/services/walletService";

export function TokenAvatar({
  token,
  size = "size-12",
}: {
  token: Pick<TokenRow, "image_url" | "symbol">;
  size?: string;
}) {
  if (token.image_url) {
    return (
      <img
        src={token.image_url}
        alt={`${token.symbol} logo`}
        loading="lazy"
        className={`${size} shrink-0 rounded-xl object-cover ring-1 ring-border/70`}
      />
    );
  }
  return (
    <div
      className={`${size} grid shrink-0 place-items-center rounded-xl bg-primary/20 font-display text-sm text-accent ring-1 ring-primary/40`}
    >
      {token.symbol.slice(0, 3)}
    </div>
  );
}

export function TokenCard({ token }: { token: TokenRow }) {
  return (
    <Link
      to="/token/$mint"
      params={{ mint: token.mint_address }}
      className="glass glass-hover rise-in group flex flex-col gap-4 rounded-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <TokenAvatar token={token} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-sm tracking-wide text-foreground">
              {token.name}
            </h3>
            <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
              {token.symbol}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {truncateAddress(token.mint_address, 6)}
          </p>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {tokenAge(token.created_at)}
        </span>
      </div>

      {token.description ? (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {token.description}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
        <span>
          Supply{" "}
          <span className="text-foreground">
            {Number(token.total_supply).toLocaleString()}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-success">
          <span className="live-dot inline-block size-1.5 rounded-full bg-success" />
          {token.status}
        </span>
      </div>
    </Link>
  );
}
