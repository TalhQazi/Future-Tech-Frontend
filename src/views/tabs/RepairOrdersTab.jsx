import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const RepairOrdersTab = ({ onOpenCheckIn, onSelectRo }) => {
  const { repairOrders, setSelectedRoId, showToast, refreshAll } = useShop();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [selectedRoForQc, setSelectedRoForQc] = useState(null);
  const [selectedRoForSafety, setSelectedRoForSafety] = useState(null);
  const [qcNotes, setQcNotes] = useState('');
  const [safetyReason, setSafetyReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const KANBAN_COLUMNS = [
    { id: 'checked_in', label: 'Checked In', color: '#8fa0c0' },
    { id: 'in_inspection', label: 'In Inspection', color: '#00d2ff' },
    { id: 'estimating', label: 'Estimating', color: '#a78bfa' },
    { id: 'in_progress', label: 'In Progress', color: '#0070f3' },
    { id: 'qc_ready', label: 'QC Ready', color: '#fbbf24' },
    { id: 'qc_passed', label: 'QC Passed', color: '#4ade80' },
    { id: 'ready_for_pickup', label: 'Ready', color: '#10b981' }
  ];

  const handleStatusChange = async (roId, newStatus) => {
    try {
      const res = await api.updateROStatus(roId, newStatus);
      if (res.success) {
        showToast(`RO status updated to ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error updating RO status', 'error');
    }
  };

  const handleQcSignOff = async (e) => {
    e.preventDefault();
    if (!selectedRoForQc) return;

    try {
      setActionLoading(true);
      const res = await api.qcSignOff(selectedRoForQc.id, {
        passed: true,
        notes: qcNotes || 'Completed 12-point road test and torque spec verification',
        inspectorName: 'Master Tech Marcus Vance'
      });
      if (res.success) {
        showToast(`QC Sign-Off passed for ${selectedRoForQc.roNumber}! Ready for pickup.`, 'success');
        setSelectedRoForQc(null);
        setQcNotes('');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error recording QC sign-off', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagSafety = async (e) => {
    e.preventDefault();
    if (!selectedRoForSafety) return;

    try {
      setActionLoading(true);
      const res = await api.flagSafetyEscalation(selectedRoForSafety.id, {
        hazardDescription: safetyReason || 'Critical brake fluid boiling point / hydraulic leak detected',
        flaggedBy: 'Technician',
        requiresCustomerConsent: true
      });
      if (res.success) {
        showToast(`SAFETY HAZARD ESCALATED for ${selectedRoForSafety.roNumber}. Work locked.`, 'error');
        setSelectedRoForSafety(null);
        setSafetyReason('');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error escalating safety hazard', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with View Toggle & New RO */}
      <div style={{
        background: '#0d1527',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
            Repair Orders & Shop Floor Dispatch
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Live status Kanban, multi-bay workload balancing, QC sign-off certification, and safety escalations
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Kanban / Table Switcher */}
          <div style={{ background: '#070c14', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                background: viewMode === 'kanban' ? '#0070f3' : 'transparent',
                border: 'none',
                color: viewMode === 'kanban' ? '#fff' : '#8fa0c0',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#0070f3' : 'transparent',
                border: 'none',
                color: viewMode === 'table' ? '#fff' : '#8fa0c0',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Detailed Table
            </button>
          </div>

          <button
            onClick={onOpenCheckIn}
            style={{
              background: 'linear-gradient(135deg, #0070f3, #00d2ff)',
              border: 'none',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            + Create RO
          </button>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
          overflowX: 'auto',
          alignItems: 'start'
        }}>
          {KANBAN_COLUMNS.map(col => {
            const colRos = repairOrders.filter(ro => ro.status === col.id);
            return (
              <div
                key={col.id}
                style={{
                  background: '#0a0f1d',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '820px'
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#0e1628',
                  borderRadius: '12px 12px 0 0'
                }}>
                  <span style={{ color: col.color, fontWeight: '800', fontSize: '13px', textTransform: 'uppercase' }}>
                    {col.label}
                  </span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#d0d8ea',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {colRos.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {colRos.map(ro => (
                    <div
                      key={ro.id}
                      onClick={() => {
                        setSelectedRoId(ro.id);
                        if (onSelectRo) onSelectRo(ro);
                      }}
                      style={{
                        background: '#070b14',
                        border: ro.safetyEscalation
                          ? '1px solid #ef4444'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#00d2ff', fontWeight: '800', fontSize: '13px' }}>
                          {ro.roNumber}
                        </span>
                        <span style={{ fontSize: '11px', color: '#8fa0c0' }}>
                          {ro.bayNumber || 'Unassigned'}
                        </span>
                      </div>

                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                        {ro.customer?.name || ro.customerName || 'Customer'}
                      </div>

                      <div style={{ color: '#d0d8ea', fontSize: '12px' }}>
                        {ro.vehicle ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : ro.vehicleSummary || 'Vehicle'}
                      </div>

                      {ro.safetyEscalation && (
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          ⚠ SAFETY HOLD ACTIVE
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '11px', color: '#8fa0c0' }}>
                          Tech: {ro.assignedTechName || 'Alex'}
                        </span>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {ro.status === 'qc_ready' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRoForQc(ro);
                              }}
                              style={{
                                background: 'rgba(74, 222, 128, 0.15)',
                                border: '1px solid #4ade80',
                                color: '#4ade80',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Sign QC
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoForSafety(ro);
                            }}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid #ef4444',
                              color: '#ef4444',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Flag
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colRos.length === 0 && (
                    <div style={{ color: '#8fa0c0', fontSize: '11px', textAlign: 'center', padding: '24px 8px', fontStyle: 'italic' }}>
                      No active ROs in this column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div style={{
          background: '#0a0f1d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0e1628', color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px' }}>RO Number</th>
                <th style={{ padding: '14px 18px' }}>Customer</th>
                <th style={{ padding: '14px 18px' }}>Vehicle</th>
                <th style={{ padding: '14px 18px' }}>Assigned Bay</th>
                <th style={{ padding: '14px 18px' }}>Technician</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {repairOrders.map(ro => (
                <tr key={ro.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 18px', color: '#00d2ff', fontWeight: '800' }}>
                    {ro.roNumber}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff', fontWeight: '700' }}>
                    {ro.customer?.name || ro.customerName}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#d0d8ea' }}>
                    {ro.vehicle ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : ro.vehicleSummary}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#8fa0c0' }}>
                    {ro.bayNumber || 'Unassigned'}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff' }}>
                    {ro.assignedTechName || 'Alex'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <select
                      value={ro.status}
                      onChange={(e) => handleStatusChange(ro.id, e.target.value)}
                      style={{
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#00d2ff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      {KANBAN_COLUMNS.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedRoForSafety(ro)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Safety Flag
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QC Sign-Off Modal */}
      {selectedRoForQc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(4, 7, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleQcSignOff} style={{
            background: '#0d1527',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
              Quality Control Sign-Off Certification
            </h3>
            <div style={{ fontSize: '13px', color: '#8fa0c0' }}>
              Certify final road test, bolt torque inspection, and zero active DTC status for <strong>{selectedRoForQc.roNumber}</strong>.
            </div>

            <textarea
              rows={4}
              required
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              placeholder="Enter QC technician sign-off notes (e.g. Verified zero misfires on road test, torque specs verified on wheel lugs)..."
              style={{
                width: '100%',
                background: '#070b14',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedRoForQc(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#8fa0c0', padding: '8px 18px', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                style={{ background: 'linear-gradient(135deg, #10b981, #4ade80)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontWeight: '700' }}
              >
                {actionLoading ? 'Signing...' : 'Certify & Pass QC'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Safety Escalation Modal */}
      {selectedRoForSafety && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(4, 7, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleFlagSafety} style={{
            background: '#0d1527',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#ef4444', fontSize: '18px', fontWeight: '800' }}>
              ⚠ Flag Safety Hazard Escalation
            </h3>
            <div style={{ fontSize: '13px', color: '#8fa0c0' }}>
              Lock repair order and notify Service Advisor of critical safety risk on <strong>{selectedRoForSafety.roNumber}</strong>.
            </div>

            <textarea
              rows={4}
              required
              value={safetyReason}
              onChange={(e) => setSafetyReason(e.target.value)}
              placeholder="Describe safety critical hazard (e.g. Brake pad backing plate metal-to-metal, fuel line chafe, high-voltage battery insulation breach)..."
              style={{
                width: '100%',
                background: '#070b14',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedRoForSafety(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#8fa0c0', padding: '8px 18px', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontWeight: '700' }}
              >
                {actionLoading ? 'Locking...' : 'Lock Work & Escalate'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RepairOrdersTab;
