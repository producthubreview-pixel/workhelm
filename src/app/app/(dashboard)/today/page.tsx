import { HardHat } from "lucide-react";

export default function TodayPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Today</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{label:"New Leads",value:"0",color:"bg-blue-50 text-blue-700"},
          {label:"Follow-Ups Due",value:"0",color:"bg-amber-50 text-amber-700"},
          {label:"Overdue",value:"0",color:"bg-red-50 text-red-700"},
          {label:"Estimates Pending",value:"0",color:"bg-green-50 text-green-700"}].map((stat,i)=>(
          <div key={i} className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {["New Lead","Schedule Follow-Up","Create Estimate"].map(a=>(
            <button key={a} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90">{a}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
