import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Wind, 
  Gauge, 
  Activity, 
  ShieldCheck, 
  Flame,
  Cpu,
  RotateCw,
  Box,
  Eye,
  Layers,
  Sparkles,
  Palette
} from 'lucide-react';
import { Car3DCanvas } from './Car3DCanvas.jsx';
import './car-animations.css';

// Iconic Bugatti Chiron Dual-Tone Liveries
const BUGATTI_LIVERIES = [
  { 
    id: 'french-racing', 
    name: 'French Racing Blue & Atlantic Navy', 
    primary: '#0088ff', 
    secondary: '#071838', 
    badge: '🇫🇷 Iconic' 
  },
  { 
    id: 'rosso-sang', 
    name: 'Rosso Pur Sang & Nocturne Carbon', 
    primary: '#ff1744', 
    secondary: '#0e131d', 
    badge: '🔴 Heritage' 
  },
  { 
    id: 'super-sport', 
    name: 'Super Sport 300+ Jet Orange & Carbon', 
    primary: '#ff5c00', 
    secondary: '#0a0d14', 
    badge: '🟠 304 MPH' 
  },
  { 
    id: 'sprint-yellow', 
    name: 'Chiron Pur Sport Sprint Yellow', 
    primary: '#ffc800', 
    secondary: '#101724', 
    badge: '🟡 Track' 
  },
  { 
    id: 'glacier-white', 
    name: 'Hermes Edition Glacier White & Navy', 
    primary: '#f8fafc', 
    secondary: '#0a1a36', 
    badge: '⚪ Luxury' 
  },
  { 
    id: 'mamba-emerald', 
    name: 'Mamba Emerald & Deep Carbon', 
    primary: '#00e676', 
    secondary: '#0c161c', 
    badge: '🟢 Exotic' 
  },
  { 
    id: 'royal-violet', 
    name: 'Royal Ultra Violet & Obsidian', 
    primary: '#9333ea', 
    secondary: '#090d16', 
    badge: '🟣 Bespoke' 
  }
];

// Bugatti Chiron Pur Sport Diagnostics Specifications
const CHIRON_SPECS = {
  name: 'Bugatti Chiron Pur Sport',
  category: '8.0L Quad-Turbo W16 · 1,500 HP · 1,600 Nm',
  type: 'Quad-Turbo Hypercar',
  speedMax: 261,
  rpmMax: 7000,
  downforce: '450 kg @ 217 mph',
  dragCd: '0.35 Cd',
  hotspots: [
    { id: 'w16', label: '8.0L Quad-Turbo W16 Engine', status: 'Optimal', temp: '96°C', psi: '2.85 Bar Quad-Boost' },
    { id: 'brakes-front', label: 'Carbon-Silicon Carbide 420mm Brakes', status: 'Nominal', temp: '340°C', life: '96%' },
    { id: 'trans', label: '7-Speed Dual-Clutch Ricardo Gearbox', status: 'Torque 1,600Nm', latency: '2ms Shift' },
    { id: 'radar', label: 'Solid-State LiDAR & Telemetry Pod', status: 'Active CAN-FD', range: '300m Scan' },
    { id: 'airbrake', label: 'Active Hydraulic Aero Wing & Airbrake', status: 'Active 24° Attack', downforce: '450 kg' }
  ]
};

