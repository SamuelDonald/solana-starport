import { useWallet } from "@solana/wallet-adapter-react";
import { Copy, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truncateAddress, useSolBalance } from "@/services/walletService";

export function WalletButton({ full = false }: { full?: boolean }) {
  const { wallets, select, connect, connected, connecting, publicKey, disconnect } =
    useWallet();
  const { data: balance } = useSolBalance();

  if (connected && publicKey) {
    const address = publicKey.toBase58();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={full ? "w-full" : ""}>
            <span className="mr-2 inline-block size-2 rounded-full bg-success live-dot" />
            <span className="font-mono text-xs">{truncateAddress(address)}</span>
            <span className="ml-3 hidden text-xs text-muted-foreground sm:inline">
              {balance !== undefined ? `${balance.toFixed(3)} SOL` : "…"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-mono text-xs break-all">
            {address}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void navigator.clipboard.writeText(address);
              toast.success("Wallet address copied");
            }}
          >
            <Copy className="size-4" /> Copy address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void disconnect()}>
            <LogOut className="size-4" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const installed = wallets.filter((w) => w.readyState === "Installed");
  const others = wallets.filter((w) => w.readyState !== "Installed");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className={full ? "w-full" : ""} disabled={connecting}>
          <Wallet className="size-4" />
          {connecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Connect a Solana wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {installed.map((w) => (
          <DropdownMenuItem
            key={w.adapter.name}
            onClick={async () => {
              select(w.adapter.name);
              try {
                await connect();
              } catch {
                /* adapter surfaces its own error */
              }
            }}
          >
            <img src={w.adapter.icon} alt="" className="size-4 rounded" />
            {w.adapter.name}
          </DropdownMenuItem>
        ))}
        {installed.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            No wallet detected. Install Phantom, Solflare or Backpack to continue.
          </div>
        ) : null}
        {others.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Not installed
            </DropdownMenuLabel>
            {others.map((w) => (
              <DropdownMenuItem
                key={w.adapter.name}
                onClick={() => window.open(w.adapter.url, "_blank", "noopener")}
              >
                <img src={w.adapter.icon} alt="" className="size-4 rounded opacity-60" />
                {w.adapter.name}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
