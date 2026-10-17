import Report from '../models/Report.js';
export async function getStats(_req, res, next) {
  try {
    const [total, statusRows, categoryRows, resolvedRows, closed, pendingDecision] = await Promise.all([
      Report.countDocuments(),
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Report.find({ status: { $in: ['resolved', 'closed', 'verified'] }, resolvedAt: { $ne: null } }, { createdAt: 1, resolvedAt: 1 }).lean(),
      Report.countDocuments({ status: 'closed' }),
      Report.countDocuments({ status: 'resolved' })
    ]);
    const averageResolutionHours = resolvedRows.length ? Math.round(resolvedRows.reduce((sum, r) => sum + Math.max(0, new Date(r.resolvedAt) - new Date(r.createdAt)) / 3600000, 0) / resolvedRows.length * 10) / 10 : null;
    const decisions = closed + pendingDecision;
    res.json({ total, resolved: resolvedRows.length, closed, satisfactionRate: decisions ? Math.round(closed / decisions * 1000) / 10 : null, averageResolutionHours, byStatus: statusRows.map(x => ({ name: x._id, count: x.count })), byCategory: categoryRows.map(x => ({ name: x._id, value: x.count })) });
  } catch (err) { next(err); }
}
