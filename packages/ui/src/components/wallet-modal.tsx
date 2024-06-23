"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/16/solid";

import type { InjectedAccountWithMeta } from "../types";

export function WalletModal({
  open,
  wallets,
  setOpen,
  handleWalletSelections,
}: {
  open: boolean;
  setOpen: (args: boolean) => void;
  wallets: InjectedAccountWithMeta[];
  handleWalletSelections: (arg: InjectedAccountWithMeta) => void;
}): JSX.Element {
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>();

  return (
    <div
      className={`animate-fade-in fixed inset-0 z-[100] w-fit ${open ? "block" : "hidden"}`}
      role="dialog"
    >
      {/* Modal */}∂
      <div className="fixed right-0 top-16 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="relative w-full max-w-3xl transform overflow-hidden border bg-black/70 text-left text-white backdrop-blur-sm">
            {/* Modal Header */}
            <div className="flex flex-row items-center justify-between gap-3 border-b p-6">
              <div className="flex flex-col items-center md:flex-row">
                <Image
                  alt="Module Logo"
                  height={32}
                  src="/logo.svg"
                  width={32}
                />
                <h3 className="pl-2 text-xl font-light leading-6">
                  Select Wallet
                </h3>
              </div>
              <button
                className="border p-2 transition duration-200"
                onClick={() => {
                  setOpen(false);
                }}
                type="button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-y-4 overflow-y-auto p-6">
              {wallets.map((item) => (
                <button
                  className={`text-md flex cursor-pointer items-center gap-x-3 overflow-auto border p-5 ${selectedAccount === item ? "border-green-500" : "border-white"}`}
                  key={item.address}
                  onClick={() => {
                    setSelectedAccount(item);
                  }}
                  type="button"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold">{item.meta.name}</span>
                    <p>{item.address}</p>
                  </div>
                </button>
              ))}
              {!wallets.length && (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-sm text-gray-300">
                  <div className="flex flex-col gap-2">
                    <p>
                      <b className="text-red-500">No wallet found</b>. Please
                      install a Wallet extension or check permission settings.
                    </p>
                  </div>
                  <p>
                    If you don&apos;t have a wallet, we recommend one of these:
                  </p>
                  <div className="flex gap-3">
                    <Link
                      className="text-blue-600"
                      href="https://subwallet.app/"
                      rel="noreferrer"
                      target="_blank"
                    >
                      SubWallet
                    </Link>
                    <Link
                      className="text-blue-600"
                      href="https://polkadot.js.org/extension/"
                      rel="noreferrer"
                      target="_blank"
                    >
                      Polkadot JS
                    </Link>
                  </div>
                </div>
              )}
              <button
                className={`w-full border p-4 text-xl font-semibold ${selectedAccount ? "border-green-500 text-green-500" : "border-gray-500 text-gray-300"} transition hover:bg-white/5`}
                disabled={!selectedAccount}
                onClick={() => {
                  if (!selectedAccount) {
                    return;
                  }
                  handleWalletSelections(selectedAccount);
                }}
                type="button"
              >
                Connect Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
