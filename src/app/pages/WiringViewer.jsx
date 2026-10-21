import React, { useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button, Badge, StatusPill } from '../ui.jsx';

// Interactive wiring diagram: wheel/button zoom, drag to pan, select a
// component to highlight its circuits, inspect connectors/pins and test
// points, and overlay recorded measurements with their evaluation.
export const WiringViewer = ({ diagram }) => {
  const { width = 1200, height = 800 } = diagram.canvas || {};
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState(null); // { type: 'component'|'circuit'|'testPoint', id }
  const drag = useRef(null);
  const comps = useMemo(() => new Map(diagram.components.map(c => [c.id, c])), [diagram]);
  const overlays = useMemo(() => {
    const m = new Map();
    for (const o of diagram.measurementOverlays || []) if (o.testPointId && !m.has(o.testPointId)) m.set(o.testPointId, o);
    return m;
  }, [diagram]);

  const center = (c) => [c.x + (c.width || 140) / 2, c.y + (c.height || 70) / 2];
  const circuitPath = (c) => {
    const a = comps.get(c.from.componentId);
    const b = comps.get(c.to.componentId);
    if (!a || !b) return '';
    const pts = [center(a), ...(c.points || []).map(p => [p.x, p.y]), center(b)];
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  };
  const highlighted = (circuit) => {
    if (!selected) return false;
    if (selected.type === 'circuit') return selected.id === circuit.id;
    if (selected.type === 'component') return circuit.from.componentId === selected.id || circuit.to.componentId === selected.id;
    if (selected.type === 'testPoint') return diagram.testPoints.find(t => t.id === selected.id)?.circuitId === circuit.id;
    return false;
  };
  const zoom = (f) => setView(v => ({ ...v, k: Math.min(6, Math.max(0.3, v.k * f)) }));
  const onWheel = (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.12 : 0.89); };
  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; };
  const onMove = (e) => { if (drag.current) setView(v => ({ ...v, x: drag.current.vx + (e.clientX - drag.current.x) / v.k, y: drag.current.vy + (e.clientY - drag.current.y) / v.k })); };
  const onUp = () => { drag.current = null; };

  const sel = selected?.type === 'component' ? comps.get(selected.id)
    : selected?.type === 'circuit' ? diagram.circuits.find(c => c.id === selected.id)
      : selected?.type === 'testPoint' ? diagram.testPoints.find(t => t.id === selected.id) : null;

  return (
    <div className="grid-2" style={{ gridTemplateColumns: '3fr minmax(240px, 1fr)' }}>
      <div className="ft-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div className="row" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <Button size="sm" onClick={() => zoom(1.2)} aria-label="Zoom in"><ZoomIn size={14} /></Button>
          <Button size="sm" onClick={() => zoom(0.83)} aria-label="Zoom out"><ZoomOut size={14} /></Button>
          <Button size="sm" onClick={() => setView({ x: 0, y: 0, k: 1 })} aria-label="Reset view"><Maximize2 size={14} /></Button>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 560, background: '#060b16', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
          onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} role="img" aria-label={diagram.title}>
          <g transform={`scale(${view.k}) translate(${view.x} ${view.y})`}>
            {diagram.circuits.map(c => (
              <path key={c.id} d={circuitPath(c)} fill="none" stroke={c.wireColor && /^#|^[a-z]+$/i.test(c.wireColor) ? c.wireColor : '#64748b'}
                strokeWidth={highlighted(c) ? 5 : 2.2} opacity={selected && !highlighted(c) ? 0.25 : 1} style={{ cursor: 'pointer' }}
                onPointerDown={e => e.stopPropagation()} onClick={() => setSelected({ type: 'circuit', id: c.id })}>
                <title>{c.name}{c.function ? ` — ${c.function}` : ''}</title>
              </path>
            ))}
            {diagram.components.map(c => {
              const on = selected?.type === 'component' && selected.id === c.id;
              return (
                <g key={c.id} onPointerDown={e => e.stopPropagation()} onClick={() => setSelected({ type: 'component', id: c.id })} style={{ cursor: 'pointer' }}>
                  <rect x={c.x} y={c.y} width={c.width || 140} height={c.height || 70} rx="8" fill={on ? '#16305e' : '#101a2e'} stroke={on ? '#5b9bff' : '#334155'} strokeWidth={on ? 2.5 : 1.5} />
                  <text x={c.x + 8} y={c.y + 20} fill="#e2e8f0" fontSize="13" fontWeight="700">{c.label}</text>
                  {c.type && <text x={c.x + 8} y={c.y + 38} fill="#94a3b8" fontSize="11">{c.type}</text>}
                </g>
              );
            })}
            {diagram.testPoints.filter(t => Number.isFinite(t.x)).map(t => {
              const o = overlays.get(t.id);
              const color = o ? (o.evaluation.result === 'pass' ? '#34c38f' : o.evaluation.result === 'fail' ? '#ef5b6c' : '#f2b14c') : '#2f7bff';
              return (
                <g key={t.id} onPointerDown={e => e.stopPropagation()} onClick={() => setSelected({ type: 'testPoint', id: t.id })} style={{ cursor: 'pointer' }}>
                  <circle cx={t.x} cy={t.y} r="9" fill={color} stroke="#fff" strokeWidth="1.5" />
                  <text x={t.x + 12} y={t.y + 4} fill="#e2e8f0" fontSize="11">{t.label}{o ? `: ${o.value} ${o.unit}` : ''}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="ft-card">
        {!sel && <p className="muted small">Select a component, wire or test point. Drag to pan, scroll to zoom.</p>}
        {selected?.type === 'component' && sel && (
          <div className="stack">
            <strong>{sel.label}</strong>
            {(sel.connectors || []).map(cn => (
              <div key={cn.id}>
                <div className="small faint">Connector {cn.label || cn.id}</div>
                {cn.pins.map(p => <div key={p.id} className="row small"><Badge>{p.number}</Badge>{p.label}{p.circuitId && <Button size="sm" variant="ghost" onClick={() => setSelected({ type: 'circuit', id: p.circuitId })}>circuit</Button>}</div>)}
              </div>
            ))}
            <div className="small muted">{diagram.circuits.filter(highlighted).length} connected circuit(s)</div>
          </div>
        )}
        {selected?.type === 'circuit' && sel && (
          <div className="stack-sm">
            <strong>{sel.name}</strong>{sel.function && <span className="small muted">{sel.function}</span>}
            <span className="small">Wire: {sel.wireColor || '—'} {sel.gauge ? `· ${sel.gauge}` : ''}</span>
            <span className="small">From {comps.get(sel.from.componentId)?.label} {sel.from.pinId ? `pin ${sel.from.pinId}` : ''} → {comps.get(sel.to.componentId)?.label} {sel.to.pinId ? `pin ${sel.to.pinId}` : ''}</span>
          </div>
        )}
        {selected?.type === 'testPoint' && sel && (
          <div className="stack-sm">
            <strong>Test point {sel.label}</strong>
            {sel.instructions && <p className="small muted">{sel.instructions}</p>}
            {overlays.get(sel.id) ? <div className="small">Measured {overlays.get(sel.id).value} {overlays.get(sel.id).unit} <StatusPill status={overlays.get(sel.id).evaluation.result} /><div className="faint">{overlays.get(sel.id).evaluation.reason}</div></div> : <span className="small faint">No measurement recorded in this session</span>}
          </div>
        )}
        <p className="small faint" style={{ marginTop: 12 }}>Source: {diagram.source?.name} {diagram.sourceVersion || diagram.source?.version}{diagram.source?.license?.attribution ? ` · ${diagram.source.license.attribution}` : ''}</p>
      </div>
    </div>
  );
};
