import Report from '../models/Report.js';

function enrich(report) {
  const r = report.toObject ? report.toObject() : { ...report };
  const closed = ['resolved', 'closed', 'verified'].includes(r.status);
  const daysUnresolved = closed ? 0 : Math.max(0, (Date.now() - new Date(r.createdAt).getTime()) / 86400000);
  const severity = Number(r.severity || 0) * 10;
  const upvotes = Number(r.upvotes || 0) * 2;
  const reopenBonus = Number(r.reopenedCount || 0) * 15;
  r.priorityScore = Math.round((severity + upvotes + daysUnresolved * 3 + reopenBonus) * 100) / 100;
  r.priorityBreakdown = { severity, upvotes, daysUnresolved: Math.round(daysUnresolved * 100) / 100, reopenBonus };
  r.daysOpen = Math.max(0, Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000));
  r.slaBreached = Boolean(r.slaDeadline && Date.now() > new Date(r.slaDeadline).getTime() && !['resolved', 'closed', 'verified'].includes(r.status));
  return r;
}
export async function getAllAdminReports(_req, res, next) {
  try {
    const reports = await Report.find({}).populate('createdBy', 'name email').lean();
    res.json({ reports: reports.map(enrich).sort((a, b) => b.priorityScore - a.priorityScore) });
  } catch (error) { next(error); }
}
