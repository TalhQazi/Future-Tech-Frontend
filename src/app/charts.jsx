import React from 'react';
import { money } from './ui.jsx';

// Small dependency-free SVG charts. Every value comes from the API; nothing is sampled or simulated.
export const COLORS = ['var(--primary-2)', 'var(--ok)', 'var(--warn)', 'var(--danger)', 'var(--violet)', 'var(--orange)', 'var(--muted)'];
export const BAND_COLORS = { GREEN: 'var(--ok)', YELLOW: 'var(--warn)', ORANGE: 'var(--orange)', RED: 'var(--danger)' };

const compact = (v, unit) => {
  if (unit !== 'cents') return Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 100) / 100);
  const d = v / 100;
  return Math.abs(d) >= 1e6 ? `$${(d / 1e6).toFixed(1)}M` : Math.abs(d) >= 1e3 ? `$${(d / 1e3).toFixed(1)}k` : `$${Math.round(d)}`;
};
const full = (v, unit) => (unit === 'cents' ? money(v) : (v ?? 0).toLocaleString());
const colorOf = (s, i) => s.color || COLORS[i % COLORS.length];

export const Legend = ({ series }) => (
  <div className="ft-legend">{series.map((s, i) => <span key={s.key}><i style={{ background: colorOf(s, i) }} />{s.label}</span>)}</div>
);

const Axis = ({ W, pad, min, max, y, unit }) => [0, 1, 2, 3, 4].map(i => {
  const v = min + ((max - min) * i) / 4;
  return (
    <g key={i}>
      <line className={v === 0 ? 'zero' : 'grid'} x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
      <text x={pad.l - 6} y={y(v) + 4} textAnchor="end">{compact(v, unit)}</text>
    </g>
  );
});

export const BarChart = ({ data, x, series, stacked, unit = 'cents', height = 220, empty = 'No data for this selection' }) => {
  if (!data?.length) return <div className="muted small">{empty}</div>;
  const W = 680; const H = height; const pad = { l: 58, r: 8, t: 10, b: 30 };
  const vals = data.flatMap(d => (stacked
    ? [series.reduce((s, se) => s + Math.max(0, d[se.key] || 0), 0), series.reduce((s, se) => s + Math.min(0, d[se.key] || 0), 0)]
    : series.map(se => d[se.key] || 0)));
  const max = Math.max(0, ...vals); const min = Math.min(0, ...vals); const span = max - min || 1;
  const y = (v) => pad.t + ((max - v) / span) * (H - pad.t - pad.b);
  const bw = (W - pad.l - pad.r) / data.length;
  const every = Math.ceil(data.length / 12);
  return (
    <div className="ft-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        <Axis W={W} pad={pad} min={min} max={max} y={y} unit={unit} />
        {data.map((d, i) => {
          const x0 = pad.l + i * bw + bw * 0.12; const inner = bw * 0.76;
          let pos = 0; let neg = 0;
          return (
            <g key={i}>
              {series.map((se, j) => {
                const v = d[se.key] || 0;
                let top; let bottom; let bx = x0; let w = inner;
                if (stacked) {
                  if (v >= 0) { top = y(pos + v); bottom = y(pos); pos += v; } else { top = y(neg); bottom = y(neg + v); neg += v; }
                } else {
                  w = inner / series.length; bx = x0 + j * w;
                  top = y(Math.max(0, v)); bottom = y(Math.min(0, v));
                }
                return <rect key={se.key} x={bx} y={top} width={Math.max(1, w - 1)} height={Math.max(0, bottom - top)} fill={colorOf(se, j)} rx="2"><title>{`${d[x]} · ${se.label}: ${full(v, unit)}`}</title></rect>;
              })}
              {i % every === 0 && <text x={pad.l + i * bw + bw / 2} y={H - 10} textAnchor="middle">{String(d[x]).slice(0, 12)}</text>}
            </g>
          );
        })}
      </svg>
      <Legend series={series} />
    </div>
  );
};

