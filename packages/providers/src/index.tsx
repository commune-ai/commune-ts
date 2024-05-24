import "./globals.css";
import "@repo/ui/styles.css";

import type { ReactNode } from "react";
import { ToastProvider } from "./context/toast";
import { PolkadotProvider } from "./context/polkadot";
import { WalletButton } from "./components/wallet-button";

function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ToastProvider>
      <PolkadotProvider
        wsEndpoint={String(process.env.NEXT_PUBLIC_WS_ENDPOINT)}
      >
        {children}
      </PolkadotProvider>
    </ToastProvider>
  );
}

export { Providers, WalletButton };
