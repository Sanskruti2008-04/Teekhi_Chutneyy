import mongoose from 'mongoose';

export const categories = ['pothole', 'water_leak', 'garbage', 'streetlight', 'other'];
export const statuses = ['reported', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened', 'verified'];
export const SLA_DAYS = { pothole: 7, water_leak: 2, garbage: 3, streetlight: 5, other: 7 };
const reportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, enum: categories, required: true },
  severity: { type: Number, min: 1, max: 5, required: true },
  photos: { type: [String], default: [] },
  location: { type: { type: String, enum: ['Point'], required: true, default: 'Point' }, coordinates: { type: [Number], required: true, validate: v => v.length === 2 } },
  status: { type: String, enum: statuses, default: 'reported' },
  upvotes: { type: Number, default: 0, min: 0 },
  assignedTeam: { type: String, default: '' },
  beforePhotoUrl: { type: String, default: '' },
  afterPhotoUrl: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  slaDeadline: { type: Date },
  reopenedCount: { type: Number, default: 0, min: 0 },
  reopenReasons: { type: [String], default: [] },
  priorityScore: { type: Number, default: 0 }
}, { timestamps: true });
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1, category: 1, createdAt: -1 });
reportSchema.pre('validate', function (next) {
  if (!this.slaDeadline && this.createdAt) this.slaDeadline = new Date(new Date(this.createdAt).getTime() + (SLA_DAYS[this.category] || 7) * 86400000);
  next();
});
reportSchema.methods.refreshPriority = function () {
  const daysUnresolved = ['resolved', 'closed', 'verified'].includes(this.status) ? 0 : Math.max(0, (Date.now() - new Date(this.createdAt).getTime()) / 86400000);
  this.priorityScore = Math.round((this.severity * 10 + this.upvotes * 2 + daysUnresolved * 3 + this.reopenedCount * 15) * 100) / 100;
  return this.priorityScore;
};
export default mongoose.model('Report', reportSchema);
