import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/components/layout/session-provider";
import { db } from "@/lib/db";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Check if email is verified
  let isEmailVerified = true;
  if (session.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { emailVerified: true },
    });
    isEmailVerified = !!user?.emailVerified;
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <AppSidebar user={session.user} />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          {!isEmailVerified && <EmailVerificationBanner email={session.user?.email || ""} />}
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