// Line chart over time (xKey holds dates) with optional vertical markers.
export const LineChart = ({ series, unit = 'number', height = 220, markers = [], empty = 'No data' }) => {
  const pts = series.flatMap(s => s.points);
  if (!pts.length) return <div className="muted small">{empty}</div>;
  const W = 680; const H = height; const pad = { l: 58, r: 12, t: 10, b: 30 };
  const ts = [...pts.map(p => new Date(p.at).getTime()), ...markers.map(m => new Date(m.at).getTime())];
  const t0 = Math.min(...ts); const t1 = Math.max(...ts); const tspan = t1 - t0 || 1;
  const vs = pts.map(p => p.value); const max = Math.max(...vs); const min = Math.min(0, ...vs); const span = max - min || 1;
  const x = (t) => pad.l + ((new Date(t).getTime() - t0) / tspan) * (W - pad.l - pad.r);
  const y = (v) => pad.t + ((max - v) / span) * (H - pad.t - pad.b);
  return (
    <div className="ft-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        <Axis W={W} pad={pad} min={min} max={max} y={y} unit={unit} />
        {markers.map((m, i) => <g key={`m${i}`}><line x1={x(m.at)} x2={x(m.at)} y1={pad.t} y2={H - pad.b} stroke={m.color || 'var(--line-2)'} strokeDasharray="3 3" /><circle cx={x(m.at)} cy={H - pad.b} r="3" fill={m.color || 'var(--muted)'}><title>{m.label}</title></circle></g>)}
        {series.map((s, i) => (
          <g key={s.key}>
            <polyline fill="none" stroke={colorOf(s, i)} strokeWidth="2" strokeDasharray={s.dashed ? '6 4' : undefined} points={s.points.map(p => `${x(p.at)},${y(p.value)}`).join(' ')} />
            {s.points.map((p, j) => <circle key={j} cx={x(p.at)} cy={y(p.value)} r="2.5" fill={colorOf(s, i)}><title>{`${new Date(p.at).toLocaleDateString()} · ${s.label}: ${full(p.value, unit)}`}</title></circle>)}
          </g>
        ))}
        <text x={pad.l} y={H - 10}>{new Date(t0).toLocaleDateString()}</text>
        <text x={W - pad.r} y={H - 10} textAnchor="end">{new Date(t1).toLocaleDateString()}</text>
      </svg>
      <Legend series={[...series, ...(markers.length ? [{ key: 'markers', label: 'Service visits', color: 'var(--muted)' }] : [])]} />
    </div>
  );
};

// Profitability bridge: positive steps up, negative steps down, totals as full bars.
export const Waterfall = ({ steps, height = 240 }) => {
  if (!steps?.length) return null;
  let run = 0;
  const bars = steps.map(s => {
    if (s.total) { const b = { ...s, from: 0, to: s.value }; run = s.value; return b; }
    const b = { ...s, from: run, to: run + s.value }; run += s.value; return b;
  });
  const vals = bars.flatMap(b => [b.from, b.to]);
  const max = Math.max(0, ...vals); const min = Math.min(0, ...vals); const span = max - min || 1;
  const W = 680; const H = height; const pad = { l: 58, r: 8, t: 10, b: 40 };
  const y = (v) => pad.t + ((max - v) / span) * (H - pad.t - pad.b);
  const bw = (W - pad.l - pad.r) / bars.length;
  return (
    <div className="ft-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        <Axis W={W} pad={pad} min={min} max={max} y={y} unit="cents" />
        {bars.map((b, i) => {
          const top = y(Math.max(b.from, b.to)); const bottom = y(Math.min(b.from, b.to));
          const fill = b.total ? 'var(--primary-2)' : b.value >= 0 ? 'var(--ok)' : 'var(--danger)';
          return (
            <g key={b.label}>
              <rect x={pad.l + i * bw + bw * 0.15} y={top} width={bw * 0.7} height={Math.max(1, bottom - top)} fill={fill} rx="2"><title>{`${b.label}: ${money(b.value)}`}</title></rect>
              <text x={pad.l + i * bw + bw / 2} y={H - 24} textAnchor="middle">{b.label.split(' ')[0]}</text>
              <text x={pad.l + i * bw + bw / 2} y={H - 11} textAnchor="middle">{b.label.split(' ').slice(1).join(' ')}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Horizontal 100% stacked bars, e.g. risk bands per location or plan.
export const StackedRows = ({ rows, keys, colors = BAND_COLORS, labelKey = 'label', empty = 'No data' }) => {
  if (!rows?.length) return <div className="muted small">{empty}</div>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {rows.map(r => {
        const total = keys.reduce((s, k) => s + (r[k] || 0), 0) || 1;
        return (
          <div key={r.key || r[labelKey]}>
            <div className="row between small"><span>{r[labelKey]}</span><span className="faint">{keys.reduce((s, k) => s + (r[k] || 0), 0)}</span></div>
            <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-3)' }}>
              {keys.map(k => (r[k] ? <div key={k} title={`${k}: ${r[k]}`} style={{ width: `${(r[k] / total) * 100}%`, background: colors[k] }} /> : null))}
            </div>
          </div>
        );
      })}
      <Legend series={keys.map(k => ({ key: k, label: k, color: colors[k] }))} />
    </div>
  );
};
