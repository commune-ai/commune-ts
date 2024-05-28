import type { Codec } from "@polkadot/types/types";
import { CID } from "multiformats/cid";
import { match } from "rustie";
import {
  DAO_SHEMA,
  PROPOSAL_SHEMA,
  type Proposal,
  type DaoApplications,
  type ProposalState,
  type CustomProposalDataState,
  URL_SCHEMA,
  CUSTOM_PROPOSAL_METADATA_SCHEMA,
} from "../types";

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

// == Balances ==

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

// == Governance ==

export function parseDaos(valueRaw: Codec): DaoApplications | null {
  const value = valueRaw.toPrimitive();
  const validated = DAO_SHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data as unknown as DaoApplications;
}

export function parseProposal(valueRaw: Codec): Proposal | null {
  const value = valueRaw.toPrimitive();
  const validated = PROPOSAL_SHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data;
}

export async function handleCustomProposalData(
  proposal: Proposal,
  data: string
): Promise<CustomProposalDataState> {
  const cid = parseIpfsUri(data);
  if (cid === null) {
    const message = `Invalid IPFS URI '${data}' for proposal ${proposal.id}`;
    return { Err: { message } };
  }

  const url = buildIpfsGatewayUrl(cid);
  const response = await fetch(url);
  const obj: unknown = await response.json();

  const validated = CUSTOM_PROPOSAL_METADATA_SCHEMA.safeParse(obj);
  if (!validated.success) {
    const message = `Invalid proposal data for proposal ${proposal.id} at ${url}`;
    return { Err: { message } };
  }

  return { Ok: validated.data };
}

export function handleCustomProposals(
  proposals: Proposal[],
  handler?: (id: number, proposalState: ProposalState) => void
) {
  const promises = [];
  for (const proposal of proposals) {
    const prom = match(proposal.data)({
      async custom(data: string) {
        const metadata = await handleCustomProposalData(proposal, data);

        const proposalState: ProposalState = {
          ...proposal,
          customData: metadata,
        };
        // eslint-disable-next-line eqeqeq
        if (handler != null) handler(proposal.id, proposalState);

        return { id: proposal.id, customData: metadata };
      },
      async subnetCustom({ data }) {
        const metadata = await handleCustomProposalData(proposal, data);

        const proposalState: ProposalState = {
          ...proposal,
          customData: metadata,
        };
        // eslint-disable-next-line eqeqeq
        if (handler != null) handler(proposal.id, proposalState);
        return { id: proposal.id, customData: metadata };
      },
      globalParams() {
        return null;
      },
      subnetParams() {
        return null;
      },
      expired() {
        return null;
      },
    });
    promises.push(prom);
  }
  return Promise.all(promises);
}
