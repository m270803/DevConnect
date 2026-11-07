
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Play,
} from "lucide-react";
import { apiRequest } from "../lib/api";

type Contract = {
  _id: string;
  title?: string;
  agreedPrice: number;
  currency?: string;
  status: string;
  projectId?: { _id?: string; title?: string } | string;
  clientId?: { _id?: string; name?: string } | string;
  professionalId?: { _id?: string; name?: string } | string;
};

type Milestone = {
  _id: string;
  contractId: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  order: number;
  status: string;
  deliverableUrl?: string;
  submissionNote?: string;
  revisionNote?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  contracts?: T[];
  milestones?: T[];
  contract?: T;
  milestone?: T;
  user?: { _id?: string; role?: string };
  data?: unknown;
};

type UserResponse = {
  user?: { _id?: string; role?: string };
  data?: {
    _id?: string;
    role?: string;
    user?: { _id?: string; role?: string };
  };
  role?: string;
};

function unwrap<T>(value: unknown): T {
  let result = value as Record<string, unknown>;

  for (let i = 0; i < 3; i++) {
    if (result && typeof result === "object" && "data" in result) {
      result = result.data as Record<string, unknown>;
    } else {
      break;
    }
  }

  return result as T;
}

function money(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

const statusStyles: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-violet-100 text-violet-700",
  revision_requested: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
};

