
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  LoaderCircle,
  Send,
  UserRound,
} from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Project = {
  _id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budgetType: "fixed" | "hourly";
  budgetMin: number;
  budgetMax: number;
  currency: "INR" | "USD";
  deadline?: string;
  status: "draft" | "open" | "paused" | "closed";
  createdAt?: string;
  clientId?: {
    _id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
};

type User = {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  role?: string;
};

type ProjectResponse = {
  success?: boolean;
  project?: Project;
};

type UserResponse = {
  success?: boolean;
  user?: User;
  data?: User & {
    user?: User;
  };
  role?: string;
};

type ProposalResponse = {
  success?: boolean;
  message?: string;
  proposal?: {
    _id: string;
    status: string;
  };
};

const formatMoney = (amount: number, currency: "INR" | "USD") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const [coverLetter, setCoverLetter] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest<ProjectResponse>(
        `/projects/${projectId}`
      );

      if (!result.project) {
        throw new Error("Project details could not be loaded.");
      }

      setProject(result.project);

      // Project details are public. The user may not be logged in.
      try {
        const me = await apiRequest<UserResponse>("/users/me");
        const currentUser = me.user ?? me.data?.user ?? me.data ?? null;
        const currentRole =
          currentUser?.role ?? me.data?.role ?? me.role ?? "";

        setUser(currentUser);
        setRole(currentRole.toLowerCase());
      } catch {
        setUser(null);
        setRole("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load project details."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      void loadProject();
    }
  }, [projectId, loadProject]);

  async function handleSubmitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please log in before submitting a proposal.");
      return;
    }

    if (role !== "professional") {
      setError("Only professionals can submit proposals.");
      return;
    }

    const price = Number(proposedPrice);
    const days = Number(deliveryDays);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid proposed price greater than zero.");
      return;
    }

    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setError("Delivery time must be between 1 and 365 days.");
      return;
    }

    if (coverLetter.trim().length < 30 || coverLetter.trim().length > 3000) {
      setError("Your cover letter must contain 30–3000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest<ProposalResponse>("/proposals", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          coverLetter: coverLetter.trim(),
          proposedPrice: price,
          deliveryDays: days,
        }),
      });

      setSuccess("Your proposal was submitted successfully!");
      setCoverLetter("");
      setProposedPrice("");
      setDeliveryDays("7");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit your proposal."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          Loading project details...
        </div>
      </main>
    );
  }

  if (error && !project) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="text-xl font-bold text-slate-900">
            Unable to load project
          </h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button
            onClick={() => void loadProject()}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Try again
          </button>
          <div className="mt-4">
            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Back to projects
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!project) return null;

  const isProfessional = role === "professional";
  const isClient = role === "client";
  const isProjectOwner =
    Boolean(user && project.clientId?._id) &&
    (user?._id ?? user?.id) === project.clientId?._id;
  const isOpen = project.status === "open";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Project information */}
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {project.category}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isOpen
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {project.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {project.budgetType === "fixed"
                    ? "Fixed-price project"
                    : "Hourly project"}
                </span>

                {project.deadline && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Deadline:{" "}
                    {new Date(project.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="my-7 border-t border-slate-100" />

              <h2 className="text-lg font-bold text-slate-900">
                Project description
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {project.description}
              </p>

              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-900">
                  Required skills
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.requiredSkills?.length ? (
                    project.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No specific skills listed.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Client information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <UserRound className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    About the client
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {project.clientId?.name ||
                      (project.clientId?.username
                        ? `@${project.clientId.username}`
                        : "Client")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Budget and proposal form */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Client&apos;s budget
              </p>

              <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
                {project.currency === "INR" ? (
                  <IndianRupee className="h-6 w-6" />
                ) : (
                  <span className="text-2xl">$</span>
                )}

                <span>
                  {formatMoney(project.budgetMin, project.currency)} –{" "}
                  {formatMoney(project.budgetMax, project.currency)}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {project.budgetType === "fixed"
                  ? "Total project budget"
                  : "Hourly budget range"}
              </p>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Project status</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {project.status}
                  </span>
                </div>

                {project.createdAt && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Posted</span>
                    <span className="text-slate-700">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isProfessional && isOpen && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Submit a proposal
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Explain how you will complete this project, your price, and
                  your expected delivery time.
                </p>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    role="status"
                    className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmitProposal} className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="proposedPrice"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Your proposed price ({project.currency})
                    </label>

                    <input
                      id="proposedPrice"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      placeholder="Enter your price"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="deliveryDays"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Delivery time (days)
                    </label>

                    <div className="relative">
                      <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="deliveryDays"
                        type="number"
                        min="1"
                        max="365"
                        step="1"
                        required
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="coverLetter"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Cover letter
                    </label>

                    <textarea
                      id="coverLetter"
                      required
                      minLength={30}
                      maxLength={3000}
                      rows={6}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Introduce yourself, explain your approach, and describe relevant experience..."
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                    <p className="mt-2 text-right text-xs text-slate-400">
                      {coverLetter.length}/3000 characters (minimum 30)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit proposal
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {!user && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-slate-900">
                  Interested in this project?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Log in to your professional account to submit a proposal.
                </p>
                <Link
                  href="/login"
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                >
                  Log in
                </Link>
              </div>
            )}


{(isClient || isProjectOwner) && (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="font-bold text-slate-900">Project proposals</h2>

    <p className="mt-2 text-sm leading-6 text-slate-500">
      Review professional applications and choose the right person for
      your project.
    </p>

    <Link
      href={`/projects/${project._id}/proposals`}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
    >
      <FileText className="h-4 w-4" />
      View proposals
    </Link>
  </div>
)}


            {isProfessional && !isOpen && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                This project is not currently accepting proposals.
              </div>
            )}

            {role && role !== "professional" && role !== "client" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                You can view project details, but this account cannot submit
                proposals.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
