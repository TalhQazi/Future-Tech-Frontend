import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Wind, 
  Gauge, 
  Activity, 
  Sliders, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight,
  Flame,
  Radio,
  Cpu
} from 'lucide-react';
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
      { id: 'engine', x: 38, y: 52, label: '4.0L Twin-Turbo Hybrid V8', status: 'Optimal', temp: '94°C', psi: '2.4 Bar Boost' },
      { id: 'brakes-front', x: 74, y: 64, label: 'Carbon-Ceramic Rotors (410mm)', status: 'Nominal', temp: '320°C', life: '92%' },
      { id: 'brakes-rear', x: 23, y: 64, label: 'Rear Active Calipers', status: 'Nominal', temp: '280°C', life: '94%' },
      { id: 'lidar', x: 84, y: 53, label: 'Front Solid-State LiDAR', status: 'Active', range: '250m Scan', fov: '120°' },
      { id: 'aero-wing', x: 12, y: 35, label: 'Active Carbon DRS Wing', status: 'Dynamic', angle: '18° Attack', downforce: '280 kg' }
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
      { id: 'battery', x: 50, y: 65, label: '98 kWh Solid-State Battery Floor', status: 'SOC 88%', temp: '32°C', health: '99.4%' },
      { id: 'inverter-front', x: 73, y: 54, label: 'Silicon Carbide (SiC) Inverter', status: '98.6% Eff', voltage: '812 VDC' },
      { id: 'inverter-rear', x: 26, y: 54, label: 'Dual Rear PMSM Motors', status: 'Torque Vectoring', nm: '1,150 Nm' },
      { id: 'camera-suite', x: 58, y: 32, label: 'Autonomous Vision 360°', status: 'L3 Enabled', latency: '4ms' }
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
      { id: 'air-suspension', x: 72, y: 58, label: 'Hydropneumatic Variable Ride', status: 'Lift +60mm', damping: 'Adaptive' },
      { id: 'quad-powertrain', x: 48, y: 60, label: 'Independent 4-Wheel Torque', status: 'Crawl Mode', slip: '0.2%' },
      { id: 'aux-radar', x: 86, y: 48, label: 'Forward Ground Penetrating Radar', status: 'Terrain Scan', depth: '1.5m' },
      { id: 'roof-pods', x: 42, y: 22, label: 'Telemetry Satellite Link', status: '5G / Starlink', ping: '18ms' }
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
      { id: 'monocoque', x: 52, y: 48, label: 'T1000 Carbon Monocoque', status: 'Torsional 45kNm/deg', integrity: '100%' },
      { id: 'venturi-tunnel', x: 44, y: 68, label: 'Underbody Venturi Tunnels', status: 'Ground Effect', suction: '-4.2 kPa' },
      { id: 'shark-fin', x: 28, y: 28, label: 'Dorsal Stabilizer Fin', status: 'Yaw Control', yawRate: '0.04 rad/s' },
      { id: 'front-wing', x: 86, y: 62, label: 'Multi-Element Carbon Wing', status: 'Vortex Tuned', vortices: 'Stable' }
    ]
  }
];

export const CarShowcase = () => {
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [activeMode, setActiveMode] = useState('xray'); // 'xray' | 'aero' | 'track'
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
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '6px 14px', borderRadius: '20px', background: 'rgba(0, 210, 255, 0.08)', border: '1px solid rgba(0, 210, 255, 0.25)', marginBottom: '1rem' }}>
            <Activity size={15} style={{ color: '#00d2ff' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.08em', color: '#00d2ff', textTransform: 'uppercase' }}>
              High-Speed Digital Twin & Telematics
            </span>
          </div>
          <h2 id="car-showcase-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: '800', letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.15, margin: '0 0 1rem' }}>
            Every vehicle has a heartbeat. <br />
            <span style={{ background: 'linear-gradient(90deg, #00d2ff 0%, #7957ff 50%, #ff5d7d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              We render it in real time.
            </span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Inspect full-chassis powertrain schematics, aerodynamic wind-tunnel simulations, and live CAN-FD telemetry frames streaming straight from the vehicle’s ECU bus.
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

          {/* Mode Switcher */}
          <div className="car-pills-group" role="tablist" aria-label="Visualizer view modes">
            <button
              className={`car-pill-btn ${activeMode === 'xray' ? 'active' : ''}`}
              onClick={() => setActiveMode('xray')}
            >
              <Zap size={15} />
              <span>X-Ray Diagnostics</span>
            </button>
            <button
              className={`car-pill-btn ${activeMode === 'aero' ? 'active' : ''}`}
              onClick={() => setActiveMode('aero')}
            >
              <Wind size={15} />
              <span>Aero Stream</span>
            </button>
            <button
              className={`car-pill-btn ${activeMode === 'track' ? 'active' : ''}`}
              onClick={() => setActiveMode('track')}
            >
              <Gauge size={15} />
              <span>Track Velocity</span>
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
              <span>CHASSIS: <strong style={{ color: '#fff' }}>{car.name.toUpperCase()}</strong></span>
              <span style={{ display: 'inline-block', width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#00d2ff' }}>{car.category}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <span>PACKETS: <strong style={{ color: '#00ffaa' }}>{canFramesCount.toLocaleString()}</strong></span>
              <span>BUS LOAD: <strong style={{ color: '#fff' }}>{(speed * 0.38 + 12).toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* Center Visual Viewport */}
          <div className="car-visual-viewport">
            {/* 3D Perspective Road Grid */}
            <div className={`car-road-perspective ${activeMode === 'track' || isThrottling ? 'speed-active' : ''}`} />

            {/* X-Ray Laser Scanner Beam */}
            {activeMode === 'xray' && <div className="car-scanner-laser" />}

            {/* Headlight & Taillight Beams */}
            <div className="car-headlight-beam" />
            <div className="car-taillight-glow" />

            {/* Aerodynamic Wind Tunnel Vector Streamlines */}
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
                {/* Wind streamlines flowing over vehicle contours */}
                <path d="M 960 210 C 850 205, 780 180, 680 130 C 580 80, 420 85, 340 120 C 260 160, 180 190, 40 215" />
                <path d="M 960 240 C 830 235, 760 220, 690 190 C 600 150, 450 145, 360 165 C 280 190, 200 230, 40 250" style={{ animationDelay: '-0.4s' }} />
                <path d="M 960 270 C 800 270, 720 280, 640 285 C 500 290, 320 290, 220 285 C 150 280, 90 275, 40 270" style={{ animationDelay: '-0.8s' }} />
                <path d="M 960 160 C 860 160, 750 110, 640 70 C 520 25, 380 40, 290 80 C 190 130, 120 160, 40 180" style={{ animationDelay: '-1.1s' }} />
              </svg>
            )}

            {/* Dynamic Hand-Crafted SVG Supercar & Vehicle Wireframe */}
            <svg 
              viewBox="0 0 1000 420" 
              style={{ 
                width: '100%', 
                maxWidth: '920px', 
                height: 'auto', 
                zIndex: 10,
                filter: isThrottling ? 'drop-shadow(0 0 25px rgba(0, 210, 255, 0.6))' : 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.8))'
              }}
            >
              <defs>
                {/* Body Metallic Gradient */}
                <linearGradient id="carBodyGrad" x1="0" y1="0" x2="1" y2="0.6">
                  <stop offset="0%" stopColor="#0c142b" />
                  <stop offset="40%" stopColor="#132042" />
                  <stop offset="70%" stopColor="#1a2d5e" />
                  <stop offset="100%" stopColor="#091226" />
                </linearGradient>

                {/* Cyber Glow Accent */}
                <linearGradient id="neonCyan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7957ff" />
                  <stop offset="50%" stopColor="#00d2ff" />
                  <stop offset="100%" stopColor="#36d6f5" />
                </linearGradient>

                <linearGradient id="wheelGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1a233a" />
                  <stop offset="50%" stopColor="#070d1a" />
                  <stop offset="100%" stopColor="#283452" />
                </linearGradient>

                {/* Laser scanning clip */}
                <filter id="glow-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ground Shadow */}
              <ellipse cx="500" cy="335" rx="420" ry="24" fill="rgba(0, 0, 0, 0.75)" />
              <ellipse cx="500" cy="335" rx="350" ry="12" fill="rgba(0, 210, 255, 0.15)" filter="url(#glow-blur)" />

              {/* ===================== VEHICLE SILHOUETTE ===================== */}
              {/* Underbody Venturi Chassis */}
              <path 
                d="M 120 295 L 860 295 L 840 315 L 140 315 Z" 
                fill="#070c17" 
                stroke="#00d2ff" 
                strokeWidth="1.5"
                opacity="0.8" 
              />

              {/* Main Body Shell Curve */}
              <path 
                d="M 110 270 
                   C 105 240, 115 210, 140 195 
                   C 180 190, 215 155, 275 140 
                   C 365 118, 510 115, 620 150 
                   C 720 185, 785 210, 835 225 
                   C 870 235, 885 255, 875 275 
                   L 865 292 
                   C 830 292, 805 245, 745 245 
                   C 685 245, 660 292, 625 292 
                   L 375 292 
                   C 340 292, 315 245, 255 245 
                   C 195 245, 170 292, 135 292 
                   Z" 
                fill="url(#carBodyGrad)" 
                stroke="url(#neonCyan)" 
                strokeWidth="2.5"
              />

              {/* Cabin Greenhouse & Glass */}
              <path 
                d="M 310 155 
                   C 360 135, 460 128, 560 145 
                   C 630 158, 680 185, 715 210 
                   L 490 210 
                   L 310 205 
                   Z" 
                fill="rgba(0, 210, 255, 0.12)" 
                stroke="#00d2ff" 
                strokeWidth="1.8" 
              />
              {/* Window A-Pillar and B-Pillar */}
              <line x1="500" y1="135" x2="490" y2="210" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="3" />
              <line x1="630" y1="165" x2="600" y2="210" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="2" />

              {/* Aerodynamic Shoulder Crease Line */}
              <path 
                d="M 140 220 C 260 220, 390 200, 560 215 C 680 225, 780 238, 860 250" 
                fill="none" 
                stroke="rgba(0, 210, 255, 0.4)" 
                strokeWidth="1.5" 
                strokeDasharray="4 2" 
              />

              {/* Front Razor-Sharp Matrix LED Headlight */}
              <polygon points="840,240 865,246 850,258 825,250" fill="#00ffff" filter="url(#glow-blur)" />
              <polygon points="840,240 865,246 850,258 825,250" fill="#ffffff" />

              {/* Rear Cyberpunk Laser Taillight Bar */}
              <path d="M 112 245 C 110 230, 115 218, 125 215" fill="none" stroke="#ff2d55" strokeWidth="5" filter="url(#glow-blur)" />
              <path d="M 112 245 C 110 230, 115 218, 125 215" fill="none" stroke="#ffffff" strokeWidth="2" />

              {/* Rear Carbon Aero Wing (Apex GT & Formula) */}
              {(selectedCarIndex === 0 || selectedCarIndex === 3) && (
                <g>
                  {/* Wing uprights */}
                  <line x1="140" y1="195" x2="135" y2="155" stroke="#7957ff" strokeWidth="3" />
                  <line x1="175" y1="192" x2="170" y2="155" stroke="#7957ff" strokeWidth="3" />
                  {/* Wing blade */}
                  <path d="M 110 155 Q 160 148 210 156" fill="none" stroke="#00d2ff" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 105 152 L 120 160" stroke="#ff2d55" strokeWidth="4" />
                </g>
              )}

              {/* X-Ray Mode Internal Components Schema */}
              {activeMode === 'xray' && (
                <g opacity="0.9">
                  {/* Floorpan Battery Pack Matrix */}
                  <rect x="365" y="240" width="245" height="24" rx="4" fill="rgba(0, 210, 255, 0.15)" stroke="#00d2ff" strokeWidth="1.5" />
                  {/* Battery cell dividers */}
                  {[395, 425, 455, 485, 515, 545, 575].map((bx, idx) => (
                    <line key={idx} x1={bx} y1="242" x2={bx} y2="262" stroke="rgba(0, 255, 170, 0.6)" strokeWidth="1.5" />
                  ))}

                  {/* Powertrain Motor / Engine Core */}
                  <circle cx="390" cy="225" r="28" fill="rgba(255, 93, 125, 0.18)" stroke="#ff5d7d" strokeWidth="2" />
                  <circle cx="390" cy="225" r="14" fill="rgba(255, 255, 255, 0.1)" stroke="#ff5d7d" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Inverter & High Voltage Bus Lines */}
                  <path d="M 390 225 L 490 230 L 710 235" fill="none" stroke="#00ffaa" strokeWidth="2" strokeDasharray="6 4" />
                  
                  {/* Front LiDAR Scanner Radar Waves */}
                  <path d="M 865 246 C 890 240, 915 235, 940 230" fill="none" stroke="#00d2ff" strokeWidth="1.8" opacity="0.8" />
                  <path d="M 870 248 C 905 244, 940 242, 975 240" fill="none" stroke="#00d2ff" strokeWidth="1.2" opacity="0.5" />
                </g>
              )}

              {/* ===================== FRONT WHEEL ASSEMBLY ===================== */}
              <g transform="translate(715, 275)">
                {/* Tire Rubber Outer Ring */}
                <circle cx="0" cy="0" r="48" fill="#0b1120" stroke="#1f2d4d" strokeWidth="10" />
                {/* Brake Rotor & Vents */}
                <circle cx="0" cy="0" r="34" fill="#1c253d" stroke="#485c8a" strokeWidth="2" strokeDasharray="3 3" />
                {/* Brembo Performance Caliper */}
                <path d="M -15 -30 C -2 -34, 18 -34, 30 -20" fill="none" stroke="#00d2ff" strokeWidth="8" strokeLinecap="round" />
                
                {/* Spinning Wheel Rim Spokes */}
                <g className={`car-wheel-rim ${isThrottling ? 'rolling-fast' : 'rolling'}`}>
                  <circle cx="0" cy="0" r="12" fill="#070c17" stroke="#00d2ff" strokeWidth="2" />
                  <line x1="0" y1="-30" x2="0" y2="30" stroke="#7957ff" strokeWidth="3" />
                  <line x1="-26" y1="-15" x2="26" y2="15" stroke="#7957ff" strokeWidth="3" />
                  <line x1="-26" y1="15" x2="26" y2="-15" stroke="#7957ff" strokeWidth="3" />
                  <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="1.5" />
                </g>
              </g>

              {/* ===================== REAR WHEEL ASSEMBLY ===================== */}
              <g transform="translate(245, 275)">
                {/* Tire Rubber Outer Ring */}
                <circle cx="0" cy="0" r="48" fill="#0b1120" stroke="#1f2d4d" strokeWidth="10" />
                {/* Brake Rotor */}
                <circle cx="0" cy="0" r="34" fill="#1c253d" stroke="#485c8a" strokeWidth="2" strokeDasharray="3 3" />
                {/* Performance Caliper */}
                <path d="M -15 -30 C -2 -34, 18 -34, 30 -20" fill="none" stroke="#ff2d55" strokeWidth="8" strokeLinecap="round" />
                
                {/* Spinning Wheel Rim Spokes */}
                <g className={`car-wheel-rim ${isThrottling ? 'rolling-fast' : 'rolling'}`}>
                  <circle cx="0" cy="0" r="12" fill="#070c17" stroke="#00d2ff" strokeWidth="2" />
                  <line x1="0" y1="-30" x2="0" y2="30" stroke="#7957ff" strokeWidth="3" />
                  <line x1="-26" y1="-15" x2="26" y2="15" stroke="#7957ff" strokeWidth="3" />
                  <line x1="-26" y1="15" x2="26" y2="-15" stroke="#7957ff" strokeWidth="3" />
                  <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255, 45, 85, 0.4)" strokeWidth="1.5" />
                </g>
              </g>
            </svg>

            {/* Interactive Hotspots Overlaid on Vehicle */}
            {activeMode === 'xray' && car.hotspots.map((h) => (
              <div 
                key={h.id} 
                className={`car-hotspot ${selectedHotspot?.id === h.id ? 'selected' : ''}`}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                onClick={() => setSelectedHotspot(h)}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${h.label}`}
              >
                <div className="car-hotspot-pin">
                  <Cpu size={12} />
                </div>
                <div className="car-hotspot-pulse" />
              </div>
            ))}

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
                Press & hold to rev telemetry
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default CarShowcase;
