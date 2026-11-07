"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Code2,
  MessageCircle,
  FileText,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  Plus,
  Users,
  Clock3,
  CheckCircle2,
  Zap,
  Menu,
  X,
  UserRound,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

type User = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type ApiResponse = {
  user?: User;
  data?: User | { user?: User };
  success?: boolean;
  message?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const result = await apiRequest<ApiResponse>("/users/me");

        const data = result.data;
        const currentUser =
          result.user ??
          (data && "user" in data ? data.user : data);

        if (active && currentUser && typeof currentUser === "object") {
          setUser(currentUser);
        } else if (active) {
          setError("Your account details could not be loaded.");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to your account."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const role = user?.role?.toLowerCase() || "client";
  const isProfessional = role === "professional";
  const isAdmin = role === "admin";

  const displayName = user?.name?.trim() || "there";
  const firstName = displayName.split(" ")[0];

  const menuItems = [
    { label: "Overview", href: "#overview", icon: LayoutDashboard },
    { label: "Projects", href: "#projects", icon: BriefcaseBusiness },
    {
      label: isProfessional ? "My Services" : "Explore Services",
      href: "#services",
      icon: Code2,
    },
    { label: "Messages", href: "#messages", icon: MessageCircle },
    { label: "Contracts", href: "#contracts", icon: FileText },
  ];

  if (isAdmin) {
    menuItems.splice(1, 0, {
      label: "Manage Users",
      href: "#users",
      icon: Users,
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Zap size={24} fill="currentColor" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading your workspace...
          </p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck size={35} className="mx-auto text-indigo-600" />
          <h1 className="mt-4 text-2xl font-extrabold">
            Unable to load dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error || "Please log in to access your workspace."}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Return to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Zap size={20} fill="currentColor" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Skill<span className="text-indigo-600">Connect</span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <nav className="mt-3 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
                  )}
                </a>
              );
            })}
          </nav>

          <p className="mt-9 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Account
          </p>

          <nav className="mt-3 space-y-1">
            <a
              href="#profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <UserRound size={19} />
              My profile
            </a>
            <a
              href="#settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings size={19} />
              Settings
            </a>
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Zap size={19} />
            </div>
            <p className="mt-3 text-sm font-bold">Build something great</p>
            <p className="mt-1 text-xs leading-5 text-indigo-100">
              Connect with people who can bring your ideas to life.
            </p>
            <a
              href="#projects"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              Explore workspace <ArrowUpRight size={15} />
            </a>
          </div>

          <Link
            href="/"
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut size={18} />
            Back to homepage
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-xs text-slate-400">Workspace</p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">
                Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/"
              aria-label="Go to homepage"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:flex"
            >
              <Search size={16} />
              Explore
            </Link>

            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-5">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {user.name || "SkillConnect Member"}
                </p>
                <p className="mt-0.5 text-xs capitalize text-slate-500">
                  {role}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-sm font-extrabold text-indigo-700">
                {displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
          {/* Welcome banner */}
          <section
            id="overview"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white sm:p-9"
          >
            <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />

            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-indigo-50">
                <Zap size={14} />
                Your SkillConnect workspace
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Welcome back, {firstName}!
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
                {isAdmin
                  ? "Manage your platform and keep SkillConnect running smoothly."
                  : isProfessional
                    ? "Your next opportunity starts here. Showcase your skills, discover projects, and connect with clients."
                    : "Ready to bring your next idea to life? Discover skilled professionals and turn your plans into real projects."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#projects"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
                >
                  {isProfessional ? "View my projects" : "Explore workspace"}
                  <ArrowUpRight size={17} />
                </a>
                <a
                  href="#profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  View my profile
                </a>
              </div>
            </div>
          </section>

          {/* Account summary */}
          <section>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Your workspace
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your account details and project shortcuts.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Account loaded
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Account type
                  </span>
                  <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <UserRound size={20} />
                  </span>
                </div>
                <p className="mt-4 text-xl font-extrabold capitalize">
                  {role}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Your registered role
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Projects
                  </span>
                  <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <BriefcaseBusiness size={20} />
                  </span>
                </div>
                <p className="mt-4 text-xl font-extrabold">—</p>
                <p className="mt-1 text-xs text-slate-400">
                  Live count coming next
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Messages
                  </span>
                  <span className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                    <MessageCircle size={20} />
                  </span>
                </div>
                <p className="mt-4 text-xl font-extrabold">—</p>
                <p className="mt-1 text-xs text-slate-400">
                  Live count coming next
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Contracts
                  </span>
                  <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <FileText size={20} />
                  </span>
                </div>
                <p className="mt-4 text-xl font-extrabold">—</p>
                <p className="mt-1 text-xs text-slate-400">
                  Live count coming next
                </p>
              </div>
            </div>
          </section>

          {/* Main workspace cards */}
          <section id="projects" className="scroll-mt-24">
            <div className="mb-5">
              <h2 className="text-xl font-extrabold tracking-tight">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jump straight into what you want to do.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <BriefcaseBusiness size={24} />
                </span>
                <h3 className="mt-5 font-bold">
                  {isProfessional ? "Find opportunities" : "Manage projects"}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {isProfessional
                    ? "Explore available work and keep track of your project commitments."
                    : "Create projects, review proposals, and keep your work organized."}
                </p>
                <Link
                  href="/projects"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Open projects <ArrowUpRight size={16} />
                </Link>
              </article>

              <article id="services" className="scroll-mt-24 group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Code2 size={24} />
                </span>
                <h3 className="mt-5 font-bold">
                  {isProfessional ? "Manage your services" : "Explore services"}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {isProfessional
                    ? "Showcase your expertise and describe the services you offer."
                    : "Find professionals with the technical skills your idea needs."}
                </p>
                <Link
                  href="/services"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {isProfessional ? "My services" : "Browse services"}{" "}
                  <ArrowUpRight size={16} />
                </Link>
              </article>

              <article id="messages" className="scroll-mt-24 group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <MessageCircle size={24} />
                </span>
                <h3 className="mt-5 font-bold">Messages & calls</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  Discuss project requirements, collaborate in chat, and prepare
                  for video calls.
                </p>
                <Link
                  href="/messages"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Open messages <ArrowUpRight size={16} />
                </Link>
              </article>

              <article id="contracts" className="scroll-mt-24 group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <FileText size={24} />
                </span>
                <h3 className="mt-5 font-bold">Contracts & milestones</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  Review agreements and follow the progress of project milestones.
                </p>
                <Link
                  href="/contracts"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  View contracts <ArrowUpRight size={16} />
                </Link>
              </article>

{isProfessional && (
  <article className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
      <FileText size={24} />
    </span>

    <h3 className="mt-5 font-bold">My Proposals</h3>

    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
      Track your submitted proposals, review client decisions, and
      check which opportunities have been accepted.
    </p>

    <Link
      href="/my-proposals"
      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
    >
      View my proposals <ArrowUpRight size={16} />
    </Link>
  </article>
)}

              <article id="profile" className="scroll-mt-24 group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <UserRound size={24} />
                </span>
                <h3 className="mt-5 font-bold">Your profile</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {isProfessional
                    ? "Present your skills, experience, and professional background."
                    : "Keep your account information and preferences up to date."}
                </p>
                <Link
                  href="/profile"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  View profile <ArrowUpRight size={16} />
                </Link>
              </article>

              <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Clock3 size={24} />
                </span>
                <h3 className="mt-5 font-bold">Getting started</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  Your workspace is ready. Build out your profile and explore
                  the available features.
                </p>
                <a
                  href="#overview"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Back to overview <ArrowUpRight size={16} />
                </a>
              </article>
            </div>
          </section>

          {/* Account details */}
          <section id="settings" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <UserRound size={26} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold">Account information</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Details retrieved from your authenticated backend session.
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                Connected to API
              </span>
            </div>

            <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Full name
                </p>
                <p className="mt-2 break-words text-sm font-bold">
                  {user.name || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email address
                </p>
                <p className="mt-2 break-all text-sm font-bold">
                  {user.email || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Account role
                </p>
                <p className="mt-2 text-sm font-bold capitalize">{role}</p>
              </div>
            </div>
          </section>

          <footer className="pb-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SkillConnect · Built for better collaboration
          </footer>
        </div>
      </div>
    </main>
  );
}