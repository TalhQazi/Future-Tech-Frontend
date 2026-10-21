import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useShop } from '../context/ShopContext.jsx';
import { FutureTechPanel } from './FutureTechPanel.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useEscapeKey } from '../components/a11y.js';
import { 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Package, 
  Cpu, 
  FileText, 
  Plus, 
  ShieldCheck, 
  Camera,
  Layers
} from 'lucide-react';

export const TechnicianView = () => {
  const { repairOrders, selectedRoId, setSelectedRoId, selectedRO, fetchROs, fetchSelectedRO, showToast } = useShop();

  const [activeTab, setActiveTab] = useState('inspection'); // 'inspection' | 'futuretech' | 'parts' | 'approved_work'
  const [inspection, setInspection] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);

  // New part request modal
  const [showPartModal, setShowPartModal] = useState(false);
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partUrgency, setPartUrgency] = useState('normal');

  useEscapeKey(showPartModal, () => setShowPartModal(false));

  useEffect(() => {
    if (selectedRoId) {
      loadInspectionData(selectedRoId);
      loadPartsData(selectedRoId);
    }
  }, [selectedRoId]);

  const loadInspectionData = async (roId) => {
    try {
      setLoading(true);
      const res = await api.getInspection(roId);
      if (res.success) {
        setInspection(res.inspection);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPartsData = async (roId) => {
    try {
      const res = await api.getParts(roId);
      if (res.success) {
        setParts(res.parts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      const res = await api.updateInspectionItem(selectedRoId, itemId, { status: newStatus });
      if (res.success) {
        setInspection(res.inspection);
        showToast(`Item status set to ${newStatus.toUpperCase()}`, 'info');
      }
    } catch (err) {
      showToast('Could not update inspection item', 'error');
    }
  };

  const handleUpdateItemFinding = async (itemId, finding, recommendation) => {
    try {
      const res = await api.updateInspectionItem(selectedRoId, itemId, { finding, recommendation });
      if (res.success) {
        setInspection(res.inspection);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteInspection = async () => {
    try {
      const res = await api.completeInspection(selectedRoId);
      if (res.success) {
        setInspection(res.inspection);
        showToast('Inspection completed. Sent to Service Advisor.', 'success');
        fetchROs();
        fetchSelectedRO(selectedRoId);
      }
    } catch (err) {
      showToast('Failed to complete inspection', 'error');
    }
  };

  const handleRequestPart = async (e) => {
    e.preventDefault();
    if (!partName) return;
    try {
      const res = await api.requestPart({
        roId: selectedRoId,
        techId: 'usr_tech_1',
        partName,
        quantity: parseInt(partQty) || 1,
        urgency: partUrgency
      });
      if (res.success) {
        setParts([...parts, res.part]);
        setPartName('');
        setShowPartModal(false);
        showToast('Part request submitted to inventory', 'success');
      }
    } catch (err) {
      showToast('Failed to request part', 'error');
    }
  };

  const currentRO = selectedRO || repairOrders.find(r => r.id === selectedRoId) || repairOrders[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Tablet Job Switcher */}
      <div className="card-panel" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem',
        background: 'rgba(18, 21, 44, 0.85)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem 1rem', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ft-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TECHNICIAN BAY QUEUE:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', alignItems: 'center' }}>
            {repairOrders.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--ft-text-3)', fontStyle: 'italic' }}>
                No active vehicles in bay queue
              </span>
            ) : (
              repairOrders.map(ro => {
                const isSelected = ro.id === selectedRoId;
                return (
                  <button
                    key={ro.id}
                    onClick={() => setSelectedRoId(ro.id)}
                    style={{
                      background: isSelected ? 'var(--ft-grad-brand)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid rgba(199, 184, 255, 0.42)' : '1px solid var(--ft-line-2)',
                      boxShadow: isSelected ? '0 2px 10px rgba(121, 87, 255, 0.35)' : 'none',
                      color: isSelected ? 'var(--ft-text)' : 'var(--ft-text-soft)',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {ro.roNumber} ({ro.vehicle?.make || 'Job'})
                  </button>
                );
              })
            )}
          </div>
        </div>

        <button
          onClick={() => setShowPartModal(true)}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <Package size={15} /> Request Parts ({parts.length})
        </button>
      </div>

      {/* Active Vehicle Info Header */}
      {currentRO && (
        <div className="card-panel" style={{ padding: '1.25rem 1.5rem', background: 'rgba(18, 21, 44, 0.75)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '1.25rem', color: 'var(--ft-text)', fontWeight: 700 }}>{currentRO.roNumber}</strong>
                <StatusBadge status={currentRO.status} type="ro" />
                <span className="badge badge-brand">{currentRO.bayNumber || 'Bay 1'}</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ft-text-soft)' }}>
                {currentRO.vehicle?.year} {currentRO.vehicle?.make} {currentRO.vehicle?.model} {currentRO.vehicle?.trim}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ft-text-3)', marginTop: '0.25rem', fontFamily: 'var(--ft-font-mono)' }}>
                VIN: <span style={{ color: 'var(--ft-cyan)' }}>{currentRO.vehicle?.vin}</span> • Plate: {currentRO.vehicle?.licensePlate} • Mileage: {currentRO.odometerIn} mi
              </div>
            </div>

            <div style={{ maxWidth: '420px', fontSize: '0.82rem', color: 'var(--ft-text-soft)', background: 'var(--ft-inset)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(199, 184, 255, 0.22)' }}>
              <strong style={{ color: 'var(--ft-cyan)' }}>Reported Complaint:</strong> {currentRO.customerComplaints?.join(', ') || 'General Inspection'}
            </div>
          </div>
        </div>
      )}

      {/* Segmented work tabs */}
      <div className="seg seg--lg" role="tablist" aria-label="Technician work areas">
        {[
          { id: 'inspection', label: '1. Digital Inspection (DVI)' },
          { id: 'futuretech', label: '2. FutureTech Diagnostics & DTCs' },
          { id: 'approved_work', label: '3. Authorized Work Order' },
          { id: 'parts', label: `4. Parts Requisition (${parts.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className="seg__btn"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INSPECTION CHECKLIST */}
      {activeTab === 'inspection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--ft-text-2)' }}>
              Touch <strong style={{ color: 'var(--ft-success)' }}>Pass</strong>, <strong style={{ color: 'var(--ft-warning)' }}>Caution</strong>, or <strong style={{ color: 'var(--ft-danger)' }}>Fail</strong>. Findings sync directly to the customer digital estimate.
            </span>
            {inspection?.status !== 'completed' && (
              <button
                onClick={handleCompleteInspection}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                Complete Inspection & Submit
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(!inspection?.items || inspection.items.length === 0) ? (
              <div className="card-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ft-text-3)' }}>
                {repairOrders.length === 0 
                  ? 'No active repair orders in shop. Check in a vehicle to open an inspection checklist.' 
                  : 'Select an active repair order from the bay queue above to conduct a digital vehicle inspection.'}
              </div>
            ) : (
              inspection.items.map((item) => (
                <div
                  key={item.id}
                  className="card-panel"
                  style={{
                    padding: '1.25rem',
                    borderLeft: `5px solid ${item.status === 'pass' ? 'var(--ft-success)' : item.status === 'attention' ? 'var(--ft-warning)' : 'var(--ft-danger)'}`
                  }}
                >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: '1 1 340px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ft-cyan)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {item.category}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ft-text)', margin: '0.2rem 0 0.5rem' }}>
                      {item.name}
                    </div>

                    <input
                      type="text"
                      defaultValue={item.finding}
                      aria-label={`${item.name} observation or measurement`}
                      placeholder="Observation / Measurement (e.g. 2.8mm lining remaining)"
                      onBlur={(e) => handleUpdateItemFinding(item.id, e.target.value, item.recommendation)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        fontSize: '0.85rem',
                        marginBottom: '0.4rem'
                      }}
                    />

                    <input
                      type="text"
                      defaultValue={item.recommendation}
                      aria-label={`${item.name} recommendation`}
                      placeholder="Recommendation (e.g. Replace front pads & rotors)"
                      onBlur={(e) => handleUpdateItemFinding(item.id, item.finding, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  {/* Tablet Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }} role="group" aria-label={`${item.name} result`}>
                    <button
                      type="button"
                      aria-pressed={item.status === 'pass'}
                      onClick={() => handleUpdateItemStatus(item.id, 'pass')}
                      className={`tablet-btn ${item.status === 'pass' ? 'btn-emerald' : 'btn-secondary'}`}
                      style={{ minWidth: '95px' }}
                    >
                      <CheckCircle2 size={16} /> Pass
                    </button>

                    <button
                      type="button"
                      aria-pressed={item.status === 'attention'}
                      onClick={() => handleUpdateItemStatus(item.id, 'attention')}
                      style={{
                        minWidth: '105px',
                        background: item.status === 'attention' ? 'var(--ft-warning-strong)' : 'rgba(255, 255, 255, 0.04)',
                        color: item.status === 'attention' ? 'var(--ft-text)' : 'var(--ft-text-soft)',
                        border: item.status === 'attention' ? '1px solid var(--ft-warning-deep)' : '1px solid var(--ft-line-2)'
                      }}
                      className="tablet-btn"
                    >
                      <AlertTriangle size={16} /> Caution
                    </button>

                    <button
                      type="button"
                      aria-pressed={item.status === 'fail'}
                      onClick={() => handleUpdateItemStatus(item.id, 'fail')}
                      className={`tablet-btn ${item.status === 'fail' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ minWidth: '95px' }}
                    >
                      <XCircle size={16} /> Fail
                    </button>
                  </div>
                </div>

                {item.photoUrl && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={item.photoUrl}
                      alt="Evidence"
                      style={{ width: '80px', height: '58px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(199, 184, 255, 0.34)' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)' }}>📷 Photo evidence verified & attached to estimate</span>
                  </div>
                )}
              </div>
            )))}
          </div>
        </div>
      )}

      {/* TAB 2: FUTURETECH DIAGNOSTICS */}
      {activeTab === 'futuretech' && (
        <FutureTechPanel roId={selectedRoId} />
      )}

      {/* TAB 3: APPROVED WORK ORDER */}
      {activeTab === 'approved_work' && (
        <div className="card-panel" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="#2ED3A0" size={20} />
              Customer Authorized Work Orders ({currentRO?.roNumber})
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--ft-text-3)' }}>
              Only customer-approved estimate operations appear here for bay execution.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {currentRO?.estimate?.lines ? (
              currentRO.estimate.lines.filter(l => l.approved === true).map(line => (
                <div
                  key={line.id}
                  style={{
                    background: 'rgba(18, 21, 44, 0.7)',
                    border: '1px solid rgba(46, 211, 160, 0.25)',
                    borderRadius: '8px',
                    padding: '0.95rem 1.15rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ft-text)', fontSize: '0.9rem' }}>{line.description}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ft-text-3)', marginTop: '0.15rem' }}>
                      Part #: {line.partNumber || 'Labor standard'} • Notes: {line.notes || 'Ready for bay installation'}
                    </div>
                  </div>
                  <span className="badge badge-emerald">Authorized</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--ft-text-3)', textAlign: 'center', padding: '2rem' }}>
                No estimate yet approved for this repair order.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PARTS REQUISITION */}
      {activeTab === 'parts' && (
        <div className="card-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ft-text)' }}>
              Bay Parts Requisitions ({parts.length})
            </h4>
            <button
              onClick={() => setShowPartModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <Plus size={15} /> Request New Part
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {parts.map(part => (
              <div
                key={part.id}
                style={{
                  background: 'rgba(18, 21, 44, 0.7)',
                  border: '1px solid var(--ft-line-2)',
                  borderRadius: '8px',
                  padding: '0.95rem 1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--ft-text)', fontSize: '0.9rem' }}>
                    {part.partName} (Qty: {part.quantity})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ft-text-3)', marginTop: '0.15rem' }}>
                    Part #: {part.partNumber} • Source: {part.vendor}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className={`badge ${part.status === 'installed' ? 'badge-emerald' : part.status === 'received' ? 'badge-cyan' : 'badge-slate'}`}>
                    {part.status}
                  </span>
                  {part.status === 'received' && (
                    <button
                      onClick={async () => {
                        await api.updatePartStatus(part.id, 'installed');
                        loadPartsData(selectedRoId);
                        showToast('Part marked as installed', 'success');
                      }}
                      className="btn btn-emerald"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Mark Installed
                    </button>
                  )}
                </div>
              </div>
            ))}

            {parts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ft-text-3)' }}>
                No parts requested yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Part Request Modal */}
      {showPartModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="part-request-title" style={{ maxWidth: '500px', padding: 'clamp(1.25rem, 4vw, 1.75rem)' }}>
            <h4 id="part-request-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ft-text)', marginBottom: '1rem' }}>
              Request Parts to {currentRO?.bayNumber || 'Bay 1'}
            </h4>
            <form onSubmit={handleRequestPart}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label htmlFor="part-part-name-description" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.3rem' }}>Part Name / Description *</label>
                <input
                  id="part-part-name-description"
                  type="text"
                  required
                  placeholder="e.g. Bosch Double Iridium Spark Plugs (6-pack)"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem' }}
                />
              </div>

              <div className="ft-grid-2" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <label htmlFor="part-quantity" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.3rem' }}>Quantity</label>
                  <input
                  id="part-quantity"
                    type="number"
                    min="1"
                    value={partQty}
                    onChange={(e) => setPartQty(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
                <div>
                  <label htmlFor="part-urgency" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.3rem' }}>Urgency</label>
                  <select
                  id="part-urgency"
                    value={partUrgency}
                    onChange={(e) => setPartUrgency(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent (Bay Waiting)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button type="button" onClick={() => setShowPartModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
