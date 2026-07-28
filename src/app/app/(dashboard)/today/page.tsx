import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { HardHat, Users, Calendar, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Real database queries
  const [newLeads, followUpsDue, overdueFollowUps, estimatesPending] = await Promise.all([
    // New leads not yet contacted
    db.lead.count({
      where: { userId, status: "NEW" },
    }),
    // Follow-ups due today
    db.followUp.count({
      where: {
        userId,
        status: "OPEN",
        dueAt: { gte: today, lt: tomorrow },
      },
    }),
    // Overdue follow-ups
    db.followUp.count({
      where: {
        userId,
        status: "OPEN",
        dueAt: { lt: today },
      },
    }),
    // Estimates awaiting response
    db.estimate.count({
      where: {
        userId,
        status: { in: ["SENT", "FOLLOW_UP_DUE"] },
      },
    }),
  ]);

  const stats = [
    { label: "New Leads", value: newLeads, color: "bg-blue-50 text-blue-700", icon: Users },
    { label: "Follow-Ups Due", value: followUpsDue, color: "bg-amber-50 text-amber-700", icon: Calendar },
    { label: "Overdue", value: overdueFollowUps, color: "bg-red-50 text-red-700", icon: AlertTriangle },
    { label: "Estimates Pending", value: estimatesPending, color: "bg-green-50 text-green-700", icon: FileText },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Today</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color.split(" ")[1]}`} />
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/app/leads/new" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90">
            New Lead
          </Link>
          <Link href="/app/follow-ups/new" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90">
            Schedule Follow-Up
          </Link>
          <Link href="/app/estimates/new" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90">
            Create Estimate
          </Link>
        </div>
      </div>
    </div>
  );
}
