import Report, { statuses, categories, SLA_DAYS } from '../models/Report.js';
import { persistImages, persistImage } from '../utils/media.js';

const activeStatuses = ['reported', 'assigned', 'in_progress', 'reopened'];
const allowedTransitions = { reported: ['assigned'], assigned: ['in_progress'], in_progress: ['resolved'], reopened: ['assigned', 'in_progress'], resolved: [] };
function enrich(doc) {
  const r = doc.toObject ? doc.toObject() : { ...doc };
  const daysUnresolved = ['resolved', 'closed', 'verified'].includes(r.status) ? 0 : Math.max(0, (Date.now() - new Date(r.createdAt).getTime()) / 86400000);
  const severity = Number(r.severity || 0) * 10, upvotes = Number(r.upvotes || 0) * 2;
  const reopenBonus = Number(r.reopenedCount || 0) * 15;
  const age = Math.round(daysUnresolved * 100) / 100;
  r.priorityScore = Math.round((severity + upvotes + daysUnresolved * 3 + reopenBonus) * 100) / 100;
  r.priorityBreakdown = { severity, upvotes, daysUnresolved: age, reopenBonus };
  r.slaBreached = Boolean(r.slaDeadline && Date.now() > new Date(r.slaDeadline).getTime() && !['resolved', 'closed', 'verified'].includes(r.status));
  r.daysOpen = Math.max(0, Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000));
  return r;
}
function validCoords(location) {
  const c = location?.coordinates;
  return location?.type === 'Point' && Array.isArray(c) && c.length === 2 && Number.isFinite(Number(c[0])) && Number.isFinite(Number(c[1])) && Math.abs(Number(c[0])) <= 180 && Math.abs(Number(c[1])) <= 90;
}
export async function listReports(req, res, next) {
  try {
    const query = {};
    if (req.query.status && statuses.includes(req.query.status)) query.status = req.query.status;
    if (req.query.active === 'true') query.status = { $in: activeStatuses };
    if (req.query.category) query.category = req.query.category;
    if (req.query.mine === 'true') query.createdBy = req.user._id;
    const reports = await Report.find(query).populate('createdBy', 'name').lean();
    res.json({ reports: reports.map(enrich).sort((a, b) => b.priorityScore - a.priorityScore) });
  } catch (err) { next(err); }
}
export async function createReport(req, res, next) {
  try {
    const { title, description, category, severity, location, photos = [] } = req.body;
    if (!title?.trim() || !description?.trim() || !categories.includes(category)) return res.status(400).json({ message: 'Title, description, and a valid category are required.' });
    const sev = Number(severity);
    if (!Number.isInteger(sev) || sev < 1 || sev > 5) return res.status(400).json({ message: 'Severity must be an integer from 1 to 5.' });
    if (!validCoords(location)) return res.status(400).json({ message: 'Choose a valid point on the map.' });
    const coords = [Number(location.coordinates[0]), Number(location.coordinates[1])];
    const duplicate = await Report.findOne({ category, status: { $in: activeStatuses }, location: { $near: { $geometry: { type: 'Point', coordinates: coords }, $maxDistance: 50 } } });
    if (duplicate) return res.status(200).json({ duplicate: true, report: enrich(duplicate), message: 'This looks like an existing issue — upvote?' });
    const savedPhotos = await persistImages(photos);
    const createdAt = new Date();
    const report = await Report.create({ title: title.trim(), description: description.trim(), category, severity: sev, photos: savedPhotos, beforePhotoUrl: savedPhotos[0] || '', location: { type: 'Point', coordinates: coords }, createdBy: req.user._id, createdAt, slaDeadline: new Date(createdAt.getTime() + (SLA_DAYS[category] || 7) * 86400000) });
    res.status(201).json({ duplicate: false, report: enrich(report), message: 'Issue reported successfully.' });
  } catch (err) { next(err); }
}
export async function upvoteReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    if (!activeStatuses.includes(report.status)) return res.status(400).json({ message: 'Only active reports can be upvoted.' });
    const newPhotos = await persistImages(req.body.photos || []);
    report.upvotes += 1; report.photos.push(...newPhotos); if (!report.beforePhotoUrl && newPhotos[0]) report.beforePhotoUrl = newPhotos[0];
    await report.save(); res.json({ report: enrich(report), message: 'Your support was added.' });
  } catch (err) { next(err); }
}
export async function nearbyReports(req, res, next) {
  try {
    const lat = Number(req.query.lat), lng = Number(req.query.lng), radius = Math.min(Math.max(Number(req.query.radius) || 3000, 100), 20000);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
    const reports = await Report.find({ status: { $in: activeStatuses }, location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radius } } }).limit(100).lean();
    res.json({ reports: reports.map(enrich) });
  } catch (err) { next(err); }
}
export async function updateReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    const { assignedTeam, status, afterPhoto } = req.body;
    if (status === 'closed' || status === 'verified') return res.status(400).json({ message: 'Admins cannot close or verify reports. The reporting citizen must close the issue.' });
    if (assignedTeam !== undefined) {
      if (typeof assignedTeam !== 'string' || assignedTeam.trim().length > 120) return res.status(400).json({ message: 'Team name must be under 120 characters.' });
      report.assignedTeam = assignedTeam.trim();
      if (report.status === 'reported' && report.assignedTeam) report.status = 'assigned';
      if (report.status === 'reopened' && report.assignedTeam) report.status = 'assigned';
    }
    if (status) {
      if (!allowedTransitions[report.status]?.includes(status)) return res.status(400).json({ message: `Cannot move from ${report.status} to ${status}.` });
      if (status === 'resolved') {
        const photo = afterPhoto || report.afterPhotoUrl;
        if (!photo) return res.status(400).json({ message: 'An after-photo is required before resolving this issue.' });
        report.afterPhotoUrl = await persistImage(photo); report.resolvedAt = new Date();
      }
      report.status = status;
    } else if (afterPhoto) report.afterPhotoUrl = await persistImage(afterPhoto);
    await report.save(); res.json({ report: enrich(report), message: 'Report updated successfully.' });
  } catch (err) { next(err); }
}
export async function closeReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    if (req.user.role !== 'citizen' || String(report.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'Only the reporting citizen can close this issue.' });
    if (report.status !== 'resolved') return res.status(400).json({ message: 'Only resolved reports can be closed.' });
    report.status = 'closed'; report.closedAt = new Date(); await report.save();
    res.json({ report: enrich(report), message: 'Issue closed. Thank you for confirming the fix.' });
  } catch (err) { next(err); }
}
export async function reopenReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    if (req.user.role !== 'citizen' || String(report.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'Only the reporting citizen can reopen this issue.' });
    if (report.status !== 'resolved') return res.status(400).json({ message: 'Only resolved reports can be reopened.' });
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) return res.status(400).json({ message: 'Please explain what is still wrong (at least 5 characters).' });
    report.status = 'reopened'; report.reopenedCount += 1; report.reopenReasons.push(reason); report.closedAt = null;
    await report.save(); res.json({ report: enrich(report), message: 'Issue reopened. The response team has been notified.' });
  } catch (err) { next(err); }
}
export async function verifyReport(req, res, next) {
  try { return res.status(410).json({ message: 'Verification was replaced by the citizen close/reopen workflow. Use /close or /reopen.' }); }
  catch (err) { next(err); }
}
