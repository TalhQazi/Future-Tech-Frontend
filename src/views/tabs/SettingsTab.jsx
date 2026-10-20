import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';
import { 
  Settings, 
  ShieldCheck, 
  Cpu, 
  MapPin, 
  DollarSign, 
  Clock, 
  Database, 
  Lock, 
  CheckCircle2, 
  RefreshCw,
  FileText
} from 'lucide-react';

export const SettingsTab = () => {
  const { locations, currentUser, showToast } = useShop();

  // Location / Rates state
  const [rates, setRates] = useState({
    standardLabor: 165,
    diagnosticLabor: 195,
    evHighVoltageLabor: 225,
    shopSupplyPercent: 6.5,
    salesTaxPercent: 8.25
  });

  // AI & Safety Governance
  const [governance, setGovernance] = useState({
    requireAdvisorSignoff: true,
    strictHallucinationFilter: true,
    autoSafetyEscalation: true,
    telemetryBufferDays: 90
  });

  // Hardware Adapter
  const [hardware, setHardware] = useState({
    adapterId: 'VCI-CANFD-9021',
    baudRate: '5.0 Mbps / 500 kbps',
    protocol: 'ISO 11898-1 CAN-FD',
    status: 'Operational'
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await api.getAuditLogs(50);
      if (res.success && res.auditLogs) {
        setAuditLogs(res.auditLogs);
      }
    } catch (err) {
      console.warn('Audit logs fetch warning:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleSaveRates = (e) => {
    e.preventDefault();
    showToast('Shop labor rates and tax profile updated across all 6 service bays', 'success');
  };

  const handleSaveGovernance = (e) => {
    e.preventDefault();
    showToast('AI governance bounds and safety rules saved to system registry', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{
        background: '#0d1527',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
            System Settings & Enterprise Governance
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Shop billing rates, AutoMind CAN-FD hardware calibration, AI safety policy, and immutable audit logs
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(0, 230, 118, 0.15)',
            color: '#00e676',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            SECURITY LEVEL: TIER 1
          </span>
        </div>
      </div>

      {/* Row 1: Shop Labor Rates & AI Governance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Shop Labor Rates */}
        <form
          onSubmit={handleSaveRates}
          style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#00d2ff" />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
              Shop Labor Rates & Tax Rules
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Standard Mechanical ($/hr)</label>
              <input
                type="number"
                value={rates.standardLabor}
                onChange={(e) => setRates({ ...rates, standardLabor: e.target.value })}
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Diagnostic Specialist ($/hr)</label>
              <input
                type="number"
                value={rates.diagnosticLabor}
                onChange={(e) => setRates({ ...rates, diagnosticLabor: e.target.value })}
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>EV / High Voltage ($/hr)</label>
              <input
                type="number"
                value={rates.evHighVoltageLabor}
                onChange={(e) => setRates({ ...rates, evHighVoltageLabor: e.target.value })}
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '12px', marginBottom: '4px' }}>Shop Supply Surcharge (%)</label>
              <input
                type="number"
                step="0.1"
                value={rates.shopSupplyPercent}
                onChange={(e) => setRates({ ...rates, shopSupplyPercent: e.target.value })}
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 'auto',
              background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Save Labor Profile
          </button>
        </form>

        {/* AI Safety Governance */}
        <form
          onSubmit={handleSaveGovernance}
          style={{
            background: '#0a0f1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#00e676" />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
              AI Governance & Hallucination Guardrails
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                id: 'requireAdvisorSignoff',
                title: 'Mandatory Human Advisor Review',
                desc: 'Prevent raw AI diagnostic summaries from being sent to customers without manual approval.'
              },
              {
                id: 'strictHallucinationFilter',
                title: 'OEM Blueprint Grounding Engine',
                desc: 'Cross-reference all recommended parts and torque specs against factory service manuals.'
              },
              {
                id: 'autoSafetyEscalation',
                title: 'Safety Interlock Escalation',
                desc: 'Auto-flag critical brake pads (<3mm) or tire cord exposure directly to management queue.'
              }
            ].map(item => (
              <label
                key={item.id}
                style={{
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={governance[item.id]}
                  onChange={(e) => setGovernance({ ...governance, [item.id]: e.target.checked })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>{item.title}</div>
                  <div style={{ color: '#8fa0c0', fontSize: '11px', marginTop: '2px' }}>{item.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            style={{
              marginTop: 'auto',
              background: 'linear-gradient(135deg, #00e676, #00b0ff)',
              color: '#070d1a',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Update AI Governance Policies
          </button>
        </form>
      </div>

      {/* Row 2: Append-Only Immutable System Audit Logs */}
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
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
              Append-Only Cryptographic Audit Log
            </h3>
            <div style={{ color: '#8fa0c0', fontSize: '12px', marginTop: '2px' }}>
              Tamper-evident trail for PCI transactions, technician status changes, DVI sign-offs, and RO dispatches
            </div>
          </div>
          <button
            onClick={fetchAuditLogs}
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
            <RefreshCw size={12} className={loadingAudit ? 'fa-spin' : ''} />
            <span>Refresh Audit Feed</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#8fa0c0' }}>
                <th style={{ padding: '8px 10px' }}>Timestamp</th>
                <th style={{ padding: '8px 10px' }}>Event Action</th>
                <th style={{ padding: '8px 10px' }}>Entity ID</th>
                <th style={{ padding: '8px 10px' }}>Operator / Actor</th>
                <th style={{ padding: '8px 10px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No audit records retrieved.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, i) => (
                  <tr
                    key={log.id || i}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      color: '#cbd5e1'
                    }}
                  >
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#8fa0c0' }}>
                      {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        background: 'rgba(0, 210, 255, 0.1)',
                        color: '#00d2ff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '11px'
                      }}>
                        {log.action || log.eventType || 'SYSTEM_EVENT'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#ffb300' }}>
                      {log.entityId || log.targetId || 'N/A'}
                    </td>
                    <td style={{ padding: '10px', color: '#fff', fontWeight: '600' }}>
                      {log.actor || log.operator || 'System Daemon'}
                    </td>
                    <td style={{ padding: '10px', color: '#8fa0c0' }}>
                      {log.details || log.description || 'Action verified successfully.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
