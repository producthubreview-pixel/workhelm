import Link from "next/link";
import { ArrowRight, CheckCircle, BarChart3, Calendar, FileText, Users, Bell, Zap } from "lucide-react";

const benefits = [
  { icon: Users, title: "Never Lose a Lead", desc: "Every inquiry is captured and tracked so nothing slips through the cracks." },
  { icon: Calendar, title: "Automated Follow-Ups", desc: "Schedule follow-ups and get reminded exactly when to reach out." },
  { icon: FileText, title: "Estimate Tracking", desc: "Know which estimates are out, which need follow-up, and which are won." },
  { icon: BarChart3, title: "Pipeline Visibility", desc: "See your entire sales pipeline at a glance — know what's coming in." },
  { icon: Bell, title: "Daily Action Plan", desc: "Start every day with a clear list of who to contact and what to do." },
  { icon: Zap, title: "Close More Jobs", desc: "Better follow-up means more estimates turn into paying work." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-primary">WorkHelm</Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign In</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto">
          Win More Jobs Without Letting Follow-Up Fall Through the Cracks
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          WorkHelm helps small service businesses capture leads, track estimates, schedule follow-ups, and close more deals — all in one simple app.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition">
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <a href="#benefits" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
            See How It Works
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything You Need to Close More Jobs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
                <b.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">{b.title}</h3>
                <p className="mt-2 text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="border rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900">Free</h3>
              <p className="mt-4 text-4xl font-bold text-gray-900">$0<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <p className="mt-2 text-xs text-gray-500">No credit card required</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 text-left">
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> 1 user</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Up to 25 leads</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Lead & customer management</li>
              </ul>
              <Link href="/signup" className="mt-8 block w-full py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition text-center">Get Started Free</Link>
            </div>
            {/* Starter */}
            <div className="border rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900">Starter</h3>
              <p className="mt-4 text-4xl font-bold text-gray-900">$29<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <p className="mt-2 text-xs text-gray-500">14-day free trial</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 text-left">
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> 1 user</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Up to 250 leads</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Full pipeline & follow-ups</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Message templates</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Estimate tracking</li>
              </ul>
              <Link href="/signup" className="mt-8 block w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition text-center">Start 14-Day Free Trial</Link>
            </div>
            {/* Pro */}
            <div className="border-2 border-primary rounded-xl p-6 text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
              <h3 className="text-lg font-bold text-gray-900">Pro</h3>
              <p className="mt-4 text-4xl font-bold text-gray-900">$59<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <p className="mt-2 text-xs text-gray-500">14-day free trial</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 text-left">
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Up to 5 users</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Unlimited leads</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Everything in Starter</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> Priority support</li>
              </ul>
              <Link href="/signup" className="mt-8 block w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition text-center">Start 14-Day Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Take Control of Your Follow-Up and Win More Jobs</h2>
          <p className="mt-4 text-lg opacity-90">Start your 14-day free trial. No credit card required.</p>
          <Link href="/signup" className="mt-8 inline-flex items-center px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition">
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
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
