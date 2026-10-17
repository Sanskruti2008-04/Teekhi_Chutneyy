import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import BeforeAfterSlider from './BeforeAfterSlider';
export default function ResolutionActions({ report, onUpdated }) {
  const [reason, setReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function act(kind) {
    setBusy(true);
    try {
      const data = await api(`/reports/${report._id}/${kind}`, { method: 'POST', body: kind === 'reopen' ? { reason } : {} });
      toast.success(data.message); setReason(''); setShowReopen(false); await onUpdated?.();
    } catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  }
  return <>
    {report.status === 'resolved' && <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <p className="font-semibold text-emerald-900">Has this issue actually been fixed?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" disabled={busy} className="btn-primary" onClick={() => act('close')}>Yes, it’s fixed — Close Issue</button><button type="button" disabled={busy} className="btn-secondary" onClick={() => setShowReopen(current => !current)}>No, still broken — Reopen</button></div>
      {showReopen && <div className="mt-3"><label className="field-label" htmlFor={`reopen-${report._id}`}>What’s still wrong? (required)</label><textarea id={`reopen-${report._id}`} required minLength={5} value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 p-3 focus:outline focus:outline-2 focus:outline-teal-600" placeholder="Describe what remains unresolved…" /><button disabled={busy || reason.trim().length < 5} className="btn-primary mt-2" onClick={() => act('reopen')}>Submit reopen reason</button></div>}
    </div>}
    {report.reopenedCount > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">Reopened {report.reopenedCount} time{report.reopenedCount === 1 ? '' : 's'} · Priority bonus +{report.reopenedCount * 15}{report.reopenReasons?.length ? ` · Latest reason: ${report.reopenReasons.at(-1)}` : ''}</p>}
    {report.status === 'closed' && <p className="mt-3 text-sm font-semibold text-emerald-700">✓ You confirmed this issue is fixed.</p>}
    {['resolved', 'closed'].includes(report.status) && report.afterPhotoUrl && <BeforeAfterSlider before={report.beforePhotoUrl || report.photos?.[0]} after={report.afterPhotoUrl} title={`Before and after photos for ${report.title}`} />}
  </>;
}
