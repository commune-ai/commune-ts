/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "@polkadot/api-augment";

import type { ApiPromise } from "@polkadot/api";
import { useQueries, useQuery } from "@tanstack/react-query";

import {
  processVotesAndStakes,
  queryBalance,
  queryDaosEntries,
  queryDaoTreasuryAddress,
  queryLastBlock,
  queryNotDelegatingVotingPower,
  queryProposalsEntries,
  queryRewardAllocation,
  queryStakeFrom,
  queryStakeOut,
  queryUnrewardedProposals,
  queryUserTotalStaked,
} from "@commune-ts/subspace/queries";

import type {
  Api,
  CustomDataError,
  CustomMetadata,
  LastBlock,
  Nullish,
  Result,
  SS58Address,
} from "../types";
import { CUSTOM_METADATA_SCHEMA } from "../types";
import {
  buildIpfsGatewayUrl,
  LAST_BLOCK_STALE_TIME,
  parseIpfsUri,
  PROPOSALS_STALE_TIME,
  STAKE_STALE_TIME,
} from "../utils";

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

export function useUnrewardedProposals(api: Api | Nullish) {
  return useQuery({
    queryKey: ["unrewarded_proposals"],
    enabled: api != null,
    queryFn: () => queryUnrewardedProposals(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useRewardAllocation(api: Api | Nullish) {
  return useQuery({
    queryKey: ["reward_allocation"],
    enabled: api != null,
    queryFn: () => queryRewardAllocation(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == subspaceModule ==

export function useAllStakeOut(api: string) {
  return useQuery({
    queryKey: ["stake_out"],
    enabled: api != null,
    queryFn: () => queryStakeOut(api),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useStakeFrom(api: Api | Nullish) {
  return useQuery({
    queryKey: ["stake_from"],
    enabled: api != null,
    queryFn: () => queryStakeFrom(api!),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useProcessVotesAndStakes(
  api: Api | Nullish,
  votesFor: SS58Address[],
  votesAgainst: SS58Address[],
) {
  return useQuery({
    queryKey: ["process_votes_and_stakes"],
    enabled: api != null,
    queryFn: () => processVotesAndStakes(api!, votesFor, votesAgainst),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useStakeFrom(api: Api | Nullish) {
  return useQuery({
    queryKey: ["stake_from"],
    enabled: api != null,
    queryFn: () => queryStakeFrom(api!),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useProcessVotesAndStakes(
  api: Api | Nullish,
  votesFor: SS58Address[],
  votesAgainst: SS58Address[],
) {
  return useQuery({
    queryKey: ["process_votes_and_stakes"],
    enabled: api != null,
    queryFn: () => processVotesAndStakes(api!, votesFor, votesAgainst),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useUserTotalStaked(
  api: Api | Nullish,
  address: SS58Address | string | Nullish,
) {
  return useQuery({
    queryKey: ["user_total_staked", address],
    enabled: api != null,
    queryFn: () => queryUserTotalStaked(api!, address!),
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
