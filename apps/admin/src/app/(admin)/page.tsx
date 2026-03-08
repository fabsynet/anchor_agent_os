export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Overview of all agencies and platform metrics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {['Total Agencies', 'Active Users', 'Total Policies', 'Monthly Revenue'].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border border-[#334155] bg-[#1e293b] p-6"
            >
              <p className="text-sm font-medium text-[#94a3b8]">{label}</p>
              <p className="mt-2 text-2xl font-bold text-white">--</p>
              <p className="mt-1 text-xs text-[#64748b]">Loading metrics...</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
