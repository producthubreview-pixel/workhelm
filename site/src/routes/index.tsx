import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

const SIGN_IN_URL = "https://workhelm-seven.vercel.app/login";

const navLinks = [
  { label: "How It Works", href: "#benefits" },
  { label: "Why WorkHelm?", href: "#benefits" },
  { label: "Pricing", href: "#pricing" },
  { label: "Demo", href: "#demo" },
];

function Logo() {
  return (
    <a href="#top" className="flex shrink-0 items-center" aria-label="WorkHelm — back to top">
      <img src="/logo.png" alt="WorkHelm" className="h-8 w-auto" />
    </a>
  );
}

function Nav({ businessName }: { businessName: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass =
    "text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors";

  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl transition-shadow ${
        scrolled ? "shadow-md shadow-slate-900/5" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
          <a href="/login" className={linkClass}>
            Login
          </a>
          <a
            href="/signup"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Start Free
          </a>
        </nav>

        {/* Mobile: hamburger toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-slate-200/70 bg-white px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
            <a
              href={SIGN_IN_URL}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Login
            </a>
            <a
              href="/signup"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-blue-600 px-3 py-2.5 text-center text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Start Free
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

const benefits = [
  {
    title: "Never forget a lead",
    description:
      "Every lead lands in one place. No more sticky notes, missed calls, or lost messages.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Track every estimate",
    description:
      "Know exactly which estimates are out, when they expire, and who needs a follow-up.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "Know who needs follow-up",
    description:
      "Your Today dashboard shows exactly what needs attention — follow-ups due, overdue, and new leads.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Keep customer details organized",
    description:
      "Names, addresses, history, estimates — everything about a customer in one searchable place.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "See your opportunities in one place",
    description:
      "A simple pipeline view shows every job from new lead to won — so nothing slips through.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: "Turn more estimates into jobs",
    description:
      "Better follow-up means more accepted estimates. Our customers win more work, plain and simple.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

function Home() {
  const businessName = Route.useLoaderData();
  return (
    <div id="top" className="min-h-dvh">
      <Nav businessName={businessName} />

      {/* Hero */}
      <section className="px-6 pt-20 pb-24 max-w-4xl mx-auto text-center">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 mb-6">
          Built for local service businesses
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-tight">
          Win More Jobs Without Letting Follow-Up Fall Through the Cracks
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          WorkHelm helps local service businesses organize leads, track estimates,
          and know exactly who needs a follow-up — so more estimates turn into paying work.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </a>
          <a
            href="#benefits"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            See How It Works
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-400">14-day free trial. No credit card required.</p>
      </section>

      {/* Demo */}
      <section id="demo" className="px-6 py-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 sm:text-4xl">
            See WorkHelm in Action
          </h2>
          <div className="mt-10 aspect-video overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/QnSN9RZzfyA"
              title="See WorkHelm in Action"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="px-6 py-24 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 sm:text-4xl">
            Everything you need to stay on top of follow-up
          </h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            Stop losing jobs because a follow-up slipped your mind. WorkHelm keeps every lead,
            estimate, and customer organized in one simple tool.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  {b.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{b.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 sm:text-4xl">
            Simple, predictable pricing
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Start your 14-day free trial. Upgrade anytime.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 max-w-2xl mx-auto">
            {/* Starter */}
            <div className="rounded-2xl border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
              <p className="mt-2 text-sm text-gray-600">For solo operators getting organized.</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-gray-500">/month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  1 user
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Up to 250 leads &amp; customers
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Lead &amp; customer tracking
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Estimate tracking &amp; follow-ups
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Today dashboard &amp; pipeline
                </li>
              </ul>
              <a
                href="/signup?plan=starter"
                className="mt-8 block text-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </a>
            </div>
            {/* Pro */}
            <div className="rounded-2xl border-2 border-blue-600 p-8 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <p className="mt-2 text-sm text-gray-600">For growing teams that need more.</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$59</span>
                <span className="text-gray-500">/month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Up to 5 users
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Unlimited leads &amp; customers
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Team assignments
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Custom templates &amp; expanded reports
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Priority support
                </li>
              </ul>
              <a
                href="/signup?plan=pro"
                className="mt-8 block text-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Take Control of Your Follow-Up and Win More Jobs
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
            Stop letting follow-up slip through the cracks. Start your free trial and see how WorkHelm helps you close more work.
          </p>
          <a
            href="/signup"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50 transition-colors"
          >
            Start Your 14-Day Free Trial
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-white">{businessName || "WorkHelm"}</span>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} WorkHelm. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
