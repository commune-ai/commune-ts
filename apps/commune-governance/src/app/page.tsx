"use client";

import { useState } from "react";

import type { ProposalStatus, SS58Address } from "@commune-ts/providers/types";
import { useCommune } from "@commune-ts/providers/use-commune";

import type { Vote } from "./components/vote-label";
import { BalanceSection } from "./components/balance-section";
import { CardSkeleton } from "./components/card-skeleton";
import { Container } from "./components/container";
import { DaoCard } from "./components/dao-card";
import { ProposalCard } from "./components/proposal-card";
import { ProposalListHeader } from "./components/proposal-list-header";

export default function HomePage(): JSX.Element {
  const {
    proposalsWithMeta,
    isProposalsLoading,
    daosWithMeta,
    isDaosLoading,
    selectedAccount,
  } = useCommune();

  const [viewMode, setViewMode] = useState<"proposals" | "daos">("proposals");

  function handleIsLoading(type: "proposals" | "daos"): boolean {
    switch (type) {
      case "daos":
        return isDaosLoading;
      case "proposals":
        return isProposalsLoading;
      default:
        return false;
    }
  }

  const isLoading = handleIsLoading(viewMode);

  const handleUserVotes = ({
    proposalStatus,
    selectedAccountAddress,
  }: {
    proposalStatus: ProposalStatus;
    selectedAccountAddress: SS58Address;
  }): Vote => {
    if (!Object.prototype.hasOwnProperty.call(proposalStatus, "open"))
      return "UNVOTED";

    if (
      "open" in proposalStatus &&
      proposalStatus.open.votesFor.includes(selectedAccountAddress)
    ) {
      return "FAVORABLE";
    }
    if (
      "open" in proposalStatus &&
      proposalStatus.open.votesAgainst.includes(selectedAccountAddress)
    ) {
      return "AGAINST";
    }

    return "UNVOTED";
  };

  function renderProposals(): JSX.Element[] | undefined {
    const proposalsContent = proposalsWithMeta?.map((proposal) => {
      const voted = handleUserVotes({
        proposalStatus: proposal.status,
        selectedAccountAddress: selectedAccount?.address as SS58Address,
      });

      return (
        <div className="animate-fade-in-down" key={proposal.id}>
          <ProposalCard
            key={proposal.id}
            proposalState={proposal}
            voted={voted}
          />
        </div>
      );
    });
    return proposalsContent;
  }

  function renderDaos(): JSX.Element[] | undefined {
    const daosContent = daosWithMeta?.map((dao) => {
      return (
        <div key={dao.id}>
          <DaoCard daoState={dao} key={dao.id} />
        </div>
      );
    });

    return daosContent;
  }

  const content = viewMode === "proposals" ? renderProposals() : renderDaos();

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <div className="h-full w-full bg-repeat">
        <Container>
          <BalanceSection className="hidden lg:flex" />

          <ProposalListHeader setViewMode={setViewMode} viewMode={viewMode} />

          <div className="mx-auto max-w-screen-2xl space-y-10 px-4 py-8">
            {isLoading ? <CardSkeleton /> : content}
          </div>
        </Container>
      </div>
    </main>
  );
}
