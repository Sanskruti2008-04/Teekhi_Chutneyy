import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api, uploadImage } from '../api';
import PriorityTooltip from '../components/PriorityTooltip';
import SLABadge from '../components/SLABadge';
import ReportCard from '../components/ReportCard';

const statusLabel = s => ({ reported: 'Reported', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened', verified: 'Verified' }[s] || s);
export default function AdminDashboard({ onDataChanged }) {
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState({});
  const [photos, setPhotos] = useState({});
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api('/admin/reports'); setReports((data.reports || []).sort((a, b) => Number(b.priorityScore) - Number(a.priorityScore))); }
    catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function update(report, patch) {
    setBusy(report._id);
    try { const data = await api(`/reports/${report._id}`, { method: 'PATCH', body: patch }); toast.success(data.message || 'Report updated.'); await load(); await onDataChanged?.(); }
    catch (error) { toast.error(error.message); }
    finally { setBusy(''); }
  }
  async function selectPhoto(report, file) {
    if (!file) return;
    setBusy(report._id);
    try { const url = await uploadImage(file); setPhotos(current => ({ ...current, [report._id]: url })); toast.success('After-photo uploaded and ready.'); }
    catch (error) { toast.error(error.message); }
    finally { setBusy(''); }
  }
  function controls(report) {
    return <div className="min-w-64 space-y-2">
      <label className="block text-xs font-semibold text-slate-600">Assigned team
        <input aria-label={`Assigned team for ${report.title}`} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-teal-600" value={teams[report._id] ?? report.assignedTeam ?? ''} onChange={e => setTeams(current => ({ ...current, [report._id]: e.target.value }))} placeholder="e.g. Road maintenance" />
      </label>
      <button disabled={busy === report._id || !(teams[report._id] ?? report.assignedTeam ?? '').trim()} className="btn-secondary w-full" onClick={() => update(report, { assignedTeam: (teams[report._id] ?? report.assignedTeam ?? '').trim() })}>{busy === report._id ? 'Saving…' : 'Assign / save team'}</button>
      {(report.status === 'assigned' || report.status === 'reopened') && <button disabled={busy === report._id} className="btn-secondary w-full" onClick={() => update(report, { status: 'in_progress' })}>Mark in progress</button>}
      {report.status === 'reported' && <p className="text-xs text-slate-500">Assign a team first.</p>}
      {report.status === 'in_progress' && <>
        <label className="block text-xs font-semibold text-slate-600">After-photo (required)
          <input aria-label={`Upload after-photo for ${report.title}`} className="mt-1 block w-full text-xs" type="file" accept="image/*" onChange={e => selectPhoto(report, e.target.files?.[0])} />
        </label>
        {photos[report._id] && <img src={photos[report._id]} alt={`After-photo preview for ${report.title}`} className="h-20 w-full rounded-lg object-cover" />}
        <button disabled={busy === report._id || !photos[report._id]} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50" onClick={() => update(report, { status: 'resolved', afterPhoto: photos[report._id] })}>Mark resolved</button>
      </>}
      {report.status === 'resolved' && <span className="text-xs font-semibold text-emerald-700">Awaiting citizen confirmation</span>}
      {['closed', 'verified'].includes(report.status) && <span className="text-xs text-slate-500">Workflow complete</span>}
    </div>;
  }
  if (loading) return <div className="py-12 text-center text-slate-500" role="status">Loading all reports…</div>;
  return <section>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">RESPONSE OPERATIONS</p><h2 className="text-2xl font-bold text-slate-900">All civic reports</h2><p className="muted">Sorted by priority score, highest first.</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold">{reports.length} total</span><button className="btn-secondary" onClick={load}>Refresh</button></div></div>
    {!reports.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center"><h3 className="font-bold text-slate-800">No reports yet</h3><p className="mt-1 text-sm text-slate-500">Citizen submissions will appear here.</p></div> : <>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block"><table className="w-full min-w-[1200px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Issue', 'Location', 'Severity', 'Upvotes', 'Days open', 'Priority score', 'SLA status', 'Status', 'Assigned team', 'Reopened', 'Actions'].map(h => <th key={h} className="px-3 py-3 font-bold">{h}</th>)}</tr></thead><tbody>{reports.map(r => <tr key={r._id} className={`border-t border-slate-100 align-top ${r.slaBreached ? 'bg-red-50' : ''}`}><td className="max-w-56 px-3 py-3"><strong>{r.title}</strong><p className="mt-1 text-xs text-slate-500">{r.category?.replace('_', ' ')}</p></td><td className="px-3 py-3 text-xs">{r.location?.coordinates ? `${Number(r.location.coordinates[1]).toFixed(4)}, ${Number(r.location.coordinates[0]).toFixed(4)}` : '—'}</td><td className="px-3 py-3">{r.severity}/5</td><td className="px-3 py-3">{r.upvotes}</td><td className="px-3 py-3">{r.daysOpen ?? 0}</td><td className="px-3 py-3"><PriorityTooltip report={r} /></td><td className="px-3 py-3"><SLABadge report={r} /></td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{statusLabel(r.status)}</span></td><td className="px-3 py-3">{r.assignedTeam || '—'}</td><td className="px-3 py-3"><span className={r.reopenedCount ? 'font-bold text-amber-700' : ''}>{r.reopenedCount || 0}</span></td><td className="px-3 py-3">{controls(r)}</td></tr>)}</tbody></table></div>
      <div className="grid gap-4 md:hidden">{reports.map(r => <article key={r._id} className={`rounded-2xl border p-4 shadow-sm ${r.slaBreached ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase text-slate-500">{r.category?.replace('_', ' ')}</span><h3 className="mt-1 font-bold">{r.title}</h3></div><PriorityTooltip report={r} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p>Severity <b>{r.severity}/5</b></p><p>Upvotes <b>{r.upvotes}</b></p><p>Days open <b>{r.daysOpen ?? 0}</b></p><p>Status <b>{statusLabel(r.status)}</b></p><p>Reopened <b>{r.reopenedCount || 0}</b></p><div><SLABadge report={r} /></div></div><p className="mt-2 text-xs text-slate-500">Coordinates: {r.location?.coordinates ? `${r.location.coordinates[1]}, ${r.location.coordinates[0]}` : '—'}</p><div className="mt-4 border-t border-slate-200 pt-3">{controls(r)}</div></article>)}</div>
    </>}
  </section>;
}
