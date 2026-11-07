
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FileText,
  LoaderCircle,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { apiRequest } from "../lib/api";

type ProjectInfo = {
  _id: string;
  title?: string;
  status?: string;
  category?: string;
};

type Proposal = {
  _id: string;
  projectId: string | ProjectInfo;
  coverLetter: string;
  proposedPrice: number;
  currency?: "INR" | "USD";
  deliveryDays: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  createdAt?: string;
};

type ProposalResponse = {
  success?: boolean;
  count?: number;
  proposals?: Proposal[];
  message?: string;
};

type UserResponse = {
  user?: { role?: string };
  data?: { user?: { role?: string }; role?: string };
  role?: string;
};

function getProjectId(proposal: Proposal): string {
  return typeof proposal.projectId === "string"
    ? proposal.projectId
    : proposal.projectId?._id ?? "";
}

function getProjectTitle(proposal: Proposal): string {
  if (typeof proposal.projectId === "object") {
    return proposal.projectId?.title || "Project";
  }
  return "Project";
}

function formatMoney(amount: number, currency: "INR" | "USD") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusStyle(status: Proposal["status"]) {
  switch (status) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "withdrawn":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [isProfessional, setIsProfessional] = useState(false);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const me = await apiRequest<UserResponse>("/users/me");
      const role = (
        me.user?.role ??
        me.data?.user?.role ??
        me.data?.role ??
        me.role ??
        ""
      ).toLowerCase();

      if (role !== "professional") {
        setIsProfessional(false);
        setProposals([]);
        return;
      }

      setIsProfessional(true);

      const result = await apiRequest<ProposalResponse>("/proposals/mine");
      setProposals(result.proposals ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your proposals."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  const filteredProposals =
    filter === "all"
      ? proposals
      : proposals.filter((proposal) => proposal.status === filter);

  const pendingCount = proposals.filter(
    (proposal) => proposal.status === "pending"
  ).length;

  const acceptedCount = proposals.filter(
    (proposal) => proposal.status === "accepted"
  ).length;

  const rejectedCount = proposals.filter(
    (proposal) => proposal.status === "rejected"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-indigo-600" />
        Loading your proposals...
      </main>
    );
  }

  if (!isProfessional && !error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
          <h1 className="text-xl font-bold text-slate-900">
            Professional account required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Log in with your professional account to view the proposals
            you have submitted.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Professional workspace
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              My Proposals
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track your applications and client decisions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Browse projects
            </Link>

            <button
              onClick={() => void loadProposals()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              onClick={() => void loadProposals()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total proposals", count: proposals.length },
            { label: "Awaiting decision", count: pendingCount },
            { label: "Accepted", count: acceptedCount },
            { label: "Rejected", count: rejectedCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {item.count}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {[
            { label: "All", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Accepted", value: "accepted" },
            { label: "Rejected", value: "rejected" },
            { label: "Withdrawn", value: "withdrawn" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === item.value
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {filteredProposals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {proposals.length === 0
                  ? "No proposals submitted yet"
                  : "No proposals in this category"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {proposals.length === 0
                  ? "Browse open projects and submit your first proposal."
                  : "Choose another status filter to see more proposals."}
              </p>
              {proposals.length === 0 && (
                <Link
                  href="/projects"
                  className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                >
                  Explore projects
                </Link>
              )}
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const projectId = getProjectId(proposal);
              const currency = proposal.currency ?? "INR";

              return (
                <article
                  key={proposal._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {getProjectTitle(proposal)}
                      </h2>
                      <p className="mt-2 text-xs text-slate-400">
                        Proposal ID: {proposal._id}
                      </p>
                      {proposal.createdAt && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays className="h-4 w-4" />
                          Submitted{" "}
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(proposal.status)}`}
                    >
                      {proposal.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Your proposed price
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <Wallet className="h-5 w-5 text-indigo-500" />
                        {formatMoney(proposal.proposedPrice, currency)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Delivery estimate
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        {proposal.deliveryDays} days
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Your cover letter
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {proposal.coverLetter}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    {projectId ? (
                      <Link
                        href={`/projects/${projectId}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        View project
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Link>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Project details are unavailable.
                      </p>
                    )}

                    {proposal.status === "accepted" && (
                      <p className="mt-3 text-sm text-emerald-700">
                        Your proposal was accepted. Check your contracts page
                        for the next steps.
                        {" "}
                        <Link
                          href="/contracts"
                          className="font-semibold underline"
                        >
                          View contracts
                        </Link>
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
