import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { z } from "zod";
import type { TransactionResult } from "@repo/providers/src/types";
import { useCommune } from "@repo/providers/src/context/polkadot";
import { Loading } from "@repo/ui/loading";
import { cairo } from "@repo/ui/fonts";
import { toast } from "@repo/providers/src/context/toast";

const proposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function CreateProposal(): JSX.Element {
  const router = useRouter();
  const { isConnected, addCustomProposal, balance } = useCommune();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [uploading, setUploading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  function toggleModalMenu(): void {
    setModalOpen(!modalOpen);
  }

  const [editMode, setEditMode] = useState(true);
  function toggleEditMode(): void {
    setEditMode(!editMode);
  }

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  function handleCallback(callbackReturn: TransactionResult): void {
    setTransactionStatus(callbackReturn);
  }

  async function uploadFile(fileToUpload: File): Promise<void> {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const ipfs = (await res.json()) as { IpfsHash: string };
      setUploading(false);

      if (!balance) {
        toast.error("Balance is still loading");
        return;
      }

      const proposalCost = 10000;

      if (Number(balance) > proposalCost) {
        void addCustomProposal({
          IpfsHash: `ipfs://${ipfs.IpfsHash}`,
          callback: handleCallback,
        });
      } else {
        toast.error(
          `Insufficient balance to create proposal. Required: ${proposalCost} but got ${balance}`,
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Insufficient balance",
        });
      }
      router.refresh();
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading proposal");
    }
  }

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting proposal creation...",
    });

    const result = proposalSchema.safeParse({
      title,
      body,
    });

    if (!result.success) {
      toast.error(result.error.errors.map((e) => e.message).join(", "));
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error on form validation",
      });
      return;
    }

    const proposalData = JSON.stringify({
      title,
      body,
    });
    const blob = new Blob([proposalData], { type: "application/json" });
    const fileToUpload = new File([blob], "proposal.json", {
      type: "application/json",
    });
    void uploadFile(fileToUpload);
  }

  return (
    <>
      <button
        className="min-w-auto w-full border border-gray-500 px-4 py-2 text-gray-400 hover:border-green-600 hover:bg-green-600/5 hover:text-green-600 lg:w-auto"
        onClick={toggleModalMenu}
        type="button"
      >
        Create New Proposal
      </button>
      <div
        className={`relative z-50 ${modalOpen ? "visible" : "hidden"} -mr-2`}
        role="dialog"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" />

        {/* Modal */}
        <div className="animate-fade-in-down fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative w-[100%] max-w-screen-2xl transform overflow-hidden border border-gray-500 bg-white bg-[url('/bg-pattern.svg')] text-left text-white md:w-[80%]">
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-3 border-b border-gray-500 bg-cover bg-center bg-no-repeat p-6 md:flex-row">
                <div className="flex flex-col items-center md:flex-row">
                  <h3
                    className="pl-2 text-xl font-bold leading-6"
                    id="modal-title"
                  >
                    Build Custom Global Proposal
                  </h3>
                </div>

                <button
                  className="p-2 transition duration-200"
                  onClick={toggleModalMenu}
                  type="button"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              {/* Modal Body */}
              <form onSubmit={HandleSubmit}>
                <div className="flex flex-col gap-4 p-6">
                  <div className="flex gap-2">
                    <button
                      className={`border px-4 py-1 ${editMode ? "border-green-500 bg-green-500/5 text-green-500" : "border-gray-500 text-gray-400"} hover:border-green-600 hover:bg-green-600/5 hover:text-green-600`}
                      onClick={toggleEditMode}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className={`border px-4 py-1 ${!editMode ? "border-green-500 bg-green-500/5 text-green-500" : "border-gray-500 text-gray-400"} hover:border-green-600 hover:bg-green-600/5 hover:text-green-600`}
                      onClick={toggleEditMode}
                      type="button"
                    >
                      Preview
                    </button>
                  </div>
                  <div className="flex flex-col">
                    {editMode ? (
                      <div className="flex flex-col gap-3">
                        <input
                          className="w-full bg-black p-3 text-white"
                          onChange={(e) => {
                            setTitle(e.target.value);
                          }}
                          placeholder="Your proposal title here..."
                          type="text"
                          value={title}
                        />
                        <textarea
                          className="w-full bg-black p-3 text-white"
                          onChange={(e) => {
                            setBody(e.target.value);
                          }}
                          placeholder="Your proposal here... (Markdown supported)"
                          rows={5}
                          value={body}
                        />
                      </div>
                    ) : (
                      <div className="p-4 py-10">
                        {body ? (
                          <MarkdownPreview
                            className={`line-clamp-4 ${cairo.className}`}
                            source={`# ${title}\n${body}`}
                            style={{
                              backgroundColor: "transparent",
                              color: "white",
                            }}
                          />
                        ) : null}
                        {/* TODO: skeleton for markdown body */}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      className={`relative w-full border px-4 py-2 font-semibold ${isConnected ? "border-green-500 text-green-500 hover:bg-green-500/5 active:top-1" : "border-gray-500 text-gray-500"}`}
                      disabled={!isConnected}
                      type="submit"
                    >
                      {uploading ? "Uploading..." : "Submit Proposal"}
                    </button>
                  </div>
                  {transactionStatus.status ? (
                    <p
                      className={`pt-2 ${transactionStatus.status === "PENDING" && "text-yellow-400"} ${transactionStatus.status === "ERROR" && "text-red-400"} ${transactionStatus.status === "SUCCESS" && "text-green-400"} ${transactionStatus.status === "STARTING" && "text-blue-400"} flex items-center gap-2 text-left text-base`}
                    >
                      {transactionStatus.status === "PENDING" ||
                        (transactionStatus.status === "STARTING" && (
                          <Loading />
                        ))}
                      {transactionStatus.message}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-1 pt-2 text-sm text-white">
                    <div className="flex items-center gap-1">
                      <InformationCircleIcon className="h-4 w-4 fill-green-500" />
                      <span>Want a different approach?</span>
                    </div>
                    <span>
                      <Link
                        className="text-blue-500 hover:underline"
                        href="https://mirror.xyz/0xD80E194aBe2d8084fAecCFfd72877e63F5822Fc5/FUvj1g9rPyVm8Ii_qLNu-IbRQPiCHkfZDLAmlP00M1Q"
                        target="_blank"
                      >
                        Check how to create a proposal with the CLI tool
                      </Link>
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
