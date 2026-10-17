import { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { api, getToken, setToken, uploadImage } from './api';
import MapPicker from './components/MapPicker';
import PhotoInput from './components/PhotoInput';
import ReportCard from './components/ReportCard';
import AdminDashboard from './pages/AdminDashboard';
import ResolutionActions from './components/ResolutionActions';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const categories = [{ value: 'pothole', label: 'Pothole' }, { value: 'water_leak', label: 'Water leak' }, { value: 'garbage', label: 'Garbage' }, { value: 'streetlight', label: 'Streetlight' }, { value: 'other', label: 'Other' }];
const stages = ['reported', 'assigned', 'in_progress', 'resolved', 'closed'];
const stageName = s => ({ reported: 'Reported', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened', verified: 'Verified' }[s] || s);
function Loading() { return <div className="flex items-center justify-center gap-3 py-12 text-slate-500"><span className="spinner" /> Loading CivicFix…</div>; }
function Empty({ title, text }) { return <div className="empty"><div className="text-3xl">◎</div><h3 className="mt-2 font-bold text-slate-800">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div>; }

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(() => window.location.pathname === '/admin' ? 'admin' : 'home');
  const [authMode, setAuthMode] = useState(() => ['/admin', '/admin-login'].includes(window.location.pathname) ? 'admin-login' : 'login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'pothole', severity: 3, location: [18.5204, 73.8567], photos: [] });
  const [duplicate, setDuplicate] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [adminDraft, setAdminDraft] = useState({});
  const [afterPhotos, setAfterPhotos] = useState({});
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api('/auth/me').then(({ user }) => setUser(user)).catch(() => setToken('')).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user, page]);

  async function refresh() {
    setLoading(true);
    try {
      const requests = [api('/reports?active=true'), api('/reports?mine=true')];
      const [active, mine] = await Promise.all(requests);
      const all = new Map();
      [...active.reports, ...mine.reports].forEach(r => all.set(r._id, r));
      setReports(Array.from(all.values()).sort((a, b) => b.priorityScore - a.priorityScore));
      if (page === 'stats') setStats(await api('/stats'));
      if (page === 'admin' && user.role === 'admin') { const admin = await api('/reports'); setReports(admin.reports); }
      if (page === 'nearby') await findNearby(false);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  async function findNearby(showToast = true) {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported by this browser.'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const data = await api(`/reports/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=5000`);
        setNearby(data.reports);
        if (showToast) toast.success(`Found ${data.reports.length} nearby active reports.`);
      } catch (err) { toast.error(err.message); }
    }, () => toast.error('Location permission was denied. You can still explore the map.'), { timeout: 10000, enableHighAccuracy: false });
  }
  async function submitAuth(e) {
    e.preventDefault();
    try {
      const data = await api(`/auth/${authMode === 'register' ? 'register' : 'login'}`, { method: 'POST', body: authForm });
      if (authMode === 'admin-login' && data.user.role !== 'admin') { toast.error('This account does not have administrator access.'); return; }
      setToken(data.token); setUser(data.user); setPage(data.user.role === 'admin' ? 'admin' : 'home'); window.history.replaceState({}, '', data.user.role === 'admin' ? '/admin' : '/'); toast.success(authMode === 'register' ? 'Account created successfully.' : 'Welcome back!');
    } catch (err) { toast.error(err.message); }
  }
  async function submitReport(e) {
    e.preventDefault();
    try {
      const data = await api('/reports', { method: 'POST', body: { ...form, severity: Number(form.severity), location: { type: 'Point', coordinates: [form.location[1], form.location[0]] } } });
      if (data.duplicate) { setDuplicate(data.report); toast('This looks like an existing issue — upvote?', { icon: '🛡️', duration: 5000 }); }
      else { toast.success('Issue reported successfully.'); setForm({ title: '', description: '', category: 'pothole', severity: 3, location: [18.5204, 73.8567], photos: [] }); setPage('my-reports'); await refresh(); }
    } catch (err) { toast.error(err.message); }
  }
  async function upvote(id) {
    try {
      await api(`/reports/${id}/upvote`, { method: 'POST', body: { photos: form.photos } });
      setDuplicate(null); toast.success('Upvote added and photos attached.'); setPage('my-reports'); await refresh();
    } catch (err) { toast.error(err.message); }
  }
  async function adminUpdate(report, patch) {
    setBusyId(report._id);
    try {
      const data = await api(`/reports/${report._id}`, { method: 'PATCH', body: patch });
      toast.success(data.message); await refresh();
    } catch (err) { toast.error(err.message); }
    finally { setBusyId(''); }
  }
  async function verify(report) {
    try { const data = await api(`/reports/${report._id}/verify`, { method: 'POST', body: {} }); toast.success(data.message); await refresh(); }
    catch (err) { toast.error(err.message); }
  }
  const mine = useMemo(() => reports.filter(r => (typeof r.createdBy === 'string' ? r.createdBy : r.createdBy?._id) === user?.id || r.createdBy?.email === user?.email), [reports, user]);
  const adminReports = useMemo(() => reports.filter(r => !['verified'].includes(r.status)).sort((a, b) => b.priorityScore - a.priorityScore), [reports]);

  if (loading && !user) return <Loading />;
  if (!user) return <div className="auth-page"><Toaster position="top-right" /><div className="auth-art"><div className="brand-mark">CF</div><p className="eyebrow">CITIZEN-POWERED ACCOUNTABILITY</p><h1>Small reports.<br />Real change.</h1><p>Report local issues, track progress, and verify resolutions in one transparent place.</p><div className="art-stats"><div><strong>50m</strong><span>duplicate shield</span></div><div><strong>5 steps</strong><span>verified workflow</span></div></div></div><form className="auth-card" onSubmit={submitAuth}><div className="brand-mark small">CF</div><h2>{authMode === 'register' ? 'Create your account' : authMode === 'admin-login' ? 'Administrator sign in' : 'Welcome back'}</h2><p className="muted">{authMode === 'register' ? 'Join your neighbourhood response network.' : authMode === 'admin-login' ? 'Sign in with your seeded administrator account.' : 'Sign in to your CivicFix workspace.'}</p>{authMode === 'register' && <label className="field-label">Full name<input required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name" /></label>}<label className="field-label">Email<input required type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" /></label><label className="field-label">Password<input required minLength="8" type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 8 characters" /></label><button className="btn-primary w-full" type="submit">{authMode === 'register' ? 'Create account' : authMode === 'admin-login' ? 'Admin sign in' : 'Sign in'}</button><p className="mt-5 text-center text-sm text-slate-500">{authMode === 'register' ? 'Already have an account?' : authMode === 'admin-login' ? 'Citizen instead?' : 'New to CivicFix?'} <button type="button" className="text-link" onClick={() => setAuthMode(authMode === 'register' ? 'login' : authMode === 'admin-login' ? 'login' : 'register')}>{authMode === 'register' ? 'Sign in' : authMode === 'admin-login' ? 'Citizen sign in' : 'Create account'}</button></p><p className="mt-4 text-center text-xs text-slate-400">{authMode !== 'admin-login' ? <>Admin? <button type="button" className="text-link" onClick={() => setAuthMode('admin-login')}>Administrator sign in</button></> : 'Only seeded administrator accounts can enter the admin desk.'}</p></form></div>;

  const nav = [
    ['home', 'Overview', '⌂'], ['report', 'Report issue', '+'], ['my-reports', 'My reports', '▤'], ['nearby', 'Nearby map', '⌖'], ['stats', 'Civic stats', '▥'],
    ...(user.role === 'admin' ? [['admin', 'Admin desk', '✓']] : [])
  ];
  return <div className="app-shell"><Toaster position="top-right" toastOptions={{ duration: 3500 }} /><aside className="sidebar"><div className="brand-row"><div className="brand-mark">CF</div><div><strong>CivicFix</strong><span>Sentinel</span></div></div><div className="sidebar-label">WORKSPACE</div><nav>{nav.map(([id, label, icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); window.history.pushState({}, '', id === 'admin' ? '/admin' : '/'); setDuplicate(null); }}><span className="nav-icon">{icon}</span>{label}</button>)}</nav><div className="sidebar-bottom"><div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><strong>{user.name}</strong><span>{user.role === 'admin' ? 'Administrator' : 'Citizen account'}</span></div><button className="logout" aria-label="Sign out" onClick={() => { setToken(''); setUser(null); toast.success('Signed out.'); }}>↗</button></div></aside>
  <main className="main-content"><header className="topbar"><div><p className="eyebrow">CIVIC RESPONSE NETWORK</p><h1>{({ home: 'Community overview', report: 'Report an issue', 'my-reports': 'My reports', nearby: 'Issues around you', stats: 'Civic performance', admin: 'Admin response desk' })[page]}</h1></div><div className="topbar-user"><span className="online-dot" /> Live workspace <div className="avatar small-avatar">{user.name.slice(0,1).toUpperCase()}</div></div></header>
  {loading ? <Loading /> : <>
    {page === 'home' && <><section className="hero"><div><span className="hero-tag">YOUR CITY, YOUR VOICE</span><h2>Make your neighbourhood<br /><em>better, together.</em></h2><p>Report a civic issue in seconds. Follow its progress. Help your community get the attention it deserves.</p><button className="btn-light" onClick={() => setPage('report')}>＋ Report an issue <span>→</span></button></div><div className="hero-illustration" aria-hidden="true"><div className="sun" /><div className="building b1" /><div className="building b2" /><div className="building b3" /><div className="tree">♣</div><div className="road" /><div className="pin-art">✓</div></div></section><div className="section-heading"><div><p className="eyebrow">AT A GLANCE</p><h2>Community pulse</h2></div><button className="text-link" onClick={() => setPage('stats')}>View statistics →</button></div><div className="metric-grid"><div className="metric-card"><span className="metric-icon teal">◎</span><p>Active reports</p><strong>{reports.filter(r => ['reported','assigned','in_progress','reopened'].includes(r.status)).length}</strong><small>Awaiting resolution</small></div><div className="metric-card"><span className="metric-icon green">✓</span><p>Resolved / verified</p><strong>{reports.filter(r => ['resolved','verified'].includes(r.status)).length}</strong><small>Work completed</small></div><div className="metric-card"><span className="metric-icon amber">↗</span><p>Community support</p><strong>{reports.reduce((sum, r) => sum + r.upvotes, 0)}</strong><small>Total upvotes</small></div></div><div className="section-heading"><div><p className="eyebrow">NEEDS ATTENTION</p><h2>Priority issues</h2></div><button className="text-link" onClick={() => setPage(user.role === 'admin' ? 'admin' : 'nearby')}>Explore issues →</button></div>{reports.length ? <div className="report-grid">{reports.slice(0, 3).map(r => <ReportCard key={r._id} report={r} />)}</div> : <Empty title="A fresh start for your community" text="No reports yet. Be the first to report an issue that needs attention." />}</>}
    {page === 'report' && <div className="form-layout"><form className="panel space-y-5" onSubmit={submitReport}><div><p className="eyebrow">TELL US WHAT'S WRONG</p><h2 className="panel-title">New civic report</h2><p className="muted">Clear details help the right team act faster.</p></div><label className="field-label">Issue title<input required maxLength="120" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Deep pothole near bus stop" /></label><label className="field-label">Description<textarea required maxLength="3000" rows="4" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue and any safety concerns…" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label><label className="field-label">Severity: {form.severity}/5<input type="range" min="1" max="5" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} /><span className="help">5 = urgent / high risk</span></label></div><PhotoInput onChange={photos => setForm({ ...form, photos })} /><p className="help">Choose up to 5 photos. Your first photo is used as initial evidence.</p><button className="btn-primary w-full" type="submit">Submit civic report <span>→</span></button></form><div className="panel map-panel"><div><p className="eyebrow">LOCATION MATTERS</p><h2 className="panel-title">Drop a map pin</h2><p className="muted">Tap the map to place the issue location. The Duplicate Shield checks 50 metres around this point.</p></div><MapPicker value={form.location} onChange={location => setForm({ ...form, location })} height="390px" /><p className="help">Selected: {form.location[0].toFixed(5)}, {form.location[1].toFixed(5)}</p>{duplicate && <div className="duplicate-box"><strong>🛡️ Possible duplicate found</strong><p>This looks like an existing issue — upvote?</p><p className="text-sm">{duplicate.title} · {duplicate.upvotes} upvotes</p><div className="mt-3 flex gap-2"><button className="btn-primary" onClick={() => upvote(duplicate._id)}>Upvote existing issue</button><button className="btn-secondary" onClick={() => setDuplicate(null)}>Dismiss</button></div></div>}</div></div>}
    {page === 'my-reports' && <><div className="section-heading"><div><p className="eyebrow">YOUR SUBMISSIONS</p><h2>Track every step</h2></div><button className="btn-primary" onClick={() => setPage('report')}>＋ New report</button></div>{mine.length ? <div className="report-grid">{mine.map(r => <ReportCard key={r._id} report={r}><div className="progress-row">{stages.map((s, i) => <div key={s} className={`progress-stage ${stages.indexOf(r.status) >= i ? 'done' : ''}`}><span>{stages.indexOf(r.status) >= i ? '✓' : i + 1}</span><small>{stageName(s)}</small></div>)}</div><ResolutionActions report={r} onUpdated={refresh} />{r.status === 'verified' && <p className="mt-3 text-sm font-semibold text-emerald-700">✓ Resolution verified.</p>}</ReportCard>)}</div> : <Empty title="No reports from you yet" text="Your submitted issues will appear here with status updates and resolution evidence." />}</>}
    {page === 'nearby' && <><div className="section-heading"><div><p className="eyebrow">GEO-AWARE VIEW</p><h2>Active issues near you</h2><p className="muted">Allow location access to list reports within 5 km.</p></div><button className="btn-primary" onClick={() => findNearby(true)}>⌖ Use my location</button></div><MapPicker value={null} markers={nearby.length ? nearby : reports.filter(r => ['reported','assigned','in_progress','reopened'].includes(r.status))} height="420px" /><div className="section-heading"><div><h2>Nearby report list</h2></div><span className="category-pill">{nearby.length} found nearby</span></div>{nearby.length ? <div className="report-grid">{nearby.map(r => <ReportCard key={r._id} report={r} />)}</div> : <Empty title="Find issues around you" text="Tap “Use my location” to load active reports near your current location." />}</>}
    {page === 'admin' && user.role === 'admin' && <AdminDashboard onDataChanged={refresh} />}
    {page === 'admin' && user.role !== 'admin' && <Empty title="Admin access required" text="This workspace is available to authorised civic response teams." />}
    {page === 'stats' && <>{stats ? <><div className="metric-grid"><div className="metric-card"><span className="metric-icon teal">◎</span><p>Total reports</p><strong>{stats.total}</strong><small>All submitted issues</small></div><div className="metric-card"><span className="metric-icon green">✓</span><p>Resolved</p><strong>{stats.resolved}</strong><small>Recorded resolution events</small></div><div className="metric-card"><span className="metric-icon amber">◷</span><p>Avg. resolution</p><strong>{stats.averageResolutionHours == null ? '—' : `${stats.averageResolutionHours}h`}</strong><small>Created to resolution</small></div><div className="metric-card"><span className="metric-icon teal">★</span><p>Satisfaction</p><strong>{stats.satisfactionRate == null ? '—' : `${stats.satisfactionRate}%`}</strong><small>Citizen-closed / resolution decisions</small></div></div><div className="panel mt-6"><p className="eyebrow">ISSUES BY CATEGORY</p><h2 className="panel-title">Community issue mix</h2>{stats.byCategory.length ? <div className="mt-4 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.byCategory}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#0f766e" radius={[7,7,0,0]} /></BarChart></ResponsiveContainer></div> : <Empty title="No statistics yet" text="Submit the first report to start the chart." />}<h3 className="mt-5 font-bold">Status breakdown</h3><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{stats.byStatus.map(s => <div key={s.name} className="rounded-xl bg-slate-50 p-3"><span className="text-sm text-slate-500">{stageName(s.name)}</span><strong className="mt-1 block text-xl">{s.count}</strong></div>)}</div></div></> : <Loading />}</>}
  </>}</main></div>;
}
