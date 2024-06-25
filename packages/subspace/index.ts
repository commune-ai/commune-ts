import "@polkadot/api-augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

console.log("Hello from Subspace!");

// == Start API ==

const wsProvider = new WsProvider(
  "wss://testnet-commune-api-node-1.communeai.net",
);
const api = await ApiPromise.create({ provider: wsProvider });

if (!api.isConnected) {
  throw new Error("API not connected");
}

console.log("API connected");
