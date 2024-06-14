"use client";

import { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import type { TransactionResult } from "@repo/providers/src/types";
import { useCommune } from "@repo/providers/src/context/polkadot";
import { WalletButtonWithHook } from "@repo/providers";
import type { Vote } from "./vote-label";
import { Card } from "./card";

export function VoteCard(props: {
  proposalId: number;
  voted: Vote;
}): JSX.Element {
  const { proposalId, voted = "UNVOTED" } = props;
  const { isConnected, voteProposal } = useCommune();

  const [vote, setVote] = useState("UNVOTED");
  const [votingStatus, setVotingStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  function handleVotePreference(value: Vote): void {
    if (vote === "UNVOTED" || vote !== value) {
      setVote(value);
      return;
    }
    if (vote === value) {
      setVote("UNVOTED");
    }
  }

  function handleCallback(callbackReturn: TransactionResult): void {
    setVotingStatus(callbackReturn);
  }

  function handleVote(): void {
    void voteProposal({ proposalId, vote, callback: handleCallback });
  }

  if (voted !== "UNVOTED") {
    return (
      <Card.Root>
        <Card.Header>
          <h3 className="text-base font-semibold">Cast your vote</h3>
        </Card.Header>
        <Card.Body className="flex w-full flex-col space-y-4 p-6">
          <span>You already voted!</span>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root className="border-none bg-transparent">
      <Card.Body className="flex w-full flex-col space-y-4 border-b border-gray-500 p-6">
        <h3 className="text-base font-semibold">Cast your vote</h3>
        {isConnected ? (
          <div className="flex w-full gap-4">
            <button
              className={`w-full border border-green-600 py-1 ${vote === "FAVORABLE" ? "border-green-500 bg-green-500/20 text-green-500" : "text-green-600"} ${votingStatus.status === "PENDING" && "cursor-not-allowed"}`}
              disabled={votingStatus.status === "PENDING"}
              onClick={() => {
                handleVotePreference("FAVORABLE");
              }}
              type="button"
            >
              Favorable
            </button>
            <button
              className={`w-full border border-red-600 py-1 ${vote === "AGAINST" ? "border-red-500 bg-red-500/20 text-red-500" : "text-red-500"} ${votingStatus.status === "PENDING" && "cursor-not-allowed"}`}
              disabled={votingStatus.status === "PENDING"}
              onClick={() => {
                handleVotePreference("AGAINST");
              }}
              type="button"
            >
              Against
            </button>
          </div>
        ) : null}

        {!isConnected && <WalletButtonWithHook />}

        {isConnected ? (
          <button
            className={`w-full border p-1.5 ${vote === "UNVOTED" || votingStatus.status === "PENDING" ? "cursor-not-allowed border-gray-400 text-gray-400" : "border-blue-400 bg-blue-400/20 text-blue-400"} `}
            disabled={vote === "UNVOTED" || votingStatus.status === "PENDING"}
            onClick={handleVote}
            type="button"
          >
            {vote === "UNVOTED" && "Chose Before Voting"}
            {vote !== "UNVOTED" && "Vote"}
          </button>
        ) : null}

        {votingStatus.status ? (
          <p
            className={`${votingStatus.status === "PENDING" && "text-yellow-300"} ${votingStatus.status === "ERROR" && "text-red-300"} ${votingStatus.status === "SUCCESS" && "text-green-300"} flex text-left text-base`}
          >
            {votingStatus.message}
            {votingStatus.status === "PENDING" && (
              <ArrowPathIcon className="ml-2 animate-spin" width={16} />
            )}
          </p>
        ) : null}
      </Card.Body>
    </Card.Root>
  );
}
