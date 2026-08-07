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
const SIGN_UP_URL = "https://workhelm-seven.vercel.app/signup";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why WorkHelm?", href: "#why-workhelm" },
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
          <a href={SIGN_IN_URL} className={linkClass}>
            Login
          </a>
          <a
            href={SIGN_UP_URL}
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
              href={SIGN_UP_URL}
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

const steps = [
  {
    title: "Capture Every Lead",
    description:
      "Add a new lead manually or from a contact form. All new leads are stored in one place.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
      </svg>
    ),
  },
  {
    title: "Send Professional Estimates",
    description:
      "Create and send estimates in minutes. Track when they are sent and viewed.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: "Automate Follow-Ups",
    description:
      "Schedule follow-ups or let WorkHelm remind you. Never let an estimate go cold.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    title: "Keep Customers Organized",
    description:
      "Store customer information, notes, estimates, and history. Everything is searchable and easy to find.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "Track Your Pipeline",
    description:
      "View every opportunity from New Lead to Won. Instantly see what needs attention.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16l-6.5 7.5V19l-3 1.5v-8L4 5z" />
      </svg>
    ),
  },
  {
    title: "Win More Jobs",
    description:
      "Better follow-up leads to more accepted estimates. More organization means more revenue.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10v4.5a5 5 0 01-10 0V4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 5.5H5.5a2.75 2.75 0 003.5 3M17 5.5h1.5a2.75 2.75 0 01-3.5 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v4M9 17h6M8 21h8" />
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
            href={SIGN_UP_URL}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            See How It Works
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-400">14-day free trial. No credit card required.</p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 sm:text-4xl">
            Simple Steps. More Jobs Won.
          </h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            WorkHelm makes it easy to capture leads, follow up, and close more work—all in one simple platform.
          </p>

          {/* Timeline: horizontal flow on desktop, stacked on mobile */}
          <div className="relative mt-16">
            {/* Desktop connecting line (behind the numbered circles) */}
            <div
              aria-hidden="true"
              className="absolute top-7 left-[8.33%] right-[8.33%] hidden lg:block border-t-2 border-dashed border-blue-200"
            />

            <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative flex items-start gap-4 lg:block"
                >
                  {/* Mobile vertical connector to the next step */}
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-7 top-14 bottom-[-2.5rem] w-0.5 bg-blue-200 sm:hidden"
                    />
                  )}

                  {/* Numbered circle (blue bg, white text) */}
                  <div className="relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-sm ring-4 ring-gray-50 lg:mx-auto">
                    {index + 1}
                  </div>

                  {/* Desktop arrow connector between steps */}
                  {index < steps.length - 1 && (
                    <svg
                      aria-hidden="true"
                      className="absolute -right-4 top-5 hidden h-4 w-4 text-blue-300 lg:block"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  )}

                  <div className="flex-1 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:mt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 lg:mx-auto">
                      {step.icon}
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-gray-900 lg:text-center">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 lg:text-center">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Ready to stop losing leads?
            </h3>
            <a
              href={SIGN_UP_URL}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Start Your Free Trial
            </a>
          </div>
        </div>
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
      <section id="why-workhelm" className="px-6 py-24 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 sm:text-4xl">
            Why WorkHelm?
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
                href={`${SIGN_UP_URL}?plan=starter`}
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
                href={`${SIGN_UP_URL}?plan=pro`}
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
            href={SIGN_UP_URL}
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
