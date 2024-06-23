"use client";

import { WalletButton } from "@commune-ts/ui/wallet-button";

import { useCommune } from "../context/commune";

export function WalletButtonWithHook(): JSX.Element {
  const context = useCommune();
  return <WalletButton hook={context} />;
}
