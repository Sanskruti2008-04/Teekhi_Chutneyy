import { useState } from 'react';
import { uploadImage } from '../api';

export default function PhotoInput({ onChange, label = 'Photos (up to 5)' }) {
  const [busy, setBusy] = useState(false);
  async function selectFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      onChange(urls);
    } catch (err) { (await import('react-hot-toast')).default.error(err.message); }
    finally { setBusy(false); e.target.value = ''; }
  }
  return <label className="field-label">{label}
    <input aria-label={label} type="file" accept="image/*" multiple onChange={selectFiles} disabled={busy} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm" />
    {busy && <span className="help">Preparing photos…</span>}
  </label>;
}
