export default function SLABadge({ report }) {
  if (!report.slaDeadline) return <span className="text-xs text-slate-500">SLA not set</span>;
  if (report.slaBreached) return <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-800" role="status">SLA BREACHED</span>;
  return <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Within SLA</span>;
}
