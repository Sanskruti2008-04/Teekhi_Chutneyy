const statusLabels = { reported: 'Reported', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened', verified: 'Verified' };
export default function ReportCard({ report, children }) {
  return <article className="card">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="flex flex-wrap items-center gap-2"><span className="category-pill">{report.category?.replace('_', ' ')}</span><span className={`status status-${report.status}`}>{statusLabels[report.status] || report.status}</span></div>
        <h3 className="mt-3 text-lg font-bold text-slate-900">{report.title}</h3>
      </div>
      <div className="rounded-xl bg-civic-50 px-3 py-2 text-right"><div className="text-xs text-civic-700">Priority</div><strong className="text-xl text-civic-900">{Number(report.priorityScore || 0).toFixed(1)}</strong></div>
    </div>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.description}</p>
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span>Severity {report.severity}/5</span><span>{report.upvotes} upvotes</span><span>{new Date(report.createdAt).toLocaleDateString()}</span>{report.assignedTeam && <span>Team: {report.assignedTeam}</span>}</div>
    {(report.beforePhotoUrl || report.afterPhotoUrl || report.photos?.length > 0) && <div className="mt-4 grid grid-cols-2 gap-3">
      {(report.beforePhotoUrl || report.photos?.[0]) && <div><p className="mb-1 text-xs font-semibold text-slate-500">Before / report photo</p><img className="photo" src={report.beforePhotoUrl || report.photos[0]} alt={`Evidence for ${report.title}`} /></div>}
      {report.afterPhotoUrl && <div><p className="mb-1 text-xs font-semibold text-slate-500">After / resolution photo</p><img className="photo" src={report.afterPhotoUrl} alt={`Resolution evidence for ${report.title}`} /></div>}
    </div>}
    {children && <div className="mt-4 border-t border-slate-100 pt-4">{children}</div>}
  </article>;
}
