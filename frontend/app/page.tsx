"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Code2,
  Database,
  Heart,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Video,
  X,
  Zap,
} from "lucide-react";

const categories = [
  { name: "Web Development", detail: "Websites & web apps", icon: Code2, color: "bg-blue-50 text-blue-600" },
  { name: "Mobile Apps", detail: "Android & iOS apps", icon: Smartphone, color: "bg-violet-50 text-violet-600" },
  { name: "AI & Machine Learning", detail: "Intelligent solutions", icon: Sparkles, color: "bg-fuchsia-50 text-fuchsia-600" },
  { name: "Data Analytics", detail: "Insights from your data", icon: Database, color: "bg-emerald-50 text-emerald-600" },
];

const professionals = [
  {
    name: "Alex Morgan",
    role: "Full-Stack Developer",
    initials: "AM",
    color: "from-blue-500 to-indigo-600",
    skills: ["React", "Node.js", "MongoDB"],
    rating: "4.9",
    reviews: 128,
    rate: "$35",
    category: "Web Development",
    description: "I build fast, scalable web applications for growing businesses.",
  },
  {
    name: "Priya Sharma",
    role: "AI / ML Engineer",
    initials: "PS",
    color: "from-fuchsia-500 to-purple-600",
    skills: ["Python", "LLMs", "RAG"],
    rating: "5.0",
    reviews: 86,
    rate: "$45",
    category: "AI & Machine Learning",
    description: "Turning complex AI ideas into practical products.",
  },
  {
    name: "Jordan Lee",
    role: "Mobile App Developer",
    initials: "JL",
    color: "from-emerald-500 to-teal-600",
    skills: ["React Native", "Flutter", "Firebase"],
    rating: "4.8",
    reviews: 94,
    rate: "$30",
    category: "Mobile Apps",
    description: "Creating intuitive mobile experiences from idea to launch.",
  },
];

