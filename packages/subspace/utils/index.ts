import {
  Codec,
  Entry,
  Proposal,
  RawEntry,
  URL_SCHEMA,
  parseDaos,
  parseProposal,
  DaoApplications,
} from "../types";
import { CID } from "multiformats/cid";

// == Calc ==

export function bigintDivision(a: bigint, b: bigint, precision = 8n): number {
  if (b === 0n) return NaN;
  const base = 10n ** precision;
  const baseNum = Number(base);
  return Number((a * base) / b) / baseNum;
}

export function fromNano(nano: number | bigint): number {
  if (typeof nano === "bigint") return bigintDivision(nano, 1_000_000_000n);
  return nano / 1_000_000_000;
}

export function formatToken(nano: number | bigint): string {
  const amount = fromNano(nano);
  return amount.toFixed(2);
}

export function calculateAmount(amount: string): number {
  return Math.floor(Number(amount) * 10 ** 9);
}

export function smallAddress(address: string): string {
  return `${address.slice(0, 8)}…${address.slice(-8)}`;
}

// == IPFS ==

export function parseIpfsUri(uri: string): CID | null {
  const validated = URL_SCHEMA.safeParse(uri);
  if (!validated.success) {
    return null;
  }
  const ipfsPrefix = "ipfs://";
  const rest = uri.startsWith(ipfsPrefix) ? uri.slice(ipfsPrefix.length) : uri;
  try {
    const cid = CID.parse(rest);
    return cid;
  } catch (e) {
    return null;
  }
}

export function buildIpfsGatewayUrl(cid: CID): string {
  const cidStr = cid.toString();
  return `https://ipfs.io/ipfs/${cidStr}`;
}

// == Handlers ==

export function handleEntries<T>(
  rawEntries: RawEntry,
  parser: (value: Codec) => T | null,
): [T[], Error[]] {
  const entries: T[] = [];
  const errors: Error[] = [];
  for (const entry of rawEntries ?? []) {
    const [, valueRaw] = entry;
    const parsedEntry = parser(valueRaw);
    if (parsedEntry == null) {
      errors.push(new Error(`Invalid entry: ${entry.toString()}`));
      continue;
    }
    entries.push(parsedEntry);
  }
  entries.reverse();
  return [entries, errors];
}

export function handleProposals(
  rawProposals: Entry<Codec>[] | undefined,
): [Proposal[], Error[]] {
  return handleEntries(rawProposals, parseProposal);
}

export function handleDaos(
  rawDaos: Entry<Codec>[] | undefined,
): [DaoApplications[], Error[]] {
  return handleEntries(rawDaos, parseDaos);
}
