import { AlertCircle, LogOut, Wallet } from "lucide-react";
import { useWallet } from "@/context/WalletContext";

function shortAddress(value) {
  if (!value) {
    return "";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function ConnectWalletButton() {
  const {
    address,
    chainId,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={connectWallet}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {error ? (
          <p className="inline-flex items-center gap-1 text-xs text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-right">
        <p className="text-xs font-medium text-white">{shortAddress(address)}</p>
        <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">{chainId || "unknown chain"}</p>
      </div>
      <button
        type="button"
        onClick={disconnectWallet}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
        aria-label="Disconnect wallet"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
