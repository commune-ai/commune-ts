/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "@polkadot/api-augment";
import type { ApiPromise } from "@polkadot/api";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  queryBalance,
  queryDaoTreasuryAddress,
  queryDaosEntries,
  queryLastBlock,
  queryNotDelegatingVotingPower,
  queryProposalsEntries,
  queryStakeOut,
} from "@repo/commune-ts/queries";
import { buildIpfsGatewayUrl, parseIpfsUri } from "../utils";
import {
  type Api,
  type Nullish,
  type LastBlock,
  type Result,
  type SS58Address,
  type CustomMetadata,
  type CustomDataError,
  PROPOSALS_STALE_TIME,
  LAST_BLOCK_STALE_TIME,
  CUSTOM_METADATA_SCHEMA,
  STAKE_STALE_TIME,
} from "../types";

// == chain ==

export function useLastBlock(api: ApiPromise | Nullish) {
  return useQuery({
    queryKey: ["last_block"],
    enabled: api != null,
    queryFn: () => queryLastBlock(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == system ==

export function useBalance(
  api: Api | Nullish,
  address: SS58Address | string | Nullish,
) {
  return useQuery({
    queryKey: ["balance", address],
    enabled: api != null && address !== null,
    queryFn: () => queryBalance(api!, address!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == governanceModule ==

export function useProposals(api: Api | Nullish) {
  return useQuery({
    queryKey: ["proposals"],
    enabled: api != null,
    queryFn: () => queryProposalsEntries(api!),
    staleTime: PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useDaos(api: Api | Nullish) {
  return useQuery({
    queryKey: ["daos"],
    enabled: api != null,
    queryFn: () => queryDaosEntries(api!),
    staleTime: PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useDaoTreasury(api: Api | Nullish) {
  return useQuery({
    queryKey: ["dao_treasury"],
    enabled: api != null,
    queryFn: () => queryDaoTreasuryAddress(api!),
    staleTime: PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useNotDelegatingVoting(api: Api | Nullish) {
  return useQuery({
    queryKey: ["not_delegating_voting_power"],
    enabled: api != null,
    queryFn: () => queryNotDelegatingVotingPower(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == subspaceModule ==

export function useAllStakeOut(api: Api | Nullish) {
  return useQuery({
    queryKey: ["stake_out"],
    enabled: api != null,
    queryFn: () => queryStakeOut(api!),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == Custom metadata ==

interface BaseProposal {
  id: number;
  metadata: string;
}

interface BaseDao {
  id: number;
  data: string;
}

export async function fetchCustomMetadata(
  kind: "proposal" | "dao",
  entryId: number,
  metadataField: string,
): Promise<Result<CustomMetadata, CustomDataError>> {
  const cid = parseIpfsUri(metadataField);
  if (cid == null) {
    const message = `Invalid IPFS URI '${metadataField}' for ${kind} ${entryId}`;
    return { Err: { message } };
  }

  const url = buildIpfsGatewayUrl(cid);
  const response = await fetch(url);
  const obj: unknown = await response.json();

  const schema = CUSTOM_METADATA_SCHEMA;
  const validated = schema.safeParse(obj);

  if (!validated.success) {
    const message = `Invalid metadata for ${kind} ${entryId} at ${url}`;
    return { Err: { message } };
  }

  return { Ok: validated.data };
}

export function useCustomMetadata<T extends BaseProposal | BaseDao>(
  kind: "proposal" | "dao",
  lastBlock: LastBlock | Nullish,
  items: T[] | undefined,
) {
  type Output = Awaited<ReturnType<typeof fetchCustomMetadata>>;
  const blockNumber = lastBlock?.blockNumber;

  const queries = (items ?? []).map((item) => {
    const id = item.id;
    const metadataField = "metadata" in item ? item.metadata : item.data;
    return {
      queryKey: [{ blockNumber }, "metadata", { kind, id }],
      queryFn: async (): Promise<[number, Output]> => {
        const data = await fetchCustomMetadata(kind, id, metadataField);
        return [id, data];
      },
      refetchOnWindowFocus: false,
    };
  });

  return useQueries({
    queries,
    combine: (results) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      type ListItem<L> = L extends (infer T)[] ? T : never;
      const outputs = new Map<number, ListItem<typeof results>>();
      results.forEach((result) => {
        const { data } = result;
        if (data != null) {
          const [id] = data;
          outputs.set(id, result);
        } else {
          // eslint-disable-next-line no-console
          console.info(`Missing result for ${kind} metadata query`);
        }
      });
      return outputs;
    },
  });
}
