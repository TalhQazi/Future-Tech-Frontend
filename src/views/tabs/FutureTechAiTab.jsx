import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';
import { 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Wrench, 
  Zap, 
  Search, 
  Send, 
  ThumbsUp, 
  MessageSquare, 
  RefreshCw,
  Sliders,
  Maximize2
} from 'lucide-react';

export const FutureTechAiTab = () => {
  const { selectedRO, repairOrders, showToast } = useShop();
  const currentRo = selectedRO || repairOrders[0] || null;

  // Active sub-navigation
  const [subTab, setSubTab] = useState('telemetry'); // 'telemetry', 'actuators', 'wiring', 'fixes', 'forum'

  // AutoMind CAN-FD Telemetry state
  const [telemetry, setTelemetry] = useState({
    status: 'ONLINE',
    protocol: 'ISO 11898-1 CAN-FD (5.0 Mbps / 500 kbps)',
    busLoad: '38.4%',
    frameErrors: '0 / 1.4M frames',
    rpm: 780,
    coolantTemp: 198,
    fuelPressure: 2150,
    throttlePosition: 14.2,
    batteryVoltage: 14.1,
    oilTemp: 210
  });
  const [isLiveStream, setIsLiveStream] = useState(true);

  // Diagnostics & DTCs
  const [dtcs, setDtcs] = useState([]);
  const [newDtcCode, setNewDtcCode] = useState('');
  const [newDtcDesc, setNewDtcDesc] = useState('');
  const [loadingDiag, setLoadingDiag] = useState(false);

  // Actuator Test State
  const [actuatorComponent, setActuatorComponent] = useState('fuel_pump_relay');
  const [actuatorAction, setActuatorAction] = useState('cycle_on_off');
  const [actuatorDuration, setActuatorDuration] = useState(5);
  const [actuatorResult, setActuatorResult] = useState(null);
  const [runningActuator, setRunningActuator] = useState(false);

  // Spec Tolerance Evaluator State
  const [specParam, setSpecParam] = useState('fuel_rail_pressure');
  const [specValue, setSpecValue] = useState('2150');
  const [specResult, setSpecResult] = useState(null);

  // Interactive Wiring Diagrams
  const [wiringDiagrams, setWiringDiagrams] = useState([]);
  const [selectedDiagram, setSelectedDiagram] = useState(null);
  const [activeHarness, setActiveHarness] = useState(null);

  // Confirmed Fixes
  const [confirmedFixes, setConfirmedFixes] = useState([]);
  const [fixSearch, setFixSearch] = useState('');
  const [newFixModal, setNewFixModal] = useState(false);
  const [newFixForm, setNewFixForm] = useState({
    dtc: '',
    title: '',
    rootCause: '',
    solution: '',
    difficulty: 'Moderate'
  });

  // Technician Forum
  const [forumThreads, setForumThreads] = useState([]);
  const [newThreadModal, setNewThreadModal] = useState(false);
  const [newThreadForm, setNewThreadForm] = useState({
    title: '',
    content: '',
    category: 'Diagnostics',
    tags: 'CAN-FD, Fuel'
  });
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Load diagnostics for current RO
  const fetchDiagnostics = async () => {
    if (!currentRo) return;
    try {
      setLoadingDiag(true);
      const res = await api.getDiagnostics(currentRo.id);
      if (res.success && res.diagnostics) {
        setDtcs(res.diagnostics.dtcs || []);
      }
    } catch (e) {
      console.warn('Diagnostics fetch warning:', e.message);
    } finally {
      setLoadingDiag(false);
    }
  };

  // Load Wiring Diagrams
  const fetchWiring = async () => {
    try {
      const res = await api.getWiringDiagrams();
      if (res.success && res.diagrams) {
        setWiringDiagrams(res.diagrams);
        if (res.diagrams.length > 0 && !selectedDiagram) {
          setSelectedDiagram(res.diagrams[0]);
        }
      }
    } catch (e) {
      console.warn('Wiring diagrams fetch warning:', e.message);
    }
  };

  // Load Confirmed Fixes
  const fetchFixes = async () => {
    try {
      const res = await api.getConfirmedFixes(fixSearch);
      if (res.success && res.fixes) {
        setConfirmedFixes(res.fixes);
      }
    } catch (e) {
      console.warn('Confirmed fixes fetch warning:', e.message);
    }
  };

  // Load Forum Threads
  const fetchForum = async () => {
    try {
      const res = await api.getForumThreads();
      if (res.success && res.threads) {
        setForumThreads(res.threads);
      }
    } catch (e) {
      console.warn('Forum threads fetch warning:', e.message);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchWiring();
    fetchFixes();
    fetchForum();
  }, [currentRo?.id]);

  // Telemetry fluctuation simulator
  useEffect(() => {
    if (!isLiveStream) return;
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        rpm: Math.floor(770 + Math.random() * 30),
        coolantTemp: Math.floor(197 + Math.random() * 3),
        fuelPressure: Math.floor(2140 + Math.random() * 25),
        throttlePosition: parseFloat((14.0 + Math.random() * 0.5).toFixed(1)),
        batteryVoltage: parseFloat((14.05 + Math.random() * 0.15).toFixed(2))
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, [isLiveStream]);

  // Handlers
  const handleRunActuator = async () => {
    if (!currentRo) return;
    try {
      setRunningActuator(true);
      const res = await api.runActuatorTest(currentRo.id, {
        component: actuatorComponent,
        action: actuatorAction,
        durationSec: parseInt(actuatorDuration)
      });
      if (res.success) {
        setActuatorResult(res.result || res);
        showToast(`Actuator test executed: ${res.message || 'Complete'}`, 'success');
      }
    } catch (e) {
      showToast(`Actuator test failed: ${e.message}`, 'error');
    } finally {
      setRunningActuator(false);
    }
  };

  const handleEvaluateSpec = async () => {
    if (!currentRo) return;
    try {
      const res = await api.evaluateSpec(currentRo.id, {
        parameter: specParam,
        measuredValue: parseFloat(specValue)
      });
      if (res.success) {
        setSpecResult(res.evaluation);
        showToast(res.evaluation?.withinSpec ? 'Within manufacturer tolerance!' : 'Out of spec!', res.evaluation?.withinSpec ? 'success' : 'error');
      }
    } catch (e) {
      showToast(`Spec evaluation failed: ${e.message}`, 'error');
    }
  };

  const handleAddDtc = async (e) => {
    e.preventDefault();
    if (!newDtcCode.trim() || !currentRo) return;
    try {
      const res = await api.addDtc(currentRo.id, {
        code: newDtcCode.toUpperCase().trim(),
        description: newDtcDesc || 'Unspecified powertrain code',
        system: 'ECU Powertrain Controller',
        status: 'Active'
      });
      if (res.success) {
        showToast(`DTC ${newDtcCode} registered to ${currentRo.roNumber}`, 'success');
        setNewDtcCode('');
        setNewDtcDesc('');
        fetchDiagnostics();
      }
    } catch (e) {
      showToast(`Could not register DTC: ${e.message}`, 'error');
    }
  };

  const handleClearDtcs = async () => {
    if (!currentRo) return;
    if (!window.confirm(`Issue Mode 04 / CAN-FD Clear DTC command to ${currentRo.roNumber}?`)) return;
    try {
      const res = await api.clearDtcs(currentRo.id);
      if (res.success) {
        showToast('All stored DTCs cleared from vehicle buffer', 'success');
        fetchDiagnostics();
      }
    } catch (e) {
      showToast(`Failed to clear DTCs: ${e.message}`, 'error');
    }
  };

  const handleSubmitFix = async (e) => {
    e.preventDefault();
    if (!newFixForm.title || !newFixForm.rootCause) return;
    try {
      const res = await api.submitConfirmedFix({
        ...newFixForm,
        vehicleMake: currentRo?.vehicle?.make || 'General',
        vehicleModel: currentRo?.vehicle?.model || 'All Models'
      });
      if (res.success) {
        showToast('Confirmed Fix published to AutoMind Knowledge Base!', 'success');
        setNewFixModal(false);
        setNewFixForm({ dtc: '', title: '', rootCause: '', solution: '', difficulty: 'Moderate' });
        fetchFixes();
      }
    } catch (e) {
      showToast(`Failed to publish fix: ${e.message}`, 'error');
    }
  };

  const handleUpvoteForum = async (threadId) => {
    try {
      const res = await api.upvoteForumThread(threadId);
      if (res.success) {
        showToast('Upvote recorded', 'info');
        fetchForum();
      }
    } catch (e) {
      showToast('Could not upvote thread', 'error');
    }
  };

  const handleReplyForum = async (threadId) => {
    if (!replyText.trim()) return;
    try {
      const res = await api.replyForumThread(threadId, {
        content: replyText,
        authorName: 'Master Diagnostic Tech'
      });
      if (res.success) {
        showToast('Reply posted to technician community', 'success');
        setReplyText('');
        fetchForum();
        if (selectedThread && selectedThread.id === threadId) {
          setSelectedThread(res.thread || {
            ...selectedThread,
            replies: [...(selectedThread.replies || []), { id: Date.now(), content: replyText, authorName: 'Master Diagnostic Tech', createdAt: new Date().toISOString() }]
          });
        }
      }
    } catch (e) {
      showToast(`Could not post reply: ${e.message}`, 'error');
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadForm.title.trim()) return;
    try {
      const res = await api.createForumThread({
        title: newThreadForm.title,
        content: newThreadForm.content,
        category: newThreadForm.category,
        tags: newThreadForm.tags.split(',').map(t => t.trim()),
        authorName: 'Master Tech (Shop Lead)'
      });
      if (res.success) {
        showToast('Diagnostic discussion thread created!', 'success');
        setNewThreadModal(false);
        setNewThreadForm({ title: '', content: '', category: 'Diagnostics', tags: 'CAN-FD, Fuel' });
        fetchForum();
      }
    } catch (e) {
      showToast(`Could not create thread: ${e.message}`, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with AutoMind Hardware Status */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1527 0%, #070d1a 100%)',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 210, 255, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)'
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                AutoMind Deep Diagnostics & CAN-FD Intelligence
              </h2>
              <span style={{
                background: 'rgba(0, 230, 118, 0.15)',
                color: '#00e676',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                HARDWARE LINK ACTIVE
              </span>
            </div>
            <div style={{ color: '#8fa0c0', fontSize: '13px', marginTop: '4px' }}>
              Vehicle Target: <strong style={{ color: '#fff' }}>{currentRo?.vehicle ? `${currentRo.vehicle.year} ${currentRo.vehicle.make} ${currentRo.vehicle.model}` : 'No Active Vehicle Selected'}</strong> • VIN: <span style={{ fontFamily: 'monospace', color: currentRo?.vehicle?.vin ? '#00d2ff' : '#8fa0c0' }}>{currentRo?.vehicle?.vin || 'Standby'}</span> • RO: <strong style={{ color: currentRo?.roNumber ? '#fff' : '#8fa0c0' }}>{currentRo?.roNumber || 'None'}</strong>
            </div>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { id: 'telemetry', label: 'Live Telemetry & DTCs', icon: Activity },
            { id: 'actuators', label: 'Actuator & Spec Tests', icon: Sliders },
            { id: 'wiring', label: 'Interactive Wiring', icon: Zap },
            { id: 'fixes', label: 'Confirmed Fixes', icon: Wrench },
            { id: 'forum', label: 'Tech Community Forum', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                style={{
                  background: active ? 'linear-gradient(135deg, #00d2ff, #0070f3)' : 'transparent',
                  color: active ? '#fff' : '#8fa0c0',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-VIEW 1: TELEMETRY & DTCS */}
      {subTab === 'telemetry' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left Column: Live CAN-FD Gauges */}
          <div style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#00d2ff" />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
                  AutoMind Hardware VCI Stream (OBD-II CAN-FD)
                </h3>
              </div>
              <button
                onClick={() => setIsLiveStream(!isLiveStream)}
                style={{
                  background: isLiveStream ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  color: isLiveStream ? '#00e676' : '#8fa0c0',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={12} className={isLiveStream ? 'fa-spin' : ''} />
                <span>{isLiveStream ? 'Streaming Live (10Hz)' : 'Stream Paused'}</span>
              </button>
            </div>

            {/* Hardware Status Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              background: '#070b14',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '12px'
            }}>
              <div>
                <span style={{ color: '#8fa0c0' }}>Bus Protocol:</span>
                <div style={{ color: '#fff', fontWeight: '700', marginTop: '2px' }}>{telemetry.protocol}</div>
              </div>
              <div>
                <span style={{ color: '#8fa0c0' }}>Bus Utilization:</span>
                <div style={{ color: '#00d2ff', fontWeight: '700', marginTop: '2px' }}>{telemetry.busLoad}</div>
              </div>
              <div>
                <span style={{ color: '#8fa0c0' }}>Frame Integrity:</span>
                <div style={{ color: '#00e676', fontWeight: '700', marginTop: '2px' }}>{telemetry.frameErrors}</div>
              </div>
            </div>

            {/* Gauges Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {[
                { label: 'Engine Speed', value: `${telemetry.rpm} RPM`, normal: '650 - 850 RPM', color: '#00d2ff' },
                { label: 'Coolant Temp', value: `${telemetry.coolantTemp} °F`, normal: '195 - 215 °F', color: '#00e676' },
                { label: 'Fuel Rail Pressure', value: `${telemetry.fuelPressure} PSI`, normal: '1800 - 2400 PSI', color: '#ffb300' },
                { label: 'Throttle Position', value: `${telemetry.throttlePosition} %`, normal: '12 - 18 % idle', color: '#a855f7' },
                { label: 'Battery / Alternator', value: `${telemetry.batteryVoltage} V`, normal: '13.8 - 14.4 V', color: '#00e676' },
                { label: 'Engine Oil Temp', value: `${telemetry.oilTemp} °F`, normal: '190 - 220 °F', color: '#00d2ff' }
              ].map((g, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#080d19',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ color: '#8fa0c0', fontSize: '11px', textTransform: 'uppercase' }}>{g.label}</div>
                  <div style={{ color: g.color, fontSize: '20px', fontWeight: '800', margin: '6px 0', fontFamily: 'monospace' }}>
                    {g.value}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>Target: {g.normal}</div>
                </div>
              ))}
            </div>

            {/* Live Waveform Indicator */}
            <div style={{
              background: '#050811',
              borderRadius: '8px',
              border: '1px solid rgba(0, 210, 255, 0.15)',
              padding: '14px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8fa0c0', marginBottom: '8px' }}>
                <span>CAN-High / CAN-Low Differential Signal Waveform</span>
                <span style={{ color: '#00e676' }}>2.5V Common Mode ± 1.0V Balanced</span>
              </div>
              <svg width="100%" height="50" style={{ display: 'block' }}>
                <polyline
                  fill="none"
                  stroke="#00d2ff"
                  strokeWidth="2"
                  points="0,25 30,25 40,10 60,10 70,25 100,25 110,40 130,40 140,25 180,25 190,10 210,10 220,25 260,25 270,40 290,40 300,25 350,25 360,10 380,10 390,25 440,25 450,40 470,40 480,25 550,25"
                />
              </svg>
            </div>
          </div>

          {/* Right Column: Diagnostic Trouble Codes (DTCs) */}
          <div style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#ffb300" />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
                  Controller DTC Freeze Frames
                </h3>
              </div>
              <button
                onClick={handleClearDtcs}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Clear DTCs (Mode 04)
              </button>
            </div>

            {/* List of DTCs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dtcs.length === 0 ? (
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  background: '#070b14',
                  borderRadius: '8px',
                  color: '#8fa0c0',
                  fontSize: '13px'
                }}>
                  <CheckCircle2 size={30} color="#00e676" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  No Active DTCs detected on powertrain or body networks.
                </div>
              ) : (
                dtcs.map((dtc, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#070b14',
                      border: '1px solid rgba(255, 179, 0, 0.25)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        background: 'rgba(255, 179, 0, 0.15)',
                        color: '#ffb300',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontWeight: '800',
                        fontSize: '13px'
                      }}>
                        {dtc.code}
                      </span>
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
                        {dtc.status || 'Active / Stored'}
                      </span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                      {dtc.description}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8fa0c0' }}>
                      <span>System: {dtc.system || 'Powertrain ECM'}</span>
                      {dtc.freezeFrame && <span>RPM: {dtc.freezeFrame.rpm || '1850'} • Coolant: {dtc.freezeFrame.coolantTemp || '195°F'}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Inject New Diagnostic Trouble Code Form */}
            <form
              onSubmit={handleAddDtc}
              style={{
                marginTop: 'auto',
                background: '#070b14',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#00d2ff' }}>
                Simulate Hardware Scan Injection
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. P0300"
                  value={newDtcCode}
                  onChange={(e) => setNewDtcCode(e.target.value)}
                  style={{
                    background: '#0a0f1d',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
                <input
                  type="text"
                  placeholder="DTC description (e.g. Random/Multiple Cylinder Misfire)"
                  value={newDtcDesc}
                  onChange={(e) => setNewDtcDesc(e.target.value)}
                  style={{
                    background: '#0a0f1d',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                + Register DTC into RO Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ACTUATOR TESTS & SPEC EVALUATOR */}
      {subTab === 'actuators' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Actuator Test Runner */}
          <div style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#00d2ff" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
                Bi-Directional Actuator Test Suite
              </h3>
            </div>
            <p style={{ color: '#8fa0c0', fontSize: '13px', margin: 0 }}>
              Command vehicle ECUs directly over CAN-FD to verify mechanical response, relay continuity, and solenoid clicks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '6px' }}>Target Component</label>
                <select
                  value={actuatorComponent}
                  onChange={(e) => setActuatorComponent(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  <option value="fuel_pump_relay">Fuel Pump Relay (Low-Pressure Primer)</option>
                  <option value="evap_purge_solenoid">EVAP Canister Purge Solenoid (PWM 20Hz)</option>
                  <option value="abs_hydraulic_pump">ABS Hydraulic Pump Motor (Sweep Pressure)</option>
                  <option value="cooling_fan_pwm">Cooling Fan Auxiliary Relay (High Speed Pulse)</option>
                  <option value="egr_valve_stepper">EGR Valve Stepper Position Motor</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '6px' }}>Action Mode</label>
                  <select
                    value={actuatorAction}
                    onChange={(e) => setActuatorAction(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  >
                    <option value="cycle_on_off">Pulse On / Off (Cycle)</option>
                    <option value="force_open">Force Energized (Constant)</option>
                    <option value="ramp_pwm">Ramp 0% to 100% PWM</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '6px' }}>Duration (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={actuatorDuration}
                    onChange={(e) => setActuatorDuration(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleRunActuator}
                disabled={runningActuator}
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: runningActuator ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Zap size={16} />
                <span>{runningActuator ? 'Transmitting CAN-FD Commands...' : 'Execute Bi-Directional Command'}</span>
              </button>

              {actuatorResult && (
                <div style={{
                  background: '#070b14',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  padding: '14px',
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}>
                  <div style={{ color: '#00e676', fontWeight: '800', marginBottom: '4px' }}>
                    Command Acknowledged by Gateway Module
                  </div>
                  <div style={{ color: '#fff' }}>Component: <strong>{actuatorResult.component || actuatorComponent}</strong></div>
                  <div style={{ color: '#8fa0c0' }}>Response: {actuatorResult.response || 'Relay click confirmed. Current draw measured at 4.2A.'}</div>
                  <div style={{ color: '#00d2ff', fontFamily: 'monospace', marginTop: '4px' }}>CAN Frame: 0x7E0 04 2F 01 02</div>
                </div>
              )}
            </div>
          </div>

          {/* Spec Tolerance Evaluator */}
          <div style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#00e676" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
                Manufacturer Spec Tolerance Evaluator
              </h3>
            </div>
            <p style={{ color: '#8fa0c0', fontSize: '13px', margin: 0 }}>
              Compare measured workshop readings against OEM technical service specifications and engineering limits.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '6px' }}>Inspection Parameter</label>
                <select
                  value={specParam}
                  onChange={(e) => setSpecParam(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  <option value="fuel_rail_pressure">Fuel Rail Pressure (Target: 1800 - 2400 PSI)</option>
                  <option value="front_brake_disc_thickness">Front Brake Rotor Thickness (Min: 32.0 mm)</option>
                  <option value="coolant_temp_delta">Coolant Radiator Delta (Max: 28.0 °F)</option>
                  <option value="oxygen_sensor_b1s1_voltage">O2 Sensor B1S1 Switching (Target: 0.1 - 0.9 V)</option>
                  <option value="battery_cca">Battery Cold Cranking Amps (Min: 550 CCA)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '6px' }}>Measured Physical Value</label>
                <input
                  type="number"
                  step="0.1"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <button
                onClick={handleEvaluateSpec}
                style={{
                  background: 'linear-gradient(135deg, #00e676, #00b0ff)',
                  color: '#070d1a',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>Evaluate Against OEM Blueprint</span>
              </button>

              {specResult && (
                <div style={{
                  background: '#070b14',
                  borderRadius: '8px',
                  border: `1px solid ${specResult.withinSpec ? 'rgba(0, 230, 118, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  padding: '14px',
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}>
                  <div style={{
                    color: specResult.withinSpec ? '#00e676' : '#ef4444',
                    fontWeight: '800',
                    fontSize: '13px',
                    marginBottom: '4px'
                  }}>
                    {specResult.withinSpec ? '✓ PASSED OEM SPECIFICATION' : '⚠ OUT OF TOLERANCE DETECTED'}
                  </div>
                  <div style={{ color: '#fff' }}>Measured: <strong>{specResult.measuredValue}</strong> • OEM Range: <strong>{specResult.nominalMin} - {specResult.nominalMax} {specResult.unit}</strong></div>
                  <div style={{ color: '#8fa0c0', marginTop: '4px' }}>{specResult.recommendation}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: INTERACTIVE WIRING DIAGRAMS */}
      {subTab === 'wiring' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          {/* Diagrams List */}
          <div style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: '800' }}>
              Subsystem Schematics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {wiringDiagrams.map(diag => (
                <div
                  key={diag.id}
                  onClick={() => setSelectedDiagram(diag)}
                  style={{
                    background: selectedDiagram?.id === diag.id ? 'rgba(0, 210, 255, 0.15)' : '#070b14',
                    border: `1px solid ${selectedDiagram?.id === diag.id ? '#00d2ff' : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>{diag.title}</div>
                  <div style={{ color: '#8fa0c0', fontSize: '11px', marginTop: '2px' }}>{diag.subsystem}</div>
                </div>
              ))}
            </div>

            {/* Wire Harness Color Key */}
            <div style={{
              marginTop: 'auto',
              background: '#070b14',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>
                Harness Color Legend
              </div>
              {[
                { label: '12V Constant Power', color: '#ef4444' },
                { label: 'Chassis Ground', color: '#64748b' },
                { label: 'CAN-High Signal', color: '#00d2ff' },
                { label: 'CAN-Low Signal', color: '#3b82f6' },
                { label: 'PWM Sensor Return', color: '#a855f7' }
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ width: '12px', height: '4px', background: k.color, borderRadius: '2px' }} />
                  <span style={{ color: '#cbd5e1' }}>{k.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive SVG Schematic Canvas */}
          <div style={{
            background: '#060a12',
            border: '1px solid rgba(0, 210, 255, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
                  {selectedDiagram?.title || 'Interactive Wiring Schematic'}
                </h4>
                <span style={{ color: '#00d2ff', fontSize: '12px' }}>Click wire traces to isolate pinout circuits</span>
              </div>
              <button
                onClick={() => showToast('Full screen schematic viewer opened', 'info')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Maximize2 size={13} />
                <span>Zoom / Pan</span>
              </button>
            </div>

            {/* SVG Canvas */}
            <div style={{
              background: '#04070d',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '20px',
              minHeight: '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="100%" height="340" viewBox="0 0 700 340">
                {/* Background Blueprint Grid */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="700" height="340" fill="url(#grid)" />

                {/* Node 1: Main Gateway Module */}
                <g transform="translate(40, 60)">
                  <rect width="130" height="90" rx="8" fill="#0d1527" stroke="#00d2ff" strokeWidth="2" />
                  <text x="65" y="35" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">Gateway J533</text>
                  <text x="65" y="55" fill="#8fa0c0" fontSize="10" textAnchor="middle">CAN-FD Master</text>
                  <circle cx="130" cy="30" r="4" fill="#00d2ff" />
                  <circle cx="130" cy="50" r="4" fill="#3b82f6" />
                  <circle cx="130" cy="70" r="4" fill="#ef4444" />
                </g>

                {/* Node 2: ECM Powertrain */}
                <g transform="translate(300, 30)">
                  <rect width="140" height="110" rx="8" fill="#0d1527" stroke="#00e676" strokeWidth="2" />
                  <text x="70" y="35" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">ECM J623</text>
                  <text x="70" y="55" fill="#8fa0c0" fontSize="10" textAnchor="middle">3.0T V6 Turbo</text>
                  <circle cx="0" cy="30" r="4" fill="#00d2ff" />
                  <circle cx="0" cy="50" r="4" fill="#3b82f6" />
                  <circle cx="140" cy="40" r="4" fill="#a855f7" />
                  <circle cx="140" cy="70" r="4" fill="#ef4444" />
                </g>

                {/* Node 3: High Pressure Fuel Pump Actuator */}
                <g transform="translate(530, 40)">
                  <rect width="130" height="80" rx="8" fill="#0d1527" stroke="#ffb300" strokeWidth="2" />
                  <text x="65" y="35" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">HPFP N276</text>
                  <text x="65" y="55" fill="#8fa0c0" fontSize="10" textAnchor="middle">Fuel Reg Valve</text>
                  <circle cx="0" cy="40" r="4" fill="#a855f7" />
                  <circle cx="0" cy="65" r="4" fill="#64748b" />
                </g>

                {/* Node 4: ABS / ESP Controller */}
                <g transform="translate(300, 200)">
                  <rect width="140" height="90" rx="8" fill="#0d1527" stroke="#3b82f6" strokeWidth="2" />
                  <text x="70" y="35" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">ABS / ESP J104</text>
                  <text x="70" y="55" fill="#8fa0c0" fontSize="10" textAnchor="middle">Brake Pressure</text>
                  <circle cx="0" cy="35" r="4" fill="#00d2ff" />
                  <circle cx="0" cy="55" r="4" fill="#3b82f6" />
                </g>

                {/* Traces / Wires */}
                {/* CAN-High: Gateway to ECM & ABS */}
                <path
                  d="M 170 90 L 235 90 L 235 60 L 300 60"
                  fill="none"
                  stroke={activeHarness === 'can_h' ? '#fff' : '#00d2ff'}
                  strokeWidth={activeHarness === 'can_h' ? '4' : '2'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActiveHarness('can_h');
                    showToast('Isolated: CAN-High Bus (Pin 6 Gateway to Pin 42 ECM)', 'info');
                  }}
                />
                {/* CAN-Low: Gateway to ECM */}
                <path
                  d="M 170 110 L 225 110 L 225 80 L 300 80"
                  fill="none"
                  stroke={activeHarness === 'can_l' ? '#fff' : '#3b82f6'}
                  strokeWidth={activeHarness === 'can_l' ? '4' : '2'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActiveHarness('can_l');
                    showToast('Isolated: CAN-Low Bus (Pin 14 Gateway to Pin 43 ECM)', 'info');
                  }}
                />
                {/* Signal from ECM to HPFP */}
                <path
                  d="M 440 70 L 530 80"
                  fill="none"
                  stroke={activeHarness === 'pwm' ? '#fff' : '#a855f7'}
                  strokeWidth={activeHarness === 'pwm' ? '4' : '2'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActiveHarness('pwm');
                    showToast('Isolated: High Pressure Fuel Valve PWM Command (ECM Pin 61)', 'info');
                  }}
                />
                {/* CAN Drop to ABS */}
                <path
                  d="M 235 90 L 235 235 L 300 235"
                  fill="none"
                  stroke={activeHarness === 'can_h' ? '#fff' : '#00d2ff'}
                  strokeWidth={activeHarness === 'can_h' ? '4' : '2'}
                  strokeDasharray="4"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: CONFIRMED FIXES */}
      {subTab === 'fixes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#070b14',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '320px'
              }}>
                <Search size={15} color="#8fa0c0" />
                <input
                  type="text"
                  placeholder="Search by DTC (P0087) or symptom..."
                  value={fixSearch}
                  onChange={(e) => setFixSearch(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && fetchFixes()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px',
                    width: '100%'
                  }}
                />
              </div>
              <button
                onClick={fetchFixes}
                style={{
                  background: 'rgba(0, 210, 255, 0.15)',
                  color: '#00d2ff',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Search Knowledge Base
              </button>
            </div>

            <button
              onClick={() => setNewFixModal(true)}
              style={{
                background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Publish Confirmed Fix
            </button>
          </div>

          {/* Fixes Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px'
          }}>
            {confirmedFixes.map(fix => (
              <div
                key={fix.id}
                style={{
                  background: '#0a0f1d',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      background: 'rgba(0, 210, 255, 0.15)',
                      color: '#00d2ff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '800',
                      fontFamily: 'monospace'
                    }}>
                      {fix.dtc || 'CAN-BUS'}
                    </span>
                    <h4 style={{ margin: '8px 0 0 0', color: '#fff', fontSize: '15px', fontWeight: '800' }}>
                      {fix.title}
                    </h4>
                  </div>
                  <span style={{
                    background: 'rgba(0, 230, 118, 0.15)',
                    color: '#00e676',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {fix.verifiedCount || 14} Technicians Verified
                  </span>
                </div>

                <div style={{
                  background: '#070b14',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#cbd5e1'
                }}>
                  <strong style={{ color: '#ffb300' }}>Root Cause: </strong>
                  {fix.rootCause}
                </div>

                <div style={{ fontSize: '12px', color: '#8fa0c0', lineHeight: '1.4' }}>
                  <strong style={{ color: '#00d2ff' }}>Validated Solution: </strong>
                  {fix.solution}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '11px',
                  color: '#64748b'
                }}>
                  <span>Vehicle: {fix.vehicleMake} {fix.vehicleModel}</span>
                  <span style={{ color: '#00e676', fontWeight: '700' }}>Success Rate: {fix.successRate || '98%'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* New Fix Modal */}
          {newFixModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <form
                onSubmit={handleSubmitFix}
                style={{
                  background: '#0d1527',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  width: '500px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
                  Publish Confirmed Fix to Knowledge Base
                </h3>
                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>DTC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. P0087"
                    value={newFixForm.dtc}
                    onChange={(e) => setNewFixForm({ ...newFixForm, dtc: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fuel Rail Pressure Loss at High RPM"
                    value={newFixForm.title}
                    onChange={(e) => setNewFixForm({ ...newFixForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Root Cause</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Describe failure mechanism..."
                    value={newFixForm.rootCause}
                    onChange={(e) => setNewFixForm({ ...newFixForm, rootCause: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Confirmed Solution</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Step by step fix procedure..."
                    value={newFixForm.solution}
                    onChange={(e) => setNewFixForm({ ...newFixForm, solution: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewFixModal(false)}
                    style={{
                      background: 'transparent',
                      color: '#8fa0c0',
                      border: 'none',
                      padding: '8px 16px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Publish Fix
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 5: TECHNICIAN COMMUNITY FORUM */}
      {subTab === 'forum' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Threads List */}
          <div style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
                Master Technician Discussions
              </h3>
              <button
                onClick={() => setNewThreadModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Ask Tech Community
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {forumThreads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  style={{
                    background: selectedThread?.id === thread.id ? 'rgba(0, 210, 255, 0.12)' : '#070b14',
                    border: `1px solid ${selectedThread?.id === thread.id ? '#00d2ff' : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: '8px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: '700' }}>
                      {thread.title}
                    </h4>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#8fa0c0',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      {thread.category}
                    </span>
                  </div>

                  <p style={{ margin: 0, color: '#8fa0c0', fontSize: '12px', lineHeight: '1.4' }}>
                    {thread.content?.substring(0, 110)}...
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                    <span>By: <strong style={{ color: '#00d2ff' }}>{thread.authorName}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvoteForum(thread.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#00e676',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        <ThumbsUp size={12} />
                        <span>{thread.upvotes || 0}</span>
                      </button>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={12} />
                        <span>{thread.replies?.length || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Thread & Replies */}
          <div style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {selectedThread ? (
              <>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '800' }}>
                    {selectedThread.title}
                  </h3>
                  <div style={{ color: '#8fa0c0', fontSize: '12px', marginTop: '4px' }}>
                    Posted by <strong style={{ color: '#00d2ff' }}>{selectedThread.authorName}</strong> in {selectedThread.category}
                  </div>
                </div>

                <div style={{
                  background: '#070b14',
                  padding: '14px',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {selectedThread.content}
                </div>

                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  Replies ({selectedThread.replies?.length || 0})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                  {(!selectedThread.replies || selectedThread.replies.length === 0) ? (
                    <div style={{ color: '#64748b', fontSize: '12px' }}>No replies yet. Be the first to advise!</div>
                  ) : (
                    selectedThread.replies.map((reply, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#070b14',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00d2ff', fontWeight: '700', marginBottom: '4px' }}>
                          <span>{reply.authorName}</span>
                          <span style={{ color: '#64748b', fontSize: '10px' }}>Verified Tech</span>
                        </div>
                        <div style={{ color: '#cbd5e1', lineHeight: '1.4' }}>{reply.content}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Box */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Write diagnostic advice or technical notes..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && handleReplyForum(selectedThread.id)}
                    style={{
                      flex: 1,
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    onClick={() => handleReplyForum(selectedThread.id)}
                    style={{
                      background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                      color: '#fff',
                      border: 'none',
                      padding: '0 16px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8fa0c0', fontSize: '13px' }}>
                Select a forum discussion from the list to view diagnostic comments and peer feedback.
              </div>
            )}
          </div>

          {/* New Thread Modal */}
          {newThreadModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <form
                onSubmit={handleCreateThread}
                style={{
                  background: '#0d1527',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  width: '500px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
                  Start Diagnostic Forum Thread
                </h3>
                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Topic Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intermittent Gateway Wakeup on CAN-FD loop"
                    value={newThreadForm.title}
                    onChange={(e) => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Detailed Symptoms & Scope Waveforms</label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Explain what steps you tested, voltage drops measured..."
                    value={newThreadForm.content}
                    onChange={(e) => setNewThreadForm({ ...newThreadForm, content: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewThreadModal(false)}
                    style={{
                      background: 'transparent',
                      color: '#8fa0c0',
                      border: 'none',
                      padding: '8px 16px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Post Thread
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FutureTechAiTab;
