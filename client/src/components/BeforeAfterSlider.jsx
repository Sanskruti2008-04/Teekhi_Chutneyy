import { useState } from 'react';
export default function BeforeAfterSlider({ before, after, title = 'Issue photo comparison' }) {
  const [split, setSplit] = useState(50);
  if (!before || !after) return null;
  return <section className="mt-4" aria-label={title}>
    <div className="relative h-56 overflow-hidden rounded-xl bg-slate-100 sm:h-72">
      <img src={after} alt="After repair" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${split}%` }}>
        <img src={before} alt="Before repair" className="h-full max-w-none object-cover" style={{ width: `${10000 / split}%`, height: '100%' }} />
      </div>
      <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">Before</span>
      <span className="absolute right-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">After</span>
      <div className="pointer-events-none absolute inset-y-0 border-l-2 border-white" style={{ left: `${split}%` }} />
    </div>
    <label className="mt-2 flex items-center gap-3 text-sm text-slate-600">Compare photos
      <input aria-label="Adjust before and after comparison" className="w-full accent-teal-700 focus:outline focus:outline-2 focus:outline-teal-600" type="range" min="10" max="90" value={split} onChange={e => setSplit(Number(e.target.value))} />
    </label>
  </section>;
}
