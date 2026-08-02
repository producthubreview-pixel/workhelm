import Link from "next/link";
import { ArrowRight, BarChart3, Bell, Calendar, Check, ChevronDown, FileText, LayoutDashboard, Plus, Search, Settings, Users, Zap } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-static";

const benefits = [
  { icon: Users, title: "Never Lose a Lead", desc: "Every call, text, and email captured automatically — stop losing jobs before you even quote." },
  { icon: Calendar, title: "Automated Follow-Ups", desc: "Never forget to follow up again. Get reminded at the right moment so more estimates turn into checks." },
  { icon: FileText, title: "Estimate Tracking", desc: "Know exactly which estimates are out, who needs a nudge, and which jobs are closing." },
  { icon: BarChart3, title: "Pipeline Visibility", desc: "See everything in one place — stop digging through notebooks and text messages to find where a job stands." },
  { icon: Bell, title: "Daily Action Plan", desc: "Start every day knowing exactly who to contact. No more guessing what needs your attention." },
  { icon: Zap, title: "Close More Jobs", desc: "Better follow-up means more estimates turn into paying work. That's more revenue without more leads." },
];

const plans = [
  { name: "Free", price: "$0", subtitle: "No credit card required", features: ["1 user", "Up to 5 leads", "Lead & customer management"], cta: "Start Free", href: "/signup", featured: false },
  { name: "Starter", price: "$29", subtitle: "14-day free trial", features: ["2 users", "Up to 250 leads", "Full pipeline & follow-ups", "Message templates", "Estimate tracking"], cta: "Try Free", href: "/signup", featured: true },
  { name: "Pro", price: "$59", subtitle: "14-day free trial", features: ["5 users", "Unlimited leads", "Everything in Starter", "Priority support"], cta: "Try Free", href: "/signup", featured: false },
];

const trustItems = [
  [Zap, "Setup in Under 5 Minutes"],
  [Check, "No Credit Card Required"],
  [Users, "Built for Local Service Businesses"],
  [Check, "Cancel Anytime"],
] as const;

const columns = [
  { title: "New Lead", color: "bg-blue-500", cards: [["Mike's Plumbing", "Kitchen faucet repair", "$850"]] },
  { title: "Estimate Sent", color: "bg-violet-500", cards: [["Sarah Johnson", "AC replacement", "$4,200"], ["Greenway Lawn Care", "Monthly service", "$480"]] },
  { title: "Follow-Up", color: "bg-amber-500", cards: [["Oak Street Dental", "Commercial HVAC", "$7,500"]] },
  { title: "Won", color: "bg-emerald-500", cards: [["Tom's Electric", "Panel upgrade", "$2,100"]] },
];

const whyItems = [
  { title: "Never Lose a Lead", desc: "Every inquiry from every channel lands in one place." },
  { title: "Stay Organized", desc: "No more sticky notes, forgotten callbacks, or lost messages." },
  { title: "Know What Needs Follow-Up", desc: "Clear visual pipeline shows exactly which estimates need attention today." },
  { title: "Start Every Day with a Plan", desc: "Your Today dashboard tells you exactly who to contact and what to do." },
  { title: "Win More Jobs", desc: "Consistent follow-up turns more estimates into signed contracts." },
  { title: "Built for the Trades", desc: "No bloated CRM. Just what plumbers, electricians, HVAC, roofers, and landscapers actually need." },
];

const testimonials = [
  { quote: "I used to lose track of who I needed to call back. Now I open WorkHelm and my day is already planned for me.", name: "Mike R.", trade: "Plumber" },
  { quote: "The follow-up reminders alone have paid for this 10 times over. I'm closing jobs I would have forgotten about.", name: "Sarah T.", trade: "HVAC Owner" },
  { quote: "Simple enough that I actually use it. Does exactly what I need — tracks my leads and reminds me to follow up.", name: "Dave K.", trade: "Roofer" },
];

function DashboardPreview() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8" aria-label="WorkHelm dashboard preview">
      <div className="absolute inset-x-12 top-10 h-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_30px_90px_-28px_rgba(37,99,235,0.35)] [transform:perspective(1600px)_rotateX(2deg)]">
        <div className="flex h-10 items-center gap-2 border-b bg-slate-50/90 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="mx-auto hidden w-1/3 rounded-md bg-white px-3 py-1 text-[9px] text-slate-400 shadow-sm sm:block">app.workhelm.com/today</div>
        </div>
        <div className="flex min-h-[430px] bg-slate-50/60">
          <aside className="hidden w-48 shrink-0 border-r bg-slate-950 p-4 text-slate-400 sm:block">
            <div className="mb-8 flex items-center gap-2 text-sm font-bold text-white"><span className="grid h-6 w-6 place-items-center rounded-md bg-blue-500 text-xs">W</span> WorkHelm</div>
            <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
            {["Today", "Leads", "Customers", "Estimates", "Pipeline", "Follow-Ups"].map((item, i) => <div key={item} className={`mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-[11px] ${i === 0 ? "bg-blue-500/15 font-semibold text-blue-300" : ""}`}><LayoutDashboard className="h-3.5 w-3.5" />{item}</div>)}
            <div className="mt-12 flex items-center gap-2 px-2 text-[11px]"><Settings className="h-3.5 w-3.5" /> Settings</div>
          </aside>
          <main className="min-w-0 flex-1 p-4 sm:p-7">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-medium text-slate-400">Tuesday, October 24</p><h3 className="text-lg font-bold text-slate-900 sm:text-xl">Good morning, Alex <span aria-hidden="true">👋</span></h3></div><div className="flex items-center gap-2"><button className="hidden rounded-md border bg-white p-2 text-slate-400 sm:block"><Search className="h-3.5 w-3.5" /></button><button className="rounded-md bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white shadow-sm"><Plus className="mr-1 inline h-3 w-3" /> Add lead</button></div></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[ ["New Leads", "12", "+24%", "bg-blue-50 text-blue-600"], ["Follow-Ups", "8", "3 due today", "bg-amber-50 text-amber-600"], ["Estimates", "$18.4k", "6 pending", "bg-violet-50 text-violet-600"], ["Pipeline Value", "$42.8k", "+12%", "bg-emerald-50 text-emerald-600"] ].map(([label, value, change, style]) => <div key={label} className="rounded-xl border bg-white p-3 shadow-sm sm:p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-medium text-slate-500">{label}</span><span className={`rounded-md p-1.5 ${style}`}><BarChart3 className="h-3 w-3" /></span></div><p className="text-lg font-bold text-slate-900 sm:text-xl">{value}</p><p className="mt-1 text-[9px] text-emerald-600">{change}</p></div>)}
            </div>
            <div className="mt-5 rounded-xl border bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><h4 className="text-xs font-bold text-slate-800">Your pipeline</h4><span className="flex items-center gap-1 text-[9px] text-slate-400">This month <ChevronDown className="h-3 w-3" /></span></div><div className="grid min-w-[600px] grid-cols-4 gap-3">{columns.map((column) => <div key={column.title}><div className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${column.color}`} />{column.title}<span className="ml-auto text-slate-300">{column.cards.length}</span></div>{column.cards.map(([name, detail, amount]) => <div key={name} className="mb-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5"><p className="truncate text-[10px] font-semibold text-slate-700">{name}</p><p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p><p className="mt-2 text-[10px] font-bold text-slate-600">{amount}</p></div>)}</div>)}</div></div>
          </main>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return <div className="min-h-screen bg-white">
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Logo href="/" size="md" /><nav className="hidden items-center gap-8 md:flex"><a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900">How It Works</a><a href="#why-workhelm" className="text-sm font-medium text-gray-600 hover:text-gray-900">Why WorkHelm?</a><a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a><Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</Link><Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">Start Free</Link></nav><div className="flex items-center gap-3 md:hidden"><Link href="/login" className="text-sm font-medium text-gray-600">Login</Link><Link href="/signup" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white">Start</Link></div></div></header>

    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#eff6ff_0%,#fff_52%)] px-4 pb-12 pt-12 text-center sm:px-6 md:pb-16 md:pt-16"><div className="mx-auto max-w-4xl"><p className="mb-3 text-4xl font-extrabold tracking-[-0.02em] sm:text-5xl md:text-6xl"><span style={{color:"#1E293B"}}>Work</span><span style={{color:"#2563EB"}}>Helm</span></p><p className="mb-16 text-xs font-bold uppercase tracking-[0.18em] sm:text-sm" style={{color:"#2563EB"}}>AI Business Operating System for Local Service Businesses</p><h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-6xl md:text-7xl">Run Your Business<br className="hidden sm:block" /> Not Your Day</h1><p className="mx-auto mt-7 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Capture every lead, send estimates, automate follow-ups, and keep every job moving from one simple dashboard. Built specifically for plumbers, electricians, HVAC, roofers, landscapers, cleaners, painters, and other local service businesses.</p><div className="mt-9"><Link href="/signup" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700">Start Free — No Credit Card Required <ArrowRight className="ml-2 h-5 w-5" /></Link></div><div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">{trustItems.map(([Icon, text]) => <div key={text} className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500"><Icon className="h-4 w-4 shrink-0 text-blue-600" />{text}</div>)}</div></div></section>
    <DashboardPreview />

    <section id="how-it-works" className="bg-gray-50 py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="mb-4 text-center text-3xl font-bold text-gray-900">How It Works</h2><p className="mx-auto mb-12 max-w-xl text-center text-gray-500">Everything you need to turn more estimates into paying work.</p><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{benefits.map((b, i) => <div key={i} className="rounded-xl border bg-white p-6 shadow-sm"><b.icon className="mb-4 h-8 w-8 text-primary" /><h3 className="text-base font-semibold text-gray-900">{b.title}</h3><p className="mt-1 text-sm text-gray-500">{b.desc}</p></div>)}</div></div></section>
    <section id="why-workhelm" className="py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="mb-4 text-center text-3xl font-bold text-gray-900">Why WorkHelm?</h2><p className="mx-auto mb-12 max-w-xl text-center text-gray-500">Built for owners who want to win more jobs without working more hours.</p><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{whyItems.map((item) => <div key={item.title} className="flex gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10"><Check className="h-4 w-4 text-primary" /></span><div><h3 className="text-base font-semibold text-gray-900">{item.title}</h3><p className="mt-1 text-sm text-gray-500">{item.desc}</p></div></div>)}</div></div></section>
    <section className="bg-gray-50 py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="mb-4 text-center text-3xl font-bold text-gray-900">Trusted by Local Service Businesses</h2><p className="mx-auto mb-12 max-w-xl text-center text-gray-500">Join the tradespeople who use WorkHelm every day to stay on top of their work.</p><div className="grid gap-6 md:grid-cols-3">{testimonials.map((t) => <div key={t.name} className="rounded-xl border bg-white p-6 shadow-sm"><p className="text-sm italic leading-6 text-gray-600">&ldquo;{t.quote}&rdquo;</p><p className="mt-4 text-sm font-semibold text-gray-900">{t.name}</p><p className="text-xs text-gray-500">{t.trade}</p></div>)}</div></div></section>
    <section id="pricing" className="py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="mb-4 text-center text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2><p className="mx-auto mb-12 max-w-xl text-center text-gray-500">Start free. Upgrade when you're ready.</p><div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">{plans.map((plan) => <div key={plan.name} className={`rounded-xl p-6 text-center ${plan.featured ? "relative border-2 border-primary" : "border"}`}>{plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">Most Popular</span>}<h3 className="text-lg font-bold text-gray-900">{plan.name}</h3><p className="mt-4 text-4xl font-bold text-gray-900">{plan.price}<span className="text-lg font-normal text-gray-500">/mo</span></p><p className="mt-1 text-xs text-gray-500">{plan.subtitle}</p><ul className="mt-6 space-y-2.5 text-left text-sm text-gray-600">{plan.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {f}</li>)}</ul><Link href={plan.href} className={`mt-8 block w-full rounded-lg py-3 text-center font-semibold transition ${plan.featured ? "bg-primary text-white hover:opacity-90" : "border-2 border-primary text-primary hover:bg-primary hover:text-white"}`}>{plan.cta}</Link></div>)}</div></div></section>
    <section className="bg-primary py-20 text-center text-white"><div className="mx-auto max-w-3xl px-4"><h2 className="text-3xl font-bold">Ready to Win More Jobs?</h2><p className="mt-4 text-lg opacity-90">Get started for free. No credit card required.</p><Link href="/signup" className="mt-8 inline-flex items-center rounded-lg bg-white px-8 py-4 font-bold text-primary transition hover:bg-gray-100">Start Free <ArrowRight className="ml-2 h-5 w-5" /></Link></div></section>
    <footer className="bg-gray-900 py-12 text-gray-400"><div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"><p className="text-sm">&copy; {new Date().getFullYear()} WorkHelm. All rights reserved.</p></div></footer>
  </div>;
}
