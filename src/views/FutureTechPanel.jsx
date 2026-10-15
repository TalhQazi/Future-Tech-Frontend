import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useShop } from '../context/ShopContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { pressable } from '../components/a11y.js';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  FileEdit, 
  Save, 
  Plus, 
  Cpu, 
  Zap, 
  Gauge, 
  Thermometer, 
  BatteryCharging,
  Layers,
  ChevronRight
} from 'lucide-react';

export const FutureTechPanel = ({ roId }) => {
  const { showToast } = useShop();

  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDtc, setActiveDtc] = useState(null);
  const [techNotes, setTechNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // New check state
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [newCheckTitle, setNewCheckTitle] = useState('');
  const [newCheckInstructions, setNewCheckInstructions] = useState('');

  const fetchDiagnostic = async () => {
    try {
      setLoading(true);
      const res = await api.getDiagnostics(roId);
      if (res.success) {
        setDiagnostic(res.diagnostic);
        setTechNotes(res.diagnostic.techDiagnosticNotes || '');
        if (res.diagnostic.dtcCodes.length > 0) {
          setActiveDtc(res.diagnostic.dtcCodes[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roId) {
      fetchDiagnostic();
    }
  }, [roId]);

  const handleSimulateScan = async () => {
    try {
      setIsScanning(true);
      const res = await api.simulateScan(roId);
      if (res.success) {
        setDiagnostic(res.diagnostic);
        showToast('ECU Trouble Codes and Live PIDs refreshed', 'info');
      }
    } catch (err) {
      showToast('Scan read failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      const res = await api.updateDiagnostics(roId, { techDiagnosticNotes: techNotes });
      if (res.success) {
        showToast('Technician diagnostic findings saved to repair order', 'success');
      }
    } catch (err) {
      showToast('Failed to save notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleCheckStatus = async (checkId, newStatus) => {
    try {
      const res = await api.updateGuidedCheck(roId, checkId, { status: newStatus });
      if (res.success) {
        setDiagnostic(res.diagnostic);
        showToast(`Step status updated: ${newStatus.toUpperCase()}`, 'info');
      }
    } catch (err) {
      showToast('Could not update test step', 'error');
    }
  };

  const handleAddGuidedCheck = async (e) => {
    e.preventDefault();
    if (!newCheckTitle) return;
    try {
      const res = await api.addGuidedCheck(roId, {
        title: newCheckTitle,
        instructions: newCheckInstructions
      });
      if (res.success) {
        setDiagnostic(res.diagnostic);
        setNewCheckTitle('');
        setNewCheckInstructions('');
        setShowAddCheck(false);
        showToast('Diagnostic step added', 'success');
      }
    } catch (err) {
      showToast('Failed to add check step', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ft-text-2)' }}>
        <RefreshCw className="pulse-dot" size={28} color="#36D6F5" style={{ margin: '0 auto 1rem' }} />
        <p>Connecting to FutureTech OBD diagnostic stream...</p>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ft-text-3)' }}>
        <p>No diagnostic record found for this repair order.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Diagnostics Header Card */}
      <div className="card-panel" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--ft-grad-panel)',
        border: '1px solid rgba(199, 184, 255, 0.29)',
        boxShadow: '0 8px 30px rgba(121, 87, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <div style={{
            flex: 'none',
            background: 'linear-gradient(135deg, rgba(54, 214, 245, 0.16), rgba(121, 87, 255, 0.3))',
            border: '1px solid rgba(199, 184, 255, 0.42)',
            padding: '0.65rem',
            borderRadius: '12px',
            color: 'var(--ft-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ft-text)', letterSpacing: '-0.01em' }}>
                FutureTech Integrated Vehicle Diagnostics
              </h3>
              <span className="badge badge-amber">MIL Illuminated (Active DTC)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', marginTop: '0.2rem' }}>
              ECU: <span style={{ color: 'var(--ft-text-soft)', fontWeight: 600 }}>{diagnostic.ecuDetected || 'Bosch Powertrain MD1'}</span> • Protocol: <span style={{ fontFamily: 'var(--ft-font-mono)', color: 'var(--ft-cyan)' }}>{diagnostic.protocol || 'CAN ISO 15765-4'}</span> • Pass-Thru Connected
            </div>
          </div>
        </div>

        <button
          onClick={handleSimulateScan}
          disabled={isScanning}
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '10px' }}
        >
          <RefreshCw size={15} className={isScanning ? 'pulse-dot' : ''} />
          <span>{isScanning ? 'Querying Bus...' : 'Re-Scan ECU Live PIDs'}</span>
        </button>
      </div>

      {/* Lovable Telemetry Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
        <div className="card-panel" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-signal)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Bus Voltage</span>
            <BatteryCharging size={16} color="#36D6F5" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
            {diagnostic.liveTelemetry?.batteryVoltage || 14.1} <span style={{ fontSize: '0.85rem', color: 'var(--ft-text-3)' }}>VDC</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ft-success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ft-success)' }} /> Alternator Normal (14.1V)
          </div>
        </div>

        <div className="card-panel" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-signal-rev)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Coolant Temp</span>
            <Thermometer size={16} color="#36D6F5" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
            {diagnostic.liveTelemetry?.coolantTempF || 198} <span style={{ fontSize: '0.85rem', color: 'var(--ft-text-3)' }}>°F</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ft-success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ft-success)' }} /> Closed Loop Operating
          </div>
        </div>

        <div className="card-panel" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-violet)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Engine Idle</span>
            <Gauge size={16} color="#C7B8FF" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
            {diagnostic.liveTelemetry?.rpm || 780} <span style={{ fontSize: '0.85rem', color: 'var(--ft-text-3)' }}>RPM</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ft-text-2)', marginTop: '0.25rem' }}>
            Target: 750 RPM ± 50
          </div>
        </div>

        <div className="card-panel" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-cyan)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Fuel Rail Pressure</span>
            <Zap size={16} color="#36D6F5" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
            {diagnostic.liveTelemetry?.fuelRailPsi || 2150} <span style={{ fontSize: '0.85rem', color: 'var(--ft-text-3)' }}>PSI</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ft-text-2)', marginTop: '0.25rem' }}>
            Direct Injection High Pressure
          </div>
        </div>
      </div>

      {/* Main Diagnostic Workspace */}
      <div className="ft-grid-diag">
        
        {/* Left: DTC Table with Lovable Blue Accent Border */}
        <div className="card-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={17} color="#36D6F5" />
              Active Trouble Codes ({diagnostic.dtcCodes.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ft-text-3)' }}>Click to inspect Freeze Frame</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {diagnostic.dtcCodes.map((dtc) => {
              const isSelected = activeDtc?.code === dtc.code;
              return (
                <div
                  key={dtc.code}
                  {...pressable(() => setActiveDtc(dtc))}
                  aria-pressed={isSelected}
                  aria-label={`${dtc.code}: ${dtc.description}`}
                  style={{
                    padding: '0.95rem',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(121, 87, 255, 0.08)' : 'rgba(18, 21, 44, 0.6)',
                    border: isSelected ? '1px solid rgba(199, 184, 255, 0.42)' : '1px solid var(--ft-line)',
                    boxShadow: isSelected ? '0 0 16px rgba(121, 87, 255, 0.15)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontFamily: 'var(--ft-font-mono)',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: dtc.severity === 'critical' ? 'var(--ft-danger)' : 'var(--ft-cyan)'
                      }}>
                        {dtc.code}
                      </span>
                      <StatusBadge status={dtc.severity} type="dtc" />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ft-text-3)', textTransform: 'capitalize' }}>
                      {dtc.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ft-text-soft)' }}>
                    {dtc.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ft-text-3)', marginTop: '0.2rem' }}>
                    Module: {dtc.system}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Freeze Frame Panel */}
          {activeDtc && activeDtc.freezeFrame && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--ft-line-2)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ft-cyan)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={15} /> Freeze Frame Snapshot ({activeDtc.code})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                {Object.entries(activeDtc.freezeFrame).map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--ft-inset)', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--ft-line)' }}>
                    <div style={{ color: 'var(--ft-text-3)', fontSize: '0.68rem', textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ color: 'var(--ft-text)', fontWeight: 600, fontFamily: 'var(--ft-font-mono)', marginTop: '0.1rem' }}>{v}</div>
                  </div>
                ))}
              </div>

              {activeDtc.possibleCauses && (
                <div style={{ marginTop: '0.9rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ft-text-2)', marginBottom: '0.35rem' }}>
                    Known Root Causes:
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--ft-text-soft)' }}>
                    {activeDtc.possibleCauses.map((c, i) => (
                      <li key={i} style={{ marginBottom: '0.2rem' }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Guided Checks & Findings Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Guided Checklist Card */}
          <div className="card-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={17} color="#2ED3A0" />
                Guided Troubleshooting Procedures
              </span>
              <button
                onClick={() => setShowAddCheck(!showAddCheck)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <Plus size={14} /> Add Step
              </button>
            </div>

            {/* Add check inline form */}
            {showAddCheck && (
              <form onSubmit={handleAddGuidedCheck} style={{ background: 'var(--ft-inset)', border: '1px solid rgba(199, 184, 255, 0.24)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem' }}>
                <input
                  type="text"
                  required
                  aria-label="Test name"
                  placeholder="Test Name (e.g. Fuel Pressure Bleed Down Test)"
                  value={newCheckTitle}
                  onChange={(e) => setNewCheckTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}
                />
                <input
                  type="text"
                  aria-label="Instructions or specifications"
                  placeholder="Instructions / Specifications"
                  value={newCheckInstructions}
                  onChange={(e) => setNewCheckInstructions(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', marginBottom: '0.65rem', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowAddCheck(false)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>Save Step</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {diagnostic.guidedChecks.map((chk) => (
                <div
                  key={chk.id}
                  style={{
                    background: 'rgba(18, 21, 44, 0.6)',
                    border: '1px solid var(--ft-line)',
                    borderRadius: '10px',
                    padding: '0.95rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ft-cyan)', background: 'rgba(121, 87, 255, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          STEP {chk.stepNumber}
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--ft-text)' }}>
                          {chk.title}
                        </strong>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--ft-text-2)', margin: '0.25rem 0' }}>
                        {chk.instructions}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', flex: 'none' }}>
                      <button
                        type="button"
                        aria-pressed={chk.status === 'passed'}
                        onClick={() => handleToggleCheckStatus(chk.id, 'passed')}
                        className={`tablet-btn ${chk.status === 'passed' ? 'btn-emerald' : 'btn-secondary'}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        aria-pressed={chk.status === 'failed'}
                        onClick={() => handleToggleCheckStatus(chk.id, 'failed')}
                        className={`tablet-btn ${chk.status === 'failed' ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Fail
                      </button>
                    </div>
                  </div>

                  {chk.technicianFindings && (
                    <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--ft-text-soft)', background: 'var(--ft-inset)', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: `3px solid ${chk.status === 'passed' ? 'var(--ft-success)' : 'var(--ft-danger)'}` }}>
                      <strong>Technician Finding:</strong> {chk.technicianFindings}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Work Notes Card */}
          <div className="card-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileEdit size={16} color="#36D6F5" />
                Technician Diagnostic Worklog
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ft-text-3)' }}>Syncs to Repair Order</span>
            </div>

            <textarea
              aria-label="Technician diagnostic worklog"
              rows={3}
              value={techNotes}
              onChange={(e) => setTechNotes(e.target.value)}
              placeholder="Record component test findings, oscilloscope patterns, or secondary repairs..."
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.85rem',
                marginBottom: '0.75rem',
                borderRadius: '8px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <Save size={15} />
                <span>{isSavingNotes ? 'Saving...' : 'Save Diagnostic Findings'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
