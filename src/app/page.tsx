import Link from "next/link";
import { ArrowRight, Check, BarChart3, Calendar, FileText, Users, Bell, Zap } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const benefits = [
  { icon: Users, title: "Never Lose a Lead", desc: "Every inquiry is captured and tracked so nothing slips through the cracks." },
  { icon: Calendar, title: "Automated Follow-Ups", desc: "Schedule follow-ups and get reminded exactly when to reach out." },
  { icon: FileText, title: "Estimate Tracking", desc: "Know which estimates are out, which need follow-up, and which are won." },
  { icon: BarChart3, title: "Pipeline Visibility", desc: "See your entire sales pipeline at a glance — know what's coming in." },
  { icon: Bell, title: "Daily Action Plan", desc: "Start every day with a clear list of who to contact and what to do." },
  { icon: Zap, title: "Close More Jobs", desc: "Better follow-up means more estimates turn into paying work." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    subtitle: "No credit card required",
    features: ["1 user", "Up to 5 leads", "Lead & customer management"],
    cta: "Start Free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Starter",
    price: "$29",
    subtitle: "14-day free trial",
    features: ["2 users", "Up to 250 leads", "Full pipeline & follow-ups", "Message templates", "Estimate tracking"],
    cta: "Try Free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "$59",
    subtitle: "14-day free trial",
    features: ["5 users", "Unlimited leads", "Everything in Starter", "Priority support"],
    cta: "Try Free",
    href: "/signup",
    featured: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo href="/" size="md" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900">How It Works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</Link>
            <Link href="/signup" className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
              Start Free
            </Link>
          </nav>
          {/* Mobile nav */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600">Login</Link>
            <Link href="/signup" className="inline-flex items-center px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg">Start</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 md:pt-28 md:pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight">
          Stop Losing Jobs to Poor Follow-Up
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Capture leads, track estimates, and schedule follow-ups — all in one place. Built for plumbers, electricians, roofers, and local service pros.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition text-lg">
            Start Free — No Credit Card <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">Everything you need to turn more estimates into paying work.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
                <b.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-base font-semibold text-gray-900">{b.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">Start free. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 text-center ${plan.featured ? "border-2 border-primary relative" : "border"}`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-4xl font-bold text-gray-900">
                  {plan.price}<span className="text-lg font-normal text-gray-500">/mo</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">{plan.subtitle}</p>
                <ul className="mt-6 space-y-2.5 text-sm text-gray-600 text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block w-full py-3 font-semibold rounded-lg transition text-center ${
                    plan.featured
                      ? "bg-primary text-white hover:opacity-90"
                      : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Ready to Win More Jobs?</h2>
          <p className="mt-4 text-lg opacity-90">Get started for free. No credit card required.</p>
          <Link href="/signup" className="mt-8 inline-flex items-center px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition">
            Start Free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} WorkHelm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
