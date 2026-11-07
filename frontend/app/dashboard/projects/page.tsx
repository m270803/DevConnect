"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowUpRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Code2,
    Plus,
    RefreshCw,
    Search,
    X,
    Wallet,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

type ProjectStatus = "draft" | "open" | "paused" | "closed";
type BudgetType = "fixed" | "hourly";
type Currency = "INR" | "USD";

type Project = {
    _id: string;
    title: string;
    description: string;
    category: string;
    requiredSkills: string[];
    budgetType: BudgetType;
    budgetMin: number;
    budgetMax: number;
    currency: Currency;
    deadline?: string;
    status: ProjectStatus;
    createdAt?: string;
};

type ProjectResponse = {
    success?: boolean;
    message?: string;
    project?: Project;
    projects?: Project[];
    count?: number;
    total?: number;
    totalPages?: number;
    page?: number;
};

const initialForm = {
    title: "",
    description: "",
    category: "Web Development",
    requiredSkills: "",
    budgetType: "fixed" as BudgetType,
    budgetMin: "",
    budgetMax: "",
    currency: "INR" as Currency,
    deadline: "",
    status: "open" as "draft" | "open",
};

const categories = [
    "Web Development",
    "Mobile App Development",
    "AI & Machine Learning",
    "Data Analytics",
    "UI/UX Design",
    "Other",
];

const statusStyles: Record<ProjectStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    open: "bg-emerald-50 text-emerald-700",
    paused: "bg-amber-50 text-amber-700",
    closed: "bg-rose-50 text-rose-700",
};

