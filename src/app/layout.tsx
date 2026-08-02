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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