export default function MilestonesPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [revisionNotes, setRevisionNotes] = useState<
    Record<string, string>
  >({});

  const [submissionUrls, setSubmissionUrls] = useState<
    Record<string, string>
  >({});
  const [submissionNotes, setSubmissionNotes] = useState<
    Record<string, string>
  >({});

  const selectedContract = contracts.find(
    (contract) => contract._id === selectedContractId
  );

  const loadMilestones = useCallback(async (contractId: string) => {
    if (!contractId) {
      setMilestones([]);
      return;
    }

    setMilestonesLoading(true);
    setError("");

    try {
      const response = unwrap<ApiResponse<Milestone>>(
        await apiRequest(`/milestones/contract/${contractId}`)
      );

      setMilestones(response.milestones || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load milestones"
      );
    } finally {
      setMilestonesLoading(false);
    }
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [contractResult, userResult] = await Promise.all([
        apiRequest("/contracts/mine"),
        apiRequest<UserResponse>("/users/me"),
      ]);

      const contractResponse =
        unwrap<ApiResponse<Contract>>(contractResult);
      const contractList = contractResponse.contracts || [];
      const currentUser =
        userResult.user ?? userResult.data?.user ?? userResult.data;

      setContracts(contractList);
      setRole(currentUser?.role ?? userResult.role ?? "");

      const activeContracts = contractList.filter(
        (contract) => contract.status === "active"
      );

      const preferred =
        activeContracts[0]?._id || contractList[0]?._id || "";

      setSelectedContractId((previous) => {
        if (contractList.some((contract) => contract._id === previous)) {
          return previous;
        }
        return preferred;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load contracts"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (selectedContractId) {
      void loadMilestones(selectedContractId);
    } else {
      setMilestones([]);
    }
  }, [selectedContractId, loadMilestones]);

  const performAction = async (
    milestoneId: string,
    body: Record<string, unknown>,
    successMessage: string
  ) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/milestones/${milestoneId}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      setNotice(successMessage);
      await loadMilestones(selectedContractId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update milestone"
      );
    } finally {
      setSaving(false);
    }
  };

  const createMilestone = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedContractId) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const nextOrder =
        milestones.reduce(
          (highest, milestone) => Math.max(highest, milestone.order),
          0
        ) + 1;

      await apiRequest(`/milestones/contract/${selectedContractId}`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          amount: Number(amount),
          dueDate: new Date(`${dueDate}T23:59:59`).toISOString(),
          order: nextOrder,
        }),
      });

      setTitle("");
      setDescription("");
      setAmount("");
      setDueDate("");
      setShowCreateForm(false);
      setNotice("Milestone created successfully.");

      await loadMilestones(selectedContractId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create milestone"
      );
    } finally {
      setSaving(false);
    }
  };

  const approvedTotal = milestones
    .filter((milestone) => milestone.status === "approved")
    .reduce((total, milestone) => total + milestone.amount, 0);

  const allocatedTotal = milestones.reduce(
    (total, milestone) => total + milestone.amount,
    0
  );

  const currency = selectedContract?.currency || "INR";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin" size={28} />
        <span className="ml-3 text-slate-600">Loading milestones...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/contracts"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Back to contracts
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              SkillConnect Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Project milestones
            </h1>
            <p className="mt-2 text-slate-600">
              Track deliverables, deadlines and project progress.
            </p>
          </div>

          <button
            onClick={() => void loadPage()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {contracts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <FileText className="mx-auto mb-4 text-slate-400" size={36} />
            <h2 className="text-xl font-semibold">No contracts found</h2>
            <p className="mt-2 text-slate-600">
              Milestones become available after a proposal is accepted and a contract is created.
            </p>
            <Link
              href="/contracts"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
            >
              View contracts
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label
                htmlFor="contract"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Select contract
              </label>

              <select
                id="contract"
                value={selectedContractId}
                onChange={(event) => {
                  setSelectedContractId(event.target.value);
                  setShowCreateForm(false);
                  setError("");
                  setNotice("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {contracts.map((contract) => (
                  <option key={contract._id} value={contract._id}>
                    {typeof contract.projectId === "object"
                      ? contract.projectId?.title || contract.title || "Contract"
                      : contract.title || "Contract"}{" "}
                    — {money(contract.agreedPrice, contract.currency || "INR")}
                  </option>
                ))}
              </select>

              {selectedContract && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    Contract status:{" "}
                    <span className="font-semibold text-slate-900">
                      {statusLabel(selectedContract.status)}
                    </span>
                  </div>

                  {role === "client" && selectedContract.status === "active" && (
                    <button
                      onClick={() => setShowCreateForm((value) => !value)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <Plus size={17} />
                      {showCreateForm ? "Cancel" : "Add milestone"}
                    </button>
                  )}
                </div>
              )}
            </section>

            {showCreateForm && role === "client" && (
              <form
                onSubmit={createMilestone}
                className="mb-6 space-y-4 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <h2 className="text-xl font-bold">Create milestone</h2>

                <div>
                  <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
                    Title
                  </label>
                  <input
                    id="title"
                    required
                    maxLength={150}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Complete homepage design"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    maxLength={2000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe the expected deliverable..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="amount" className="mb-1.5 block text-sm font-medium">
                      Amount ({currency})
                    </label>
                    <input
                      id="amount"
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="3000"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Remaining unallocated amount:{" "}
                      {money(
                        Math.max(0, (selectedContract?.agreedPrice || 0) - allocatedTotal),
                        currency
                      )}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="dueDate" className="mb-1.5 block text-sm font-medium">
                      Due date
                    </label>
                    <input
                      id="dueDate"
                      type="date"
                      required
                      min={new Date().toLocaleDateString("en-CA")}
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
                  Create milestone
                </button>
              </form>
            )}

            <section className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Total milestones</p>
                <p className="mt-2 text-2xl font-bold">{milestones.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Approved amount</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {money(approvedTotal, currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Allocated amount</p>
                <p className="mt-2 text-2xl font-bold">
                  {money(allocatedTotal, currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Contract total: {money(selectedContract?.agreedPrice || 0, currency)}
                </p>
              </div>
            </section>

            {milestonesLoading ? (
              <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-10">
                <Loader2 className="animate-spin" size={24} />
                <span className="ml-3 text-slate-600">Loading milestones...</span>
              </div>
            ) : milestones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Clock className="mx-auto mb-4 text-slate-400" size={34} />
                <h2 className="text-lg font-semibold">No milestones yet</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {role === "client"
                    ? "Add the first milestone to define the project's deliverables."
                    : "The client has not created any milestones for this contract yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <article
                    key={milestone._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold">
                            {milestone.order}
                          </span>
                          <h2 className="text-lg font-bold">{milestone.title}</h2>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[milestone.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabel(milestone.status)}
                          </span>
                        </div>

                        {milestone.description && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {milestone.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={15} />
                            Due {new Date(milestone.dueDate).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {money(milestone.amount, currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {milestone.deliverableUrl && (
                      <a
                        href={milestone.deliverableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 break-all text-sm font-semibold text-indigo-600 underline"
                      >
                        <FileText size={16} />
                        View submitted deliverable
                      </a>
                    )}

                    {milestone.submissionNote && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        <strong>Submission note:</strong> {milestone.submissionNote}
                      </p>
                    )}

                    {milestone.revisionNote && (
                      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                        <strong>Revision requested:</strong> {milestone.revisionNote}
                      </p>
                    )}

                    {role === "professional" &&
                      ["pending", "revision_requested", "in_progress"].includes(milestone.status) && (
                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                          {milestone.status === "pending" ? (
                            <button
                              disabled={saving}
                              onClick={() =>
                                void performAction(
                                  milestone._id,
                                  { status: "in_progress" },
                                  "Milestone marked as in progress."
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              <Play size={16} />
                              Start work
                            </button>
                          ) : (
                            <>
                              <label className="block text-sm font-medium">
                                Deliverable URL
                                <input
                                  type="url"
                                  required
                                  value={submissionUrls[milestone._id] || ""}
                                  onChange={(event) =>
                                    setSubmissionUrls((previous) => ({
                                      ...previous,
                                      [milestone._id]: event.target.value,
                                    }))
                                  }
                                  placeholder="https://..."
                                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3"
                                />
                              </label>
                              <label className="block text-sm font-medium">
                                Submission note
                                <textarea
                                  rows={2}
                                  maxLength={2000}
                                  value={submissionNotes[milestone._id] || ""}
                                  onChange={(event) =>
                                    setSubmissionNotes((previous) => ({
                                      ...previous,
                                      [milestone._id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Describe the completed work..."
                                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3"
                                />
                              </label>
                              <button
                                disabled={saving || !submissionUrls[milestone._id]?.trim()}
                                onClick={() =>
                                  void performAction(
                                    milestone._id,
                                    {
                                      status: "submitted",
                                      deliverableUrl: submissionUrls[milestone._id],
                                      submissionNote: submissionNotes[milestone._id] || "",
                                    },
                                    "Deliverable submitted successfully."
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                              >
                                <Send size={16} />
                                Submit deliverable
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    {role === "client" && milestone.status === "submitted" && (
                      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                        <button
                          disabled={saving}
                          onClick={() =>
                            void performAction(
                              milestone._id,
                              { status: "approved" },
                              "Milestone approved."
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} />
                          Approve milestone
                        </button>

                        <div>
                          <label className="block text-sm font-medium">
                            Revision feedback
                            <textarea
                              rows={2}
                              maxLength={2000}
                              value={revisionNotes[milestone._id] || ""}
                              onChange={(event) =>
                                setRevisionNotes((previous) => ({
                                  ...previous,
                                  [milestone._id]: event.target.value,
                                }))
                              }
                              placeholder="Explain what needs to change..."
                              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                          </label>

                          <button
                            disabled={saving || !revisionNotes[milestone._id]?.trim()}
                            onClick={() =>
                              void performAction(
                                milestone._id,
                                {
                                  status: "revision_requested",
                                  revisionNote: revisionNotes[milestone._id],
                                },
                                "Revision requested."
                              )
                            }
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                          >
                            <RefreshCw size={16} />
                            Request revision
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
