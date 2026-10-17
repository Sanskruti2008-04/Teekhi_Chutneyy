export default function PriorityTooltip({ report }) {
  const b = report.priorityBreakdown || {};
  const severity = Number(b.severity ?? report.severity * 10);
  const upvotes = Number(b.upvotes ?? report.upvotes * 2);
  const days = Number(b.daysUnresolved ?? 0);
  const reopen = Number(b.reopenBonus ?? (report.reopenedCount || 0) * 15);
  const score = Number(report.priorityScore || severity + upvotes + days * 3 + reopen);
  const formula = `Severity ${report.severity}×10 + ${report.upvotes} upvotes×2 + ${days.toFixed(1)} days×3 + reopened×15 = ${score.toFixed(1)}.`;
  return <span className="group relative inline-flex cursor-help items-center gap-1 rounded-md px-2 py-1 font-bold focus-within:outline focus-within:outline-2 focus-within:outline-cyan-600" tabIndex={0} aria-label={`Priority score ${score}. ${formula}`}>
    {score.toFixed(1)} <span aria-hidden="true">ⓘ</span>
    <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 -translate-x-1/2 rounded-lg bg-slate-950 px-3 py-2 text-left text-xs font-medium leading-5 text-white shadow-xl group-hover:block group-focus:block">{formula}</span>
  </span>;
}
