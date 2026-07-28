"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, Users, Building2, FileText, Columns3, 
  Calendar, BarChart3, Settings, Menu, X, LogOut, HardHat, MessageSquare 
} from "lucide-react";

const navItems = [
  { href: "/app/today", label: "Today", icon: LayoutDashboard },
  { href: "/app/leads", label: "Leads", icon: Users },
  { href: "/app/customers", label: "Customers", icon: Building2 },
  { href: "/app/estimates", label: "Estimates", icon: FileText },
  { href: "/app/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/app/follow-ups", label: "Follow-Ups", icon: Calendar },
  { href: "/app/templates", label: "Templates", icon: MessageSquare },
  { href: "/app/reports", label: "Reports", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b h-16 flex items-center justify-between px-4">
        <Link href="/app/today" className="flex items-center gap-2 font-bold text-primary">
          <HardHat className="h-6 w-6" /> WorkHelm
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-2 px-6 border-b">
            <HardHat className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-gray-900">WorkHelm</span>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