function formatBudget(project: Project) {
    const symbol = project.currency === "INR" ? "₹" : "$";
    const min = Number(project.budgetMin).toLocaleString("en-IN");
    const max = Number(project.budgetMax).toLocaleString("en-IN");
    const amount = project.budgetMin === project.budgetMax
        ? `${symbol}${min}`
        : `${symbol}${min} – ${symbol}${max}`;

    return `${amount}${project.budgetType === "hourly" ? "/hr" : ""}`;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState(initialForm);

    const isClient = role === "client";
    const isProfessional = role === "professional";

    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const me = await apiRequest<{
                user?: { role?: string };
                data?: { user?: { role?: string }; role?: string };
                role?: string;
            }>("/users/me");

            const currentRole =
                me.user?.role ??
                me.data?.user?.role ??
                me.data?.role ??
                me.role ??
                "";

            setRole(currentRole.toLowerCase());

            // Clients see their own projects; professionals browse open projects.
            const endpoint =
                currentRole.toLowerCase() === "client"
                    ? "/projects/mine"
                    : "/projects";

            const result = await apiRequest<ProjectResponse>(endpoint);
            setProjects(result.projects ?? []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load projects. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    function updateForm(field: string, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const min = Number(form.budgetMin);
        const max = Number(form.budgetMax);

        if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
            setError("Enter a valid budget range. Maximum must be at least the minimum.");
            return;
        }

        const skills = form.requiredSkills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);

        if (skills.length > 20) {
            setError("Please enter no more than 20 required skills.");
            return;
        }

        setSubmitting(true);

        try {
            await apiRequest<ProjectResponse>("/projects", {
                method: "POST",
                body: JSON.stringify({
                    title: form.title.trim(),
                    description: form.description.trim(),
                    category: form.category,
                    requiredSkills: skills,
                    budgetType: form.budgetType,
                    budgetMin: min,
                    budgetMax: max,
                    currency: form.currency,
                    ...(form.deadline ? { deadline: new Date(form.deadline).toISOString() } : {}),
                    status: form.status,
                }),
            });

            setForm(initialForm);
            setShowForm(false);
            setSuccess("Project created successfully.");
            await loadProjects();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to create the project."
            );
        } finally {
            setSubmitting(false);
        }
    }

    const filteredProjects = projects.filter((project) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
            !query ||
            [
                project.title,
                project.description,
                project.category,
                ...(project.requiredSkills ?? []),
            ]
                .join(" ")
                .toLowerCase()
                .includes(query);

        const matchesStatus =
            statusFilter === "all" || project.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
                        >
                            <ArrowLeft size={16} />
                            Back to dashboard
                        </Link>
                        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
                            {isProfessional ? "Explore projects" : "Projects"}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {isProfessional
                                ? "Discover projects that match your skills."
                                : "Create projects and manage your opportunities."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadProjects}
                        disabled={loading}
                        aria-label="Refresh projects"
                        className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8">
                {/* Summary cards */}
                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Projects shown</span>
                            <BriefcaseBusiness size={20} className="text-indigo-600" />
                        </div>
                        <p className="mt-3 text-3xl font-extrabold">{projects.length}</p>
                        <p className="mt-1 text-xs text-slate-400">Loaded from your API</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Open projects</span>
                            <CheckCircle2 size={20} className="text-emerald-600" />
                        </div>
                        <p className="mt-3 text-3xl font-extrabold">
                            {projects.filter((project) => project.status === "open").length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Currently open</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Drafts</span>
                            <Clock3 size={20} className="text-amber-600" />
                        </div>
                        <p className="mt-3 text-3xl font-extrabold">
                            {projects.filter((project) => project.status === "draft").length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Not yet published</p>
                    </div>
                </section>

                {/* Actions and filters */}
                <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <div className="flex max-w-xl flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                            <Search size={18} className="shrink-0 text-slate-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search projects, skills, categories..."
                                aria-label="Search projects"
                                className="w-full py-3 text-sm outline-none"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            aria-label="Filter by project status"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                        >
                            <option value="all">All statuses</option>
                            <option value="open">Open</option>
                            <option value="draft">Draft</option>
                            <option value="paused">Paused</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {isClient && (
                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setSuccess("");
                                setShowForm((current) => !current);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                        >
                            {showForm ? <X size={17} /> : <Plus size={18} />}
                            {showForm ? "Close form" : "Create project"}
                        </button>
                    )}
                </section>

                {/* Feedback */}
                {error && (
                    <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <p>{error}</p>
                        <button type="button" aria-label="Dismiss error" onClick={() => setError("")}>
                            <X size={17} />
                        </button>
                    </div>
                )}

                {success && (
                    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                {/* Create project form */}
                {showForm && isClient && (
                    <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-extrabold">Create a project</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Describe your requirements so professionals can understand your idea.
                            </p>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label htmlFor="title" className="mb-2 block text-sm font-semibold">
                                        Project title
                                    </label>
                                    <input
                                        id="title"
                                        required
                                        minLength={3}
                                        maxLength={150}
                                        value={form.title}
                                        onChange={(e) => updateForm("title", e.target.value)}
                                        placeholder="e.g. Build a service marketplace website"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="description" className="mb-2 block text-sm font-semibold">
                                        Project description
                                    </label>
                                    <textarea
                                        id="description"
                                        required
                                        minLength={10}
                                        maxLength={10000}
                                        rows={5}
                                        value={form.description}
                                        onChange={(e) => updateForm("description", e.target.value)}
                                        placeholder="Explain what you want to build, the main features, and the expected outcome..."
                                        className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="category" className="mb-2 block text-sm font-semibold">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        value={form.category}
                                        onChange={(e) => updateForm("category", e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="skills" className="mb-2 block text-sm font-semibold">
                                        Required skills
                                    </label>
                                    <input
                                        id="skills"
                                        value={form.requiredSkills}
                                        onChange={(e) => updateForm("requiredSkills", e.target.value)}
                                        placeholder="React, Node.js, MongoDB"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                                    />
                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Separate skills with commas (up to 20).
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="budgetType" className="mb-2 block text-sm font-semibold">
                                        Budget type
                                    </label>
                                    <select
                                        id="budgetType"
                                        value={form.budgetType}
                                        onChange={(e) => updateForm("budgetType", e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    >
                                        <option value="fixed">Fixed price</option>
                                        <option value="hourly">Hourly rate</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="currency" className="mb-2 block text-sm font-semibold">
                                        Currency
                                    </label>
                                    <select
                                        id="currency"
                                        value={form.currency}
                                        onChange={(e) => updateForm("currency", e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    >
                                        <option value="INR">INR — Indian Rupee (₹)</option>
                                        <option value="USD">USD — US Dollar ($)</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="budgetMin" className="mb-2 block text-sm font-semibold">
                                        Minimum budget
                                    </label>
                                    <input
                                        id="budgetMin"
                                        type="number"
                                        min="0"
                                        step="any"
                                        required
                                        value={form.budgetMin}
                                        onChange={(e) => updateForm("budgetMin", e.target.value)}
                                        placeholder="5000"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="budgetMax" className="mb-2 block text-sm font-semibold">
                                        Maximum budget
                                    </label>
                                    <input
                                        id="budgetMax"
                                        type="number"
                                        min="0"
                                        step="any"
                                        required
                                        value={form.budgetMax}
                                        onChange={(e) => updateForm("budgetMax", e.target.value)}
                                        placeholder="15000"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="deadline" className="mb-2 block text-sm font-semibold">
                                        Deadline <span className="font-normal text-slate-400">(optional)</span>
                                    </label>
                                    <input
                                        id="deadline"
                                        type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                        value={form.deadline}
                                        onChange={(e) => updateForm("deadline", e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="status" className="mb-2 block text-sm font-semibold">
                                        Publish status
                                    </label>
                                    <select
                                        id="status"
                                        value={form.status}
                                        onChange={(e) => updateForm("status", e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    >
                                        <option value="open">Open — visible to professionals</option>
                                        <option value="draft">Draft — save for later</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? "Creating project..." : "Create project"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* Project listing */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold">
                                {isProfessional ? "Available projects" : "Your projects"}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {filteredProjects.length} result{filteredProjects.length === 1 ? "" : "s"}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
                            <RefreshCw size={28} className="mx-auto animate-spin text-indigo-600" />
                            <p className="mt-4 text-sm text-slate-500">Loading projects...</p>
                        </div>
                    ) : error && projects.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
                            <BriefcaseBusiness size={30} className="mx-auto text-slate-400" />
                            <h3 className="mt-4 font-bold">Could not load projects</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Check your backend connection and try again.
                            </p>
                            <button
                                type="button"
                                onClick={loadProjects}
                                className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                <BriefcaseBusiness size={26} />
                            </span>
                            <h3 className="mt-5 text-lg font-bold">
                                {projects.length === 0
                                    ? isProfessional
                                        ? "No open projects yet"
                                        : "Your project journey starts here"
                                    : "No matching projects"}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                {projects.length === 0
                                    ? isProfessional
                                        ? "New projects will appear here when clients publish them."
                                        : "Create your first project and describe the expertise you need."
                                    : "Try changing your search or status filter."}
                            </p>

                            {isClient && projects.length === 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowForm(true)}
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                                >
                                    <Plus size={17} /> Create your first project
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {filteredProjects.map((project) => (
                                <article
                                    key={project._id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50 sm:p-6"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                <Code2 size={21} />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="break-words font-bold text-slate-900">
                                                    <Link
                                                        href={`/projects/${project._id}`}
                                                        className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                                    >
                                                        {project.title}
                                                    </Link>
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {project.category}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusStyles[project.status] ?? statusStyles.draft
                                                }`}
                                        >
                                            {project.status}
                                        </span>
                                    </div>

                                    <p className="mt-5 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                        {project.description}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {(project.requiredSkills ?? []).map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="flex items-center gap-2 text-lg font-extrabold">
                                                <Wallet size={17} className="text-slate-400" />
                                                {formatBudget(project)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {project.budgetType === "hourly" ? "Hourly budget" : "Project budget"}
                                            </p>
                                        </div>

                                        {project.deadline && (
                                            <p className="flex items-center gap-2 text-xs text-slate-500">
                                                <CalendarDays size={15} />
                                                Due{" "}
                                                {new Date(project.deadline).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="text-xs text-slate-400">
                                            {project.createdAt
                                                ? `Created ${new Date(project.createdAt).toLocaleDateString()}`
                                                : "SkillConnect project"}
                                        </span>

                                        {isProfessional && project.status === "open" ? (
                                            <Link
                                                href="/services"
                                                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                                            >
                                                Explore services <ArrowUpRight size={16} />
                                            </Link>
                                        ) : (
                                            <span className="text-xs font-semibold text-slate-400">
                                                {isClient ? "Your project" : "Project listing"}
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <footer className="pb-4 text-center text-xs text-slate-400">
                    SkillConnect · Project workspace
                </footer>
            </div>
        </main>
    );
}