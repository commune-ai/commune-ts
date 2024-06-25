"use client";

import Image from "next/image";

import type { InjectedAccountWithMeta } from "../types";
import { cn } from "..";

interface PolkadotHook {
  handleConnect: () => void;
  isInitialized: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
}

interface WalletButtonProps {
  hook: PolkadotHook;
}

export function WalletButton({ hook }: WalletButtonProps): JSX.Element {
  const { handleConnect, isInitialized, selectedAccount } = hook;

  if (!isInitialized) {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center gap-3 border border-gray-500 px-4 py-2 text-gray-400 hover:border-green-600 hover:bg-green-600/5 hover:text-green-600 active:top-1",
        )}
      >
        <Image
          alt="Wallet Icon"
          className={cn("w-6")}
          height={40}
          src="/wallet-icon.svg"
          width={40}
        />
        <span>Loading Wallet Info...</span>
      </div>
    );
  }

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-3 border border-gray-500 px-4 py-2 text-gray-400 hover:border-green-600 hover:bg-green-600/5 hover:text-green-600",
        {
          "border-green-500 bg-green-500/5 text-green-500": selectedAccount,
        },
      )}
      disabled={!isInitialized}
      onClick={handleConnect}
      type="button"
    >
      <span className={cn("flex items-center gap-3 font-medium")}>
        <Image
          alt="Wallet Icon"
          className={cn("w-6")}
          height={40}
          src="/wallet-icon.svg"
          width={40}
        />
        {selectedAccount?.meta.name ? (
          <div className={cn("flex flex-col items-start")}>
            <span className={cn("font-light")}>
              {selectedAccount.address.slice(0, 8)}…
              {selectedAccount.address.slice(-8)}
            </span>
          </div>
        ) : (
          <span className={cn("text-white")}>Connect Wallet</span>
        )}
      </span>
    </button>
  );
}