export const CarShowcase = () => {
  const [activeLiveryIndex, setActiveLiveryIndex] = useState(0);
  const [activeMode, setActiveMode] = useState('showroom'); // 'showroom' | 'xray' | 'aero' | 'track'
  const [viewDimension, setViewDimension] = useState('3d'); // '3d' | '2d'
  const [cameraPreset, setCameraPreset] = useState('three-quarters'); // 'three-quarters' | 'side' | 'top' | 'rear'
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isThrottling, setIsThrottling] = useState(false);
  const [speed, setSpeed] = useState(72);
  const [rpm, setRpm] = useState(2600);
  const [boost, setBoost] = useState(1.4);
  const [canFramesCount, setCanFramesCount] = useState(64820);

  const livery = BUGATTI_LIVERIES[activeLiveryIndex];

  // Dynamic W16 throttle acceleration physics simulation
  useEffect(() => {
    let interval = null;
    if (isThrottling) {
      interval = setInterval(() => {
        setSpeed(prev => Math.min(prev + Math.floor(Math.random() * 8 + 5), CHIRON_SPECS.speedMax));
        setRpm(prev => Math.min(prev + Math.floor(Math.random() * 220 + 150), CHIRON_SPECS.rpmMax));
        setBoost(prev => Math.min(Number((prev + 0.15).toFixed(2)), 2.85));
        setCanFramesCount(c => c + 42);
      }, 70);
    } else {
      interval = setInterval(() => {
        setSpeed(prev => Math.max(prev - 3, 65));
        setRpm(prev => Math.max(prev - 110, 2200));
        setBoost(prev => Math.max(Number((prev - 0.09).toFixed(2)), 0.8));
        setCanFramesCount(c => c + 4);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isThrottling]);

  return (
    <section className="car-showcase-section" id="vehicle-dynamics" aria-labelledby="car-showcase-heading">
      {/* Background Cyber Ambient Atmosphere */}
      <div className="car-showcase-backdrop" aria-hidden="true">
        <div className="car-showcase-grid" />
        <div className="car-showcase-glow-1" />
        <div className="car-showcase-glow-2" />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 2.2rem' }}>
          <h2 id="car-showcase-heading" style={{ fontSize: 'clamp(2.1rem, 4.2vw, 3.3rem)', fontWeight: '800', letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.15, margin: '0 0 1rem' }}>
            <span style={{ background: 'linear-gradient(90deg, #0088ff 0%, #00e5ff 40%, #ff1744 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real-Time CAN-FD Bus & 1,500 HP W16 Subsystems
            </span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Inspect the 1,500 HP Quad-Turbo French Hypercar in 360° 3D. Rotate the chassis, switch signature Bugatti dual-tone liveries, inspect the W16 engine core, and launch active telemetry in real time.
          </p>
        </div>

        {/* Real-Time Bugatti Dual-Tone Livery Selector Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          margin: '0 auto 1.75rem',
          padding: '10px 20px',
          background: 'rgba(10, 16, 32, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '35px',
          border: '1px solid rgba(0, 168, 255, 0.25)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          width: 'fit-content'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#00a8ff' }}>
            <Palette size={15} />
            <span>BUGATTI LIVERY:</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {BUGATTI_LIVERIES.map((liv, idx) => (
              <button
                key={liv.id}
                type="button"
                title={liv.name}
                onClick={() => setActiveLiveryIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: activeLiveryIndex === idx ? '2px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: activeLiveryIndex === idx ? 'rgba(0, 168, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: activeLiveryIndex === idx ? '#ffffff' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Dual-Tone Circle Swatch */}
                <span style={{
                  display: 'inline-block',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${liv.primary} 50%, ${liv.secondary} 50%)`,
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: activeLiveryIndex === idx ? `0 0 10px ${liv.primary}` : 'none'
                }} />
                <span>{liv.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Mode Switchers Bar */}
        <div className="car-controls-bar">
          {/* Active Vehicle Spec Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '800', color: '#fff', fontSize: '1rem', letterSpacing: '-0.01em' }}>
              BUGATTI CHIRON PUR SPORT
            </span>
            <span style={{ background: 'rgba(0, 168, 255, 0.12)', color: '#00a8ff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
              W16 QUAD-TURBO
            </span>
          </div>

          {/* 3D vs 2D Toggle */}
          <div className="car-pills-group" role="tablist" aria-label="Dimension view toggle">
            <button
              className={`car-pill-btn ${viewDimension === '3d' ? 'active' : ''}`}
              onClick={() => setViewDimension('3d')}
            >
              <Box size={15} />
              <span>3D WebGL</span>
            </button>
            <button
              className={`car-pill-btn ${viewDimension === '2d' ? 'active' : ''}`}
              onClick={() => setViewDimension('2d')}
            >
              <Layers size={15} />
              <span>2D Blueprint</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="car-pills-group" role="tablist" aria-label="Visualizer view modes">
            <button
              className={`car-pill-btn ${activeMode === 'showroom' ? 'active' : ''}`}
              onClick={() => setActiveMode('showroom')}
            >
              <Sparkles size={15} />
              <span>Showroom 3D</span>
            </button>
            <button
              className={`car-pill-btn ${activeMode === 'xray' ? 'active' : ''}`}
              onClick={() => setActiveMode('xray')}
            >
              <Zap size={15} />
              <span>3D X-Ray</span>
            </button>
            <button
              className={`car-pill-btn ${activeMode === 'aero' ? 'active' : ''}`}
              onClick={() => setActiveMode('aero')}
            >
              <Wind size={15} />
              <span>3D Aero Flow</span>
            </button>
            <button
              className={`car-pill-btn ${activeMode === 'track' ? 'active' : ''}`}
              onClick={() => setActiveMode('track')}
            >
              <Gauge size={15} />
              <span>3D Track Run</span>
            </button>
          </div>
        </div>

        {/* Main Stage Card */}
        <div className="car-stage-card" style={{ padding: '2rem 1.8rem 1.8rem' }}>
          {/* Telemetry Ticker Top Bar */}
          <div className="car-telemetry-ticker">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span className="car-badge-live">
                <span className="car-live-dot" /> CAN-FD 5.0 Mbps
              </span>
              <span>HYPERCAR: <strong style={{ color: '#fff' }}>BUGATTI CHIRON PUR SPORT</strong></span>
              <span style={{ display: 'inline-block', width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#00a8ff' }}>{livery.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {viewDimension === '3d' && (
                <button
                  type="button"
                  onClick={() => setAutoRotate(r => !r)}
                  style={{
                    background: autoRotate ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${autoRotate ? 'rgba(0, 210, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: autoRotate ? '#00d2ff' : '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <RotateCw size={12} className={autoRotate ? 'spin-anim' : ''} />
                  <span>{autoRotate ? '360° Auto-Rotate ON' : 'Turntable PAUSED'}</span>
                </button>
              )}
              <span>PACKETS: <strong style={{ color: '#00ffaa' }}>{canFramesCount.toLocaleString()}</strong></span>
              <span>BUS LOAD: <strong style={{ color: '#fff' }}>{(speed * 0.38 + 12).toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* Center Visual Viewport */}
          <div 
            className="car-visual-viewport" 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              borderRadius: '20px', 
              minHeight: '520px',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(14, 24, 48, 0.7) 0%, rgba(5, 8, 18, 0.98) 100%)',
              border: '1px solid rgba(0, 168, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {viewDimension === '3d' ? (
              /* REAL-TIME 3D WEBGL BUGATTI CHIRON RENDERING */
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Car3DCanvas
                  carType="chiron"
                  primaryColor={livery.primary}
                  secondaryColor={livery.secondary}
                  mode={activeMode}
                  isThrottling={isThrottling}
                  speed={speed}
                  autoRotate={autoRotate}
                  cameraPreset={cameraPreset}
                />
                
                {/* 3D Orbit Drag Hint Badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(8, 12, 24, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0, 168, 255, 0.4)',
                  color: '#00a8ff',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  <Eye size={14} />
                  <span>Click & Drag to Rotate Bugatti Chiron 360°</span>
                </div>

                {/* 3D Camera Angle Preset Buttons */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '6px',
                  zIndex: 15
                }}>
                  {[
                    { id: 'three-quarters', label: '3/4 Angle' },
                    { id: 'side', label: 'Side C-Line' },
                    { id: 'top', label: 'Overhead W16' },
                    { id: 'rear', label: 'Rear Blade' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCameraPreset(preset.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${cameraPreset === preset.id ? '#00a8ff' : 'rgba(255,255,255,0.12)'}`,
                        background: cameraPreset === preset.id ? 'rgba(0, 168, 255, 0.25)' : 'rgba(10, 15, 30, 0.8)',
                        color: cameraPreset === preset.id ? '#00d2ff' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 2D BLUEPRINT VIEW */
              <div style={{ width: '100%', position: 'relative' }}>
                <div className={`car-road-perspective ${activeMode === 'track' || isThrottling ? 'speed-active' : ''}`} />
                {activeMode === 'xray' && <div className="car-scanner-laser" />}
                <div className="car-headlight-beam" />
                <div className="car-taillight-glow" />

                <svg viewBox="0 0 1000 420" style={{ width: '100%', maxWidth: '920px', height: 'auto', zIndex: 10 }}>
                  <ellipse cx="500" cy="335" rx="420" ry="24" fill="rgba(0, 0, 0, 0.75)" />
                  {/* Bugatti Chiron Side Silhouette with C-Line */}
                  <path 
                    d="M 110 270 C 105 240, 115 210, 140 195 C 180 190, 215 155, 275 140 C 365 118, 510 115, 620 150 C 720 185, 785 210, 835 225 C 870 235, 885 255, 875 275 L 865 292 L 135 292 Z" 
                    fill="url(#carBodyGrad)" 
                    stroke="#00a8ff" 
                    strokeWidth="2.5"
                  />
                  {/* Signature Chrome C-Line */}
                  <path d="M 680 165 C 520 150, 410 195, 410 240 C 410 275, 460 288, 620 288" fill="none" stroke="#f8fafc" strokeWidth="4" />
                </svg>
              </div>
            )}

            {/* Hotspot Inspection Popover Drawer */}
            {selectedHotspot && (
              <div className="car-hotspot-drawer" style={{ zIndex: 50 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#00a8ff', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                      Bugatti Chiron W16 Telemetry
                    </span>
                    <h4 style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', color: '#fff', fontWeight: '700' }}>
                      {selectedHotspot.label}
                    </h4>
                  </div>
                  <button 
                    onClick={() => setSelectedHotspot(null)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                  >
                    ✕
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00ffaa', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.8rem' }}>
                  <ShieldCheck size={14} />
                  <span>Status: {selectedHotspot.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                  {selectedHotspot.temp && <div><span style={{ color: '#94a3b8' }}>TEMP:</span> <strong>{selectedHotspot.temp}</strong></div>}
                  {selectedHotspot.psi && <div><span style={{ color: '#94a3b8' }}>BOOST:</span> <strong>{selectedHotspot.psi}</strong></div>}
                  {selectedHotspot.life && <div><span style={{ color: '#94a3b8' }}>PAD LIFE:</span> <strong>{selectedHotspot.life}</strong></div>}
                  {selectedHotspot.downforce && <div><span style={{ color: '#94a3b8' }}>DOWNFORCE:</span> <strong>{selectedHotspot.downforce}</strong></div>}
                  {selectedHotspot.latency && <div><span style={{ color: '#94a3b8' }}>SHIFT:</span> <strong>{selectedHotspot.latency}</strong></div>}
                  {selectedHotspot.range && <div><span style={{ color: '#94a3b8' }}>RANGE:</span> <strong>{selectedHotspot.range}</strong></div>}
                </div>
              </div>
            )}
          </div>

          {/* Subsystem Inspection Bar Below Centered 3D Viewport */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'rgba(10, 16, 32, 0.65)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 168, 255, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#00a8ff' }}>
              <Cpu size={14} />
              <span style={{ fontWeight: '700' }}>W16 SUBSYSTEMS:</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CHIRON_SPECS.hotspots.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHotspot(h)}
                  style={{
                    background: selectedHotspot?.id === h.id ? '#00a8ff' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedHotspot?.id === h.id ? '#050a17' : '#cbd5e1',
                    border: `1px solid ${selectedHotspot?.id === h.id ? '#00a8ff' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{h.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Live Telemetry Dashboard */}
          <div className="car-hud-grid">
            {/* Speedometer Gauge Tile */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                W16 Velocity Speedometer
              </span>
              <div className="car-hud-metric">
                {speed} <span className="car-hud-metric-unit">MPH</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(speed / CHIRON_SPECS.speedMax) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #0088ff, #00e5ff)', transition: 'width 0.1s ease' }} />
              </div>
            </div>

            {/* Tachometer / W16 Output */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                W16 Engine RPM / 1,500 HP
              </span>
              <div className="car-hud-metric" style={{ color: rpm > 5800 ? '#ff1744' : '#ffffff' }}>
                {rpm.toLocaleString()} <span className="car-hud-metric-unit">RPM</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(rpm / CHIRON_SPECS.rpmMax) * 100}%`, height: '100%', background: rpm > 5800 ? '#ff1744' : 'linear-gradient(90deg, #00ffaa, #0088ff)', transition: 'width 0.1s ease' }} />
              </div>
            </div>

            {/* Quad-Turbo Boost */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quad-Turbo Manifold Boost
              </span>
              <div className="car-hud-metric" style={{ color: '#00a8ff' }}>
                {boost} <span className="car-hud-metric-unit">BAR</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                AERO DOWNFORCE: <strong style={{ color: '#fff' }}>{CHIRON_SPECS.downforce}</strong>
              </div>
            </div>

            {/* 4-Corner TPMS Michelin Pilot Sport Cup 2 */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Michelin Cup 2 TPMS Monitor
              </span>
              <div className="car-tpms-grid">
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>FL</span>
                  <strong>36.2 PSI</strong>
                </div>
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>FR</span>
                  <strong>36.4 PSI</strong>
                </div>
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>RL</span>
                  <strong>37.1 PSI</strong>
                </div>
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>RR</span>
                  <strong>37.0 PSI</strong>
                </div>
              </div>
            </div>

            {/* Interactive Launch Button Tile */}
            <div className="car-hud-tile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0, 168, 255, 0.1)', borderColor: 'rgba(0, 168, 255, 0.35)' }}>
              <button 
                type="button"
                className={`car-throttle-btn ${isThrottling ? 'engaged' : ''}`}
                onMouseDown={() => setIsThrottling(true)}
                onMouseUp={() => setIsThrottling(false)}
                onTouchStart={() => setIsThrottling(true)}
                onTouchEnd={() => setIsThrottling(false)}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setIsThrottling(true); }}
                onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') setIsThrottling(false); }}
                style={{
                  background: isThrottling ? 'linear-gradient(135deg, #ff1744 0%, #ff5252 100%)' : 'linear-gradient(135deg, #0088ff 0%, #00e5ff 100%)'
                }}
              >
                <Flame size={18} />
                <span>{isThrottling ? 'LAUNCHING W16...' : 'HOLD THROTTLE'}</span>
              </button>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                Press & hold to rev 1,500 HP W16
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default CarShowcase;