const steps = [
  {
    number: "01",
    title: "Explore talent",
    description: "Discover skilled professionals and find the right expertise for your project.",
    icon: Search,
  },
  {
    number: "02",
    title: "Connect directly",
    description: "Discuss your requirements through chat or a video call before getting started.",
    icon: MessageCircle,
  },
  {
    number: "03",
    title: "Build together",
    description: "Agree on milestones, track progress, and bring your project to life.",
    icon: BriefcaseBusiness,
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Services");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedProfessionals, setSavedProfessionals] = useState<string[]>([]);

  const filteredProfessionals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return professionals.filter((professional) => {
      const matchesCategory =
        activeCategory === "All Services" ||
        professional.category === activeCategory;

      const searchableText = [
        professional.name,
        professional.role,
        professional.category,
        professional.description,
        ...professional.skills,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [searchQuery, activeCategory]);

  function toggleSaved(name: string) {
    setSavedProfessionals((current) =>
      current.includes(name)
        ? current.filter((savedName) => savedName !== name)
        : [...current, name]
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Zap size={22} fill="currentColor" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Skill<span className="text-indigo-600">Connect</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#services" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">
              Explore services
            </a>
            <a href="#professionals" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">
              Find professionals
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">
              How it works
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Log in
            </Link>
            <Link href="/register" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700">
              Get started <ArrowRight className="ml-1 inline" size={16} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <a onClick={() => setMobileMenuOpen(false)} href="#services" className="text-sm font-medium text-slate-700">Explore services</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#professionals" className="text-sm font-medium text-slate-700">Find professionals</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#how-it-works" className="text-sm font-medium text-slate-700">How it works</a>
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold">Log in</Link>
                <Link href="/register" className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white">Get started</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white" />
        <div className="pointer-events-none absolute -right-24 top-12 -z-10 h-72 w-72 rounded-full bg-violet-100/50 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              <Sparkles size={16} />
              Your next big idea starts here
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Great work starts with{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                great people.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Find talented developers, AI engineers, and creative problem-solvers.
              Connect, collaborate, and turn your ideas into reality.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                document.getElementById("professionals")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-9 flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60 sm:flex-row sm:items-center"
            >
              <Search className="ml-3 hidden shrink-0 text-slate-400 sm:block" size={21} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Try “React developer” or “AI engineer”"
                aria-label="Search professionals"
                className="min-w-0 flex-1 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:px-1"
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Find talent <ArrowRight className="ml-1 inline" size={16} />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 sm:text-sm">
              <span className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> Discover skilled talent</span>
              <span className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> Chat and video calls</span>
              <span className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> Project milestones</span>
            </div>

            <div className="mt-9 flex items-center gap-4 border-t border-slate-200/80 pt-6">
              <div className="flex -space-x-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-xs font-bold text-blue-700">JD</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-xs font-bold text-violet-700">AS</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-xs font-bold text-emerald-700">MK</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-xs font-bold text-amber-700">+</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Ideas meet expertise</p>
                <p className="mt-0.5 text-xs text-slate-500">A better way to build together</p>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div className="absolute -left-6 top-14 h-24 w-24 rounded-full bg-violet-200/60 blur-2xl" />
            <div className="absolute -right-4 bottom-12 h-32 w-32 rounded-full bg-indigo-200/70 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white bg-gradient-to-br from-indigo-100 via-violet-50 to-slate-50 p-4 shadow-2xl shadow-indigo-100 sm:p-7">
              <div className="rounded-3xl border border-white/90 bg-white p-5 shadow-lg sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Your next project</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">The right team, right here.</h2>
                  </div>
                  <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><BriefcaseBusiness size={22} /></span>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Code2 size={23} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800">Web development</p>
                      <p className="mt-1 text-xs text-slate-500">Build your digital presence</p>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400" />
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600"><Sparkles size={23} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800">AI & machine learning</p>
                      <p className="mt-1 text-xs text-slate-500">Make ideas more intelligent</p>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400" />
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Smartphone size={23} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800">Mobile applications</p>
                      <p className="mt-1 text-xs text-slate-500">Apps people love to use</p>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400" />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
                  <span className="rounded-xl bg-white/10 p-2.5 text-indigo-200"><Video size={21} /></span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Meet your next collaborator</p>
                    <p className="mt-1 text-xs text-slate-300">Connect through chat and video</p>
                  </div>
                  <ArrowRight size={18} className="text-indigo-200" />
                </div>
              </div>

              <div className="absolute -left-4 top-8 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={22} /></span>
                <div>
                  <p className="text-sm font-bold">Built on trust</p>
                  <p className="text-xs text-slate-500">Profiles and collaboration</p>
                </div>
              </div>

              <div className="absolute -right-3 bottom-7 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500"><Star size={21} fill="currentColor" /></span>
                <div>
                  <p className="text-sm font-bold">Skills that matter</p>
                  <p className="text-xs text-slate-500">Find your perfect fit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service categories */}
      <section id="services" className="scroll-mt-24 border-y border-slate-100 bg-slate-50/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">What do you need?</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Find skills for every idea.</h2>
              <p className="mt-3 max-w-xl text-slate-600">From launching a website to building your next AI product, find the expertise to make it happen.</p>
            </div>
            <a href="#professionals" onClick={() => setActiveCategory("All Services")} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800">
              Explore professionals <ArrowRight size={17} />
            </a>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  type="button"
                  key={category.name}
                  onClick={() => {
                    setActiveCategory(category.name);
                    document.getElementById("professionals")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${category.color}`}>
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-5 font-bold text-slate-900">{category.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{category.detail}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    Explore <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured professionals */}
      <section id="professionals" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Meet the talent</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">People who make things happen.</h2>
              <p className="mt-3 max-w-xl text-slate-600">Explore sample professional profiles and find the skills your project needs.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All Services", ...categories.map((category) => category.name)].map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                    activeCategory === category
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 px-3">
              <Search size={19} className="shrink-0 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, skill, or service..."
                aria-label="Filter professional profiles"
                className="w-full py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="text-slate-400 hover:text-slate-700">
                  <X size={17} />
                </button>
              )}
            </div>
            <button type="button" onClick={() => { setSearchQuery(""); setActiveCategory("All Services"); }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Clear filters
            </button>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfessionals.map((professional) => (
              <article key={professional.name} className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/60">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${professional.color} text-lg font-extrabold text-white shadow-md`}>
                      {professional.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{professional.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{professional.role}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <BadgeCheck size={14} /> Example profile
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSaved(professional.name)}
                    aria-label={savedProfessionals.includes(professional.name) ? "Remove from saved" : "Save professional"}
                    className={`rounded-full p-2 transition ${savedProfessionals.includes(professional.name) ? "bg-rose-50 text-rose-600" : "text-slate-400 hover:bg-rose-50 hover:text-rose-600"}`}
                  >
                    <Heart size={19} fill={savedProfessionals.includes(professional.name) ? "currentColor" : "none"} />
                  </button>
                </div>

                <p className="mt-5 min-h-[48px] text-sm leading-6 text-slate-600">{professional.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {professional.skills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{skill}</span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800"><Star size={15} className="text-amber-400" fill="currentColor" /> {professional.rating} <span className="font-normal text-slate-400">({professional.reviews} reviews)</span></p>
                    <p className="mt-1 text-xs text-slate-500">Illustrative sample data</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-900">{professional.rate}<span className="text-xs font-medium text-slate-500">/hr</span></p>
                    <p className="text-xs text-slate-400">Example rate</p>
                  </div>
                </div>

                <Link href="/register" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white">
                  Connect with professional <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>

          {filteredProfessionals.length === 0 && (
            <div className="mt-7 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
              <Search size={30} className="mx-auto text-slate-400" />
              <h3 className="mt-4 font-bold text-slate-900">No matching profiles found</h3>
              <p className="mt-2 text-sm text-slate-500">Try another keyword or clear your filters.</p>
              <button type="button" onClick={() => { setSearchQuery(""); setActiveCategory("All Services"); }} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                Show all professionals
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">Simple by design</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">From idea to done, together.</h2>
            <p className="mt-4 leading-7 text-slate-400">The right collaboration can change everything. Here is how SkillConnect makes it easier.</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition hover:border-indigo-400/50 hover:bg-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold tracking-widest text-indigo-300">{step.number}</span>
                    <span className="rounded-xl bg-indigo-500/15 p-3 text-indigo-300"><Icon size={23} /></span>
                  </div>
                  <h3 className="mt-7 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 p-6 sm:flex-row sm:p-8">
            <div>
              <h3 className="text-xl font-bold sm:text-2xl">Have a project in mind?</h3>
              <p className="mt-2 text-sm text-slate-300">Start building your team today.</p>
            </div>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">
              Create your account <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-2">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><Zap size={19} fill="currentColor" /></span>
              <span className="text-lg font-extrabold tracking-tight">Skill<span className="text-indigo-600">Connect</span></span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
              Bringing clients and skilled professionals together to build meaningful digital products and turn ideas into real outcomes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Discover</h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
                <a href="#services" className="hover:text-indigo-600">Services</a>
                <a href="#professionals" className="hover:text-indigo-600">Professionals</a>
                <a href="#how-it-works" className="hover:text-indigo-600">How it works</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Get started</h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
                <Link href="/register" className="hover:text-indigo-600">Join SkillConnect</Link>
                <Link href="/login" className="hover:text-indigo-600">Log in</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Our platform</h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
                <span>Project collaboration</span>
                <span>Chat & video calls</span>
                <span>Milestone tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© {new Date().getFullYear()} SkillConnect. All rights reserved.</p>
            <p>Built to help great ideas find great people.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}