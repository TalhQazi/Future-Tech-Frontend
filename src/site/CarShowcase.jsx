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
  Layers
} from 'lucide-react';
import { Car3DCanvas } from './Car3DCanvas.jsx';
import './car-animations.css';

// 4 Hyper-realistic futuristic car specs
const CAR_PROFILES = [
  {
    id: 'apex-gt',
    name: 'Apex GT Hypercar',
    category: 'Twin-Turbo V8 Hybrid · 1,020 HP',
    type: 'Coupe / Track Spec',
    speedMax: 218,
    rpmMax: 8800,
    downforce: '580 kg @ 160 mph',
    dragCd: '0.24 Cd',
    hotspots: [
      { id: 'engine', label: '4.0L Twin-Turbo Hybrid V8', status: 'Optimal', temp: '94°C', psi: '2.4 Bar Boost' },
      { id: 'brakes-front', label: 'Carbon-Ceramic Rotors (410mm)', status: 'Nominal', temp: '320°C', life: '92%' },
      { id: 'brakes-rear', label: 'Rear Active Calipers', status: 'Nominal', temp: '280°C', life: '94%' },
      { id: 'lidar', label: 'Front Solid-State LiDAR', status: 'Active', range: '250m Scan', fov: '120°' },
      { id: 'aero-wing', label: 'Active Carbon DRS Wing', status: 'Dynamic', angle: '18° Attack', downforce: '280 kg' }
    ]
  },
  {
    id: 'cyber-pulse',
    name: 'CyberPulse EV Sedan',
    category: 'Tri-Motor 800V AWD · 760 kW',
    type: 'Next-Gen Electric GT',
    speedMax: 195,
    rpmMax: 18500,
    downforce: '340 kg @ 140 mph',
    dragCd: '0.208 Cd',
    hotspots: [
      { id: 'battery', label: '98 kWh Solid-State Battery Floor', status: 'SOC 88%', temp: '32°C', health: '99.4%' },
      { id: 'inverter-front', label: 'Silicon Carbide (SiC) Inverter', status: '98.6% Eff', voltage: '812 VDC' },
      { id: 'inverter-rear', label: 'Dual Rear PMSM Motors', status: 'Torque Vectoring', nm: '1,150 Nm' },
      { id: 'camera-suite', label: 'Autonomous Vision 360°', status: 'L3 Enabled', latency: '4ms' }
    ]
  },
  {
    id: 'titan-recon',
    name: 'Titan Recon Overlander',
    category: 'Quad-Motor Active Hydraulic Lift',
    type: 'Tactical Cyber SUV',
    speedMax: 155,
    rpmMax: 12000,
    downforce: 'Active Leveling',
    dragCd: '0.31 Cd',
    hotspots: [
      { id: 'air-suspension', label: 'Hydropneumatic Variable Ride', status: 'Lift +60mm', damping: 'Adaptive' },
      { id: 'quad-powertrain', label: 'Independent 4-Wheel Torque', status: 'Crawl Mode', slip: '0.2%' },
      { id: 'aux-radar', label: 'Forward Ground Penetrating Radar', status: 'Terrain Scan', depth: '1.5m' },
      { id: 'roof-pods', label: 'Telemetry Satellite Link', status: '5G / Starlink', ping: '18ms' }
    ]
  },
  {
    id: 'formula-spec',
    name: 'Formula Prototype LMP',
    category: 'Carbon Monocoque · Ground Effect Venturi',
    type: 'Le Mans Prototype',
    speedMax: 235,
    rpmMax: 10500,
    downforce: '920 kg @ 180 mph',
    dragCd: '0.29 Cd',
    hotspots: [
      { id: 'monocoque', label: 'T1000 Carbon Monocoque', status: 'Torsional 45kNm/deg', integrity: '100%' },
      { id: 'venturi-tunnel', label: 'Underbody Venturi Tunnels', status: 'Ground Effect', suction: '-4.2 kPa' },
      { id: 'shark-fin', label: 'Dorsal Stabilizer Fin', status: 'Yaw Control', yawRate: '0.04 rad/s' },
      { id: 'front-wing', label: 'Multi-Element Carbon Wing', status: 'Vortex Tuned', vortices: 'Stable' }
    ]
  }
];

export const CarShowcase = () => {
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [activeMode, setActiveMode] = useState('xray'); // 'xray' | 'aero' | 'track'
  const [viewDimension, setViewDimension] = useState('3d'); // '3d' | '2d'
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isThrottling, setIsThrottling] = useState(false);
  const [speed, setSpeed] = useState(65);
  const [rpm, setRpm] = useState(3200);
  const [boost, setBoost] = useState(1.1);
  const [canFramesCount, setCanFramesCount] = useState(48290);

  const car = CAR_PROFILES[selectedCarIndex];

  // Dynamic throttle acceleration physics simulation
  useEffect(() => {
    let interval = null;
    if (isThrottling) {
      interval = setInterval(() => {
        setSpeed(prev => Math.min(prev + Math.floor(Math.random() * 6 + 4), car.speedMax));
        setRpm(prev => Math.min(prev + Math.floor(Math.random() * 250 + 180), car.rpmMax));
        setBoost(prev => Math.min(Number((prev + 0.12).toFixed(2)), 2.8));
        setCanFramesCount(c => c + 34);
      }, 70);
    } else {
      interval = setInterval(() => {
        setSpeed(prev => Math.max(prev - 3, 58));
        setRpm(prev => Math.max(prev - 120, 2400));
        setBoost(prev => Math.max(Number((prev - 0.08).toFixed(2)), 0.6));
        setCanFramesCount(c => c + 4);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isThrottling, car.speedMax, car.rpmMax]);

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
        <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '6px 14px', borderRadius: '20px', background: 'rgba(0, 210, 255, 0.08)', border: '1px solid rgba(0, 210, 255, 0.25)', marginBottom: '1rem' }}>
            <Activity size={15} style={{ color: '#00d2ff' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.08em', color: '#00d2ff', textTransform: 'uppercase' }}>
              True 3D Interactive Telematics Engine
            </span>
          </div>
          <h2 id="car-showcase-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: '800', letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.15, margin: '0 0 1rem' }}>
            Interactive 3D Vehicle Dynamics. <br />
            <span style={{ background: 'linear-gradient(90deg, #00d2ff 0%, #7957ff 50%, #ff5d7d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Rendered in real time with WebGL.
            </span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Inspect full 360° rotating chassis models, internal high-voltage powertrain schematics, and live 3D aerodynamic wind-tunnel particle simulations. Click and drag anywhere to orbit in 3D.
          </p>
        </div>

        {/* Vehicle Selection & Mode Switchers Bar */}
        <div className="car-controls-bar">
          {/* Select Car Architecture */}
          <div className="car-pills-group" role="tablist" aria-label="Select vehicle architecture">
            {CAR_PROFILES.map((c, i) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={selectedCarIndex === i}
                className={`car-pill-btn ${selectedCarIndex === i ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCarIndex(i);
                  setSelectedHotspot(null);
                }}
              >
                <span>{c.name}</span>
              </button>
            ))}
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
        <div className="car-stage-card">
          {/* Telemetry Ticker Top Bar */}
          <div className="car-telemetry-ticker">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="car-badge-live">
                <span className="car-live-dot" /> CAN-FD 5.0 Mbps
              </span>
              <span>3D CHASSIS: <strong style={{ color: '#fff' }}>{car.name.toUpperCase()}</strong></span>
              <span style={{ display: 'inline-block', width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#00d2ff' }}>{car.category}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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
          <div className="car-visual-viewport" style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
            {viewDimension === '3d' ? (
              /* REAL-TIME 3D WEBGL RENDERING */
              <div style={{ width: '100%', position: 'relative' }}>
                <Car3DCanvas
                  carType={car.id}
                  mode={activeMode}
                  isThrottling={isThrottling}
                  speed={speed}
                  autoRotate={autoRotate}
                />
                
                {/* 3D Orbit Drag Hint Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(8, 12, 24, 0.75)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  color: '#00d2ff',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  pointerEvents: 'none'
                }}>
                  <Eye size={13} />
                  <span>Click & Drag to Rotate 360° in 3D</span>
                </div>

                {/* 3D Component Inspection Selector Pills */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  maxWidth: '75%',
                  zIndex: 20
                }}>
                  {car.hotspots.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHotspot(h)}
                      style={{
                        background: selectedHotspot?.id === h.id ? '#00d2ff' : 'rgba(8, 14, 28, 0.85)',
                        color: selectedHotspot?.id === h.id ? '#050a17' : '#94a3b8',
                        border: `1px solid ${selectedHotspot?.id === h.id ? '#00d2ff' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Cpu size={11} />
                      <span>{h.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 2D BLUEPRINT & SCHEMATIC VIEW */
              <div style={{ width: '100%', position: 'relative' }}>
                <div className={`car-road-perspective ${activeMode === 'track' || isThrottling ? 'speed-active' : ''}`} />
                {activeMode === 'xray' && <div className="car-scanner-laser" />}
                <div className="car-headlight-beam" />
                <div className="car-taillight-glow" />

                {activeMode === 'aero' && (
                  <svg className="car-aero-stream" viewBox="0 0 1000 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="aero-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(0, 210, 255, 0)" />
                        <stop offset="25%" stopColor="rgba(0, 210, 255, 0.85)" />
                        <stop offset="70%" stopColor="rgba(121, 87, 255, 0.9)" />
                        <stop offset="100%" stopColor="rgba(255, 93, 125, 0.1)" />
                      </linearGradient>
                    </defs>
                    <path d="M 960 210 C 850 205, 780 180, 680 130 C 580 80, 420 85, 340 120 C 260 160, 180 190, 40 215" />
                    <path d="M 960 240 C 830 235, 760 220, 690 190 C 600 150, 450 145, 360 165 C 280 190, 200 230, 40 250" style={{ animationDelay: '-0.4s' }} />
                    <path d="M 960 270 C 800 270, 720 280, 640 285 C 500 290, 320 290, 220 285 C 150 280, 90 275, 40 270" style={{ animationDelay: '-0.8s' }} />
                  </svg>
                )}

                <svg 
                  viewBox="0 0 1000 420" 
                  style={{ width: '100%', maxWidth: '920px', height: 'auto', zIndex: 10 }}
                >
                  <defs>
                    <linearGradient id="carBodyGrad" x1="0" y1="0" x2="1" y2="0.6">
                      <stop offset="0%" stopColor="#0c142b" />
                      <stop offset="40%" stopColor="#132042" />
                      <stop offset="70%" stopColor="#1a2d5e" />
                      <stop offset="100%" stopColor="#091226" />
                    </linearGradient>
                    <linearGradient id="neonCyan" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7957ff" />
                      <stop offset="50%" stopColor="#00d2ff" />
                      <stop offset="100%" stopColor="#36d6f5" />
                    </linearGradient>
                  </defs>

                  <ellipse cx="500" cy="335" rx="420" ry="24" fill="rgba(0, 0, 0, 0.75)" />
                  <path 
                    d="M 110 270 C 105 240, 115 210, 140 195 C 180 190, 215 155, 275 140 C 365 118, 510 115, 620 150 C 720 185, 785 210, 835 225 C 870 235, 885 255, 875 275 L 865 292 C 830 292, 805 245, 745 245 C 685 245, 660 292, 625 292 L 375 292 C 340 292, 315 245, 255 245 C 195 245, 170 292, 135 292 Z" 
                    fill="url(#carBodyGrad)" 
                    stroke="url(#neonCyan)" 
                    strokeWidth="2.5"
                  />
                  <polygon points="840,240 865,246 850,258 825,250" fill="#00ffff" />
                  <path d="M 112 245 C 110 230, 115 218, 125 215" fill="none" stroke="#ff2d55" strokeWidth="5" />
                  
                  {/* Front & rear wheels */}
                  <g transform="translate(715, 275)">
                    <circle cx="0" cy="0" r="48" fill="#0b1120" stroke="#1f2d4d" strokeWidth="10" />
                    <circle cx="0" cy="0" r="34" fill="#1c253d" stroke="#485c8a" strokeWidth="2" strokeDasharray="3 3" />
                    <g className={`car-wheel-rim ${isThrottling ? 'rolling-fast' : 'rolling'}`}>
                      <circle cx="0" cy="0" r="12" fill="#070c17" stroke="#00d2ff" strokeWidth="2" />
                      <line x1="0" y1="-30" x2="0" y2="30" stroke="#7957ff" strokeWidth="3" />
                      <line x1="-26" y1="-15" x2="26" y2="15" stroke="#7957ff" strokeWidth="3" />
                      <line x1="-26" y1="15" x2="26" y2="-15" stroke="#7957ff" strokeWidth="3" />
                    </g>
                  </g>
                  <g transform="translate(245, 275)">
                    <circle cx="0" cy="0" r="48" fill="#0b1120" stroke="#1f2d4d" strokeWidth="10" />
                    <circle cx="0" cy="0" r="34" fill="#1c253d" stroke="#485c8a" strokeWidth="2" strokeDasharray="3 3" />
                    <g className={`car-wheel-rim ${isThrottling ? 'rolling-fast' : 'rolling'}`}>
                      <circle cx="0" cy="0" r="12" fill="#070c17" stroke="#00d2ff" strokeWidth="2" />
                      <line x1="0" y1="-30" x2="0" y2="30" stroke="#7957ff" strokeWidth="3" />
                      <line x1="-26" y1="-15" x2="26" y2="15" stroke="#7957ff" strokeWidth="3" />
                      <line x1="-26" y1="15" x2="26" y2="-15" stroke="#7957ff" strokeWidth="3" />
                    </g>
                  </g>
                </svg>
              </div>
            )}

            {/* Hotspot Inspection Popover Drawer */}
            {selectedHotspot && (
              <div className="car-hotspot-drawer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#00d2ff', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                      Diagnostic Telemetry
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
                  {selectedHotspot.psi && <div><span style={{ color: '#94a3b8' }}>PRESSURE:</span> <strong>{selectedHotspot.psi}</strong></div>}
                  {selectedHotspot.voltage && <div><span style={{ color: '#94a3b8' }}>VOLT:</span> <strong>{selectedHotspot.voltage}</strong></div>}
                  {selectedHotspot.life && <div><span style={{ color: '#94a3b8' }}>PAD LIFE:</span> <strong>{selectedHotspot.life}</strong></div>}
                  {selectedHotspot.downforce && <div><span style={{ color: '#94a3b8' }}>AERO:</span> <strong>{selectedHotspot.downforce}</strong></div>}
                  {selectedHotspot.latency && <div><span style={{ color: '#94a3b8' }}>LATENCY:</span> <strong>{selectedHotspot.latency}</strong></div>}
                  {selectedHotspot.range && <div><span style={{ color: '#94a3b8' }}>RANGE:</span> <strong>{selectedHotspot.range}</strong></div>}
                  {selectedHotspot.fov && <div><span style={{ color: '#94a3b8' }}>FOV:</span> <strong>{selectedHotspot.fov}</strong></div>}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Live Telemetry Dashboard */}
          <div className="car-hud-grid">
            {/* Speedometer Gauge Tile */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Velocity Speedometer
              </span>
              <div className="car-hud-metric">
                {speed} <span className="car-hud-metric-unit">MPH</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(speed / car.speedMax) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #00d2ff, #7957ff)', transition: 'width 0.1s ease' }} />
              </div>
            </div>

            {/* Tachometer / Power Output */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Engine RPM / Inverter
              </span>
              <div className="car-hud-metric" style={{ color: rpm > 6500 ? '#ff5d7d' : '#ffffff' }}>
                {rpm.toLocaleString()} <span className="car-hud-metric-unit">RPM</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(rpm / car.rpmMax) * 100}%`, height: '100%', background: rpm > 6500 ? '#ff2d55' : 'linear-gradient(90deg, #00ffaa, #00d2ff)', transition: 'width 0.1s ease' }} />
              </div>
            </div>

            {/* Turbo Boost / Telemetry */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Manifold Pressure / Boost
              </span>
              <div className="car-hud-metric" style={{ color: '#00d2ff' }}>
                {boost} <span className="car-hud-metric-unit">BAR</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                AERO LOAD: <strong style={{ color: '#fff' }}>{car.downforce}</strong>
              </div>
            </div>

            {/* 4-Corner TPMS Tire Pressure Monitor */}
            <div className="car-hud-tile">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quad-Tire TPMS Monitor
              </span>
              <div className="car-tpms-grid">
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>FL</span>
                  <strong>34.2 PSI</strong>
                </div>
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>FR</span>
                  <strong>34.4 PSI</strong>
                </div>
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>RL</span>
                  <strong>35.1 PSI</strong>
                </div>
                <div className="car-tpms-item">
                  <span style={{ color: '#94a3b8' }}>RR</span>
                  <strong>35.0 PSI</strong>
                </div>
              </div>
            </div>

            {/* Interactive Launch Button Tile */}
            <div className="car-hud-tile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(121, 87, 255, 0.08)', borderColor: 'rgba(121, 87, 255, 0.3)' }}>
              <button 
                type="button"
                className={`car-throttle-btn ${isThrottling ? 'engaged' : ''}`}
                onMouseDown={() => setIsThrottling(true)}
                onMouseUp={() => setIsThrottling(false)}
                onTouchStart={() => setIsThrottling(true)}
                onTouchEnd={() => setIsThrottling(false)}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setIsThrottling(true); }}
                onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') setIsThrottling(false); }}
              >
                <Flame size={18} />
                <span>{isThrottling ? 'LAUNCHING...' : 'HOLD THROTTLE'}</span>
              </button>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                Press & hold to rev 3D vehicle
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default CarShowcase;
