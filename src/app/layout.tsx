import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WorkHelm — Run Your Business. Not Your Day.",
  description: "Stop losing jobs to poor follow-up. Capture leads, track estimates, and automate follow-ups — built for plumbers, electricians, HVAC, roofers, and local service businesses.",
  openGraph: {
    title: "WorkHelm — Run Your Business. Not Your Day.",
    description: "Stop losing jobs to poor follow-up. Capture leads, track estimates, and automate follow-ups — built for local service businesses.",
    url: "https://www.getworkhelm.com",
    siteName: "WorkHelm",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkHelm — Run Your Business. Not Your Day.",
    description: "Stop losing jobs to poor follow-up. The simple CRM for local service businesses.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Static HTML fallback for crawlers that don't execute JavaScript.
            The landing page is a React Server Component rendered as a flight payload,
            so this noscript block carries the marketing copy as real, crawlable HTML. */}
        <noscript>
          <div>
            <h1>Run Your Business. Not Your Day.</h1>
            <p>The simple follow-up tool for local service businesses. Stop losing jobs to poor follow-up.</p>
            <p><a href="/signup">Start Free — No Credit Card Required</a></p>
            <h2>How It Works</h2>
            <h3>Never Lose a Lead</h3>
            <p>Every call, text, and email captured automatically — stop losing jobs before you even quote.</p>
            <h3>Automated Follow-Ups</h3>
            <p>Never forget to follow up again. Get reminded at the right moment so more estimates turn into checks.</p>
            <h3>Estimate Tracking</h3>
            <p>Know exactly which estimates are out, who needs a nudge, and which jobs are closing.</p>
            <h3>Pipeline Visibility</h3>
            <p>See everything in one place — stop digging through notebooks and text messages to find where a job stands.</p>
            <h3>Daily Action Plan</h3>
            <p>Start every day knowing exactly who to contact. No more guessing what needs your attention.</p>
            <h3>Close More Jobs</h3>
            <p>Better follow-up means more estimates turn into paying work. That&apos;s more revenue without more leads.</p>
            <h2>Why WorkHelm?</h2>
            <h3>Never Lose a Lead</h3>
            <p>Every inquiry from every channel lands in one place.</p>
            <h3>Stay Organized</h3>
            <p>No more sticky notes, forgotten callbacks, or lost messages.</p>
            <h3>Know What Needs Follow-Up</h3>
            <p>Clear visual pipeline shows exactly which estimates need attention today.</p>
            <h3>Start Every Day with a Plan</h3>
            <p>Your Today dashboard tells you exactly who to contact and what to do.</p>
            <h3>Win More Jobs</h3>
            <p>Consistent follow-up turns more estimates into signed contracts.</p>
            <h3>Built for the Trades</h3>
            <p>No bloated CRM. Just what plumbers, electricians, HVAC, roofers, and landscapers actually need.</p>
            <h2>Trusted by Local Service Businesses</h2>
            <p>&ldquo;I used to lose track of who I needed to call back. Now I open WorkHelm and my day is already planned for me.&rdquo; — Mike R., Plumber</p>
            <p>&ldquo;The follow-up reminders alone have paid for this 10 times over. I&apos;m closing jobs I would have forgotten about.&rdquo; — Sarah T., HVAC Owner</p>
            <p>&ldquo;Simple enough that I actually use it. Does exactly what I need — tracks my leads and reminds me to follow up.&rdquo; — Dave K., Roofer</p>
            <h2>Simple, Transparent Pricing</h2>
            <h3>Free — $0/mo</h3>
            <p>No credit card required. Includes 1 user, up to 5 leads, and lead &amp; customer management.</p>
            <h3>Starter — $29/mo (Most Popular)</h3>
            <p>14-day free trial. Includes 2 users, up to 250 leads, full pipeline &amp; follow-ups, message templates, and estimate tracking.</p>
            <h3>Pro — $59/mo</h3>
            <p>14-day free trial. Includes 5 users, unlimited leads, everything in Starter, and priority support.</p>
            <p>Ready to Win More Jobs? <a href="/signup">Start Free — No Credit Card Required</a></p>
          </div>
        </noscript>
      </body>
    </html>
  );
}
