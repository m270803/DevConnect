
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  LoaderCircle,
  RefreshCw,
  UserRound,
  XCircle,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

type Professional = {
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
};

type Proposal = {
  _id: string;
  projectId: string | { _id: string; title?: string };
  professionalId: string | Professional;
  coverLetter: string;
  proposedPrice: number;
  currency?: "INR" | "USD";
  deliveryDays: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  createdAt?: string;
};

type Project = {
  _id: string;
  title: string;
  status: string;
  currency?: "INR" | "USD";
};

type ProposalsResponse = {
  success?: boolean;
  count?: number;
  proposals?: Proposal[];
  message?: string;
};

type MyProjectsResponse = {
  success?: boolean;
  projects?: Project[];
};

type UserResponse = {
  success?: boolean;
  user?: { role?: string };
  data?: { user?: { role?: string }; role?: string };
  role?: string;
};

function getProfessionalName(proposal: Proposal) {
  if (typeof proposal.professionalId === "object") {
    return (
      proposal.professionalId.name ||
      (proposal.professionalId.username
        ? `@${proposal.professionalId.username}`
        : null) ||
      "Professional"
    );
  }

  return "Professional";
}

function getProfessionalId(proposal: Proposal) {
  return typeof proposal.professionalId === "string"
    ? proposal.professionalId
    : proposal.professionalId._id;
}

function formatMoney(amount: number, currency: "INR" | "USD") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ProjectProposalsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [role, setRole] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnauthorized(false);

    try {
      const me = await apiRequest<UserResponse>("/users/me");
      const currentRole =
        me.user?.role ?? me.data?.user?.role ?? me.data?.role ?? me.role ?? "";

      setRole(currentRole.toLowerCase());

      if (currentRole.toLowerCase() !== "client") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const [projectsResult, proposalResult] = await Promise.all([
        apiRequest<MyProjectsResponse>("/projects/mine"),
        apiRequest<ProposalsResponse>(`/proposals/project/${projectId}`),
      ]);

      setProject(
        projectsResult.projects?.find((item) => item._id === projectId) ?? null
      );
      setProposals(proposalResult.proposals ?? []);

      if (!projectsResult.projects?.some((item) => item._id === projectId)) {
        throw new Error("Project not found in your client account.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load project proposals."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) void loadData();
  }, [projectId, loadData]);

  async function decideProposal(
    proposalId: string,
    action: "accept" | "reject"
  ) {
    const confirmed = window.confirm(
      action === "accept"
        ? "Accept this proposal? Your backend will create a contract and close the project."
        : "Are you sure you want to reject this proposal?"
    );

    if (!confirmed) return;

    setBusyId(proposalId);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest<{
        success?: boolean;
        message?: string;
      }>(`/proposals/${proposalId}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });

      setNotice(
        result.message ||
          (action === "accept"
            ? "Proposal accepted. Check your contracts."
            : "Proposal rejected.")
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${action} this proposal.`
      );
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-indigo-600" />
        Loading proposals...
      </main>
    );
  }

  if (unauthorized || role !== "client") {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8">
          <h1 className="text-xl font-bold text-slate-900">
            Client access required
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Log in with the client account that owns this project to manage its
            proposals.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Client workspace
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Project proposals
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {project?.title || "Review professional applications"}
            </p>
          </div>

          <button
            onClick={() => void loadData()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            {notice}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Total",
              count: proposals.length,
              color: "text-slate-900",
            },
            {
              label: "Pending",
              count: proposals.filter((p) => p.status === "pending").length,
              color: "text-amber-600",
            },
            {
              label: "Accepted",
              count: proposals.filter((p) => p.status === "accepted").length,
              color: "text-emerald-600",
            },
            {
              label: "Rejected",
              count: proposals.filter((p) => p.status === "rejected").length,
              color: "text-red-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                {item.count}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {proposals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No proposals yet
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Proposals submitted by professionals for this project will
                appear here.
              </p>
            </div>
          ) : (
            proposals.map((proposal) => {
              const pending = proposal.status === "pending";
              const currency =
                proposal.currency ?? project?.currency ?? "INR";

              return (
                <article
                  key={proposal._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <UserRound className="h-6 w-6" />
                      </div>

                      <div>
                        <h2 className="font-bold text-slate-900">
                          {getProfessionalName(proposal)}
                        </h2>
                        <p className="mt-1 break-all text-xs text-slate-400">
                          Professional ID: {getProfessionalId(proposal) || "—"}
                        </p>
                        {proposal.createdAt && (
                          <p className="mt-2 text-xs text-slate-500">
                            Submitted{" "}
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        proposal.status === "accepted"
                          ? "bg-emerald-50 text-emerald-700"
                          : proposal.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : proposal.status === "withdrawn"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Proposed price
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatMoney(proposal.proposedPrice, currency)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Estimated delivery
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-900">
                        <Clock className="h-5 w-5 text-slate-400" />
                        {proposal.deliveryDays} days
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-slate-900">
                      Cover letter
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {proposal.coverLetter}
                    </p>
                  </div>

                  {pending && project?.status === "open" && (
                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                      <button
                        onClick={() =>
                          void decideProposal(proposal._id, "reject")
                        }
                        disabled={Boolean(busyId)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {busyId === proposal._id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>

                      <button
                        onClick={() =>
                          void decideProposal(proposal._id, "accept")
                        }
                        disabled={Boolean(busyId)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {busyId === proposal._id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Accept proposal
                      </button>
                    </div>
                  )}

                  {proposal.status === "accepted" && (
                    <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                      This proposal was accepted. Check your contracts page
                      for the generated contract.
                      {" "}
                      <Link
                        href="/contracts"
                        className="font-semibold underline"
                      >
                        View contracts
                      </Link>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
