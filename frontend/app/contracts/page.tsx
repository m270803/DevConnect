
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { apiRequest } from "../lib/api";

type Person = {
  _id?: string;
  name?: string;
  username?: string;
};

type Project = {
  _id?: string;
  title?: string;
  category?: string;
};

type Contract = {
  _id: string;
  projectId: string | Project;
  proposalId: string;
  clientId: string | Person;
  professionalId: string | Person;
  title: string;
  agreedPrice: number;
  currency: "INR" | "USD";
  deliveryDays: number;
  startDate: string;
  expectedEndDate: string;
  status: "active" | "completed" | "cancelled";
  createdAt?: string;
};

type Conversation = {
  _id: string;
  projectId: string | Project;
  clientId: string | Person;
  professionalId: string | Person;
  lastMessageAt?: string | null;
};

type ContractsResponse = {
  success: boolean;
  contracts?: Contract[];
};

type ConversationsResponse = {
  success: boolean;
  conversations?: Conversation[];
};

type UserResponse = {
  success: boolean;
  user?: Person & { role?: string };
};

function getId(value: string | { _id?: string } | null | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id ?? "";
}

function getName(value: string | Person | null | undefined) {
  if (!value) return "Unknown";
  if (typeof value === "string") return "User";
  return value.name || value.username || "User";
}

function getProjectTitle(contract: Contract) {
  if (typeof contract.projectId === "object") {
    return contract.projectId.title || contract.title;
  }
  return contract.title;
}

function formatDate(value: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(amount: number, currency: "INR" | "USD") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusStyle(status: Contract["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "completed":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-200";
  }
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadContracts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [contractResult, conversationResult, userResult] =
        await Promise.all([
          apiRequest<ContractsResponse>("/contracts/mine"),
          apiRequest<ConversationsResponse>("/conversations/mine"),
          apiRequest<UserResponse>("/users/me"),
        ]);

      setContracts(contractResult.contracts ?? []);
      setConversations(conversationResult.conversations ?? []);
      setRole(userResult.user?.role ?? "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your contracts."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  function findConversation(contract: Contract) {
    const projectId = getId(contract.projectId);
    const clientId = getId(contract.clientId);
    const professionalId = getId(contract.professionalId);

    return conversations.find(
      (conversation) =>
        getId(conversation.projectId) === projectId &&
        getId(conversation.clientId) === clientId &&
        getId(conversation.professionalId) === professionalId
    );
  }

  const activeCount = contracts.filter(
    (contract) => contract.status === "active"
  ).length;

  const completedCount = contracts.filter(
    (contract) => contract.status === "completed"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>Loading your contracts...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              My Contracts
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Manage your projects, deadlines, agreements, and conversations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/milestones"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Project milestones
            </Link>
            <button
              type="button"
              onClick={() => void loadContracts(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total contracts
              </p>
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-3 text-3xl font-bold">{contracts.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Active contracts
              </p>
              <BriefcaseBusiness className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-bold">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Completed contracts
              </p>
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-3 text-3xl font-bold">{completedCount}</p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadContracts()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Contracts list */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Your agreements</h2>
            <span className="text-sm text-slate-500">
              {contracts.length} found
            </span>
          </div>

          {!error && contracts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <FileText className="h-7 w-7 text-indigo-600" />
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No contracts yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                When a client accepts a proposal, the contract will appear
                here automatically.
              </p>

              <Link
                href={role === "professional" ? "/my-proposals" : "/projects"}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {role === "professional" ? "View my proposals" : "Browse projects"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => {
                const conversation = findConversation(contract);

                const otherPerson =
                  role === "professional"
                    ? contract.clientId
                    : contract.professionalId;

                return (
                  <article
                    key={contract._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {getProjectTitle(contract)}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${getStatusStyle(contract.status)}`}
                          >
                            {contract.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          Contract ID:{" "}
                          <span className="break-all font-mono text-xs">
                            {contract._id}
                          </span>
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-indigo-50 p-2">
                              <Wallet className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                Agreed price
                              </p>
                              <p className="mt-1 font-semibold">
                                {formatPrice(
                                  contract.agreedPrice,
                                  contract.currency
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-indigo-50 p-2">
                              <CalendarDays className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                Expected completion
                              </p>
                              <p className="mt-1 font-semibold">
                                {formatDate(contract.expectedEndDate)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              {role === "professional" ? "Client" : "Professional"}
                            </p>
                            <p className="mt-1 font-medium">
                              {getName(otherPerson)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Contract duration
                            </p>
                            <p className="mt-1 font-medium">
                              {contract.deliveryDays} days
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-xs text-slate-400">
                          Started {formatDate(contract.startDate)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 lg:w-52">
                        {conversation ? (
                          <Link
                            href={`/messages?conversationId=${encodeURIComponent(conversation._id)}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Open conversation
                          </Link>
                        ) : (
                          <div
                            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
                            title="Refresh after the conversation is created"
                          >
                            Conversation not found. Try refreshing.
                          </div>
                        )}

                        <Link
                          href="/messages"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          All messages
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
