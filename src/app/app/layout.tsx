import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/components/layout/session-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <AppSidebar user={session.user} />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
