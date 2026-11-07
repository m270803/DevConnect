"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, UserRound, BriefcaseBusiness, ArrowRight } from "lucide-react";
import { apiRequest } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/users/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });

      router.push("/login?registered=1");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Zap size={23} fill="currentColor" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            Skill<span className="text-indigo-600">Connect</span>
          </span>
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Join SkillConnect and start building together.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_]+"
                title="Use 3–30 letters, numbers, or underscores."
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="Choose a username"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
              <p className="mt-1 text-xs text-slate-500">
                Use 3–30 letters, numbers, or underscores.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                I want to join as
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField("role", "client")}
                  className={`rounded-xl border p-4 text-left transition ${
                    form.role === "client"
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <UserRound
                    size={21}
                    className={form.role === "client" ? "text-indigo-600" : "text-slate-500"}
                  />
                  <span className="mt-2 block text-sm font-bold">Client</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Hire professionals
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField("role", "professional")}
                  className={`rounded-xl border p-4 text-left transition ${
                    form.role === "professional"
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <BriefcaseBusiness
                    size={21}
                    className={form.role === "professional" ? "text-indigo-600" : "text-slate-500"}
                  />
                  <span className="mt-2 block text-sm font-bold">Professional</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Find projects
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder="Enter your password again"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={17} className="ml-2 inline" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
              Log in
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          By creating an account, you agree to use SkillConnect responsibly.
        </p>
      </div>
    </main>
  );
}