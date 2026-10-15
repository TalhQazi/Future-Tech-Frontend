import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useShop } from '../context/ShopContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { pressable, useEscapeKey } from '../components/a11y.js';
import { 
  Plus, 
  Search, 
  Send, 
  DollarSign, 
  FileText, 
  CreditCard, 
  User, 
  Car, 
  Phone,
  Sparkles,
  Layers
} from 'lucide-react';

export const AdvisorView = ({ onOpenCheckIn }) => {
  const { repairOrders, selectedRoId, setSelectedRoId, selectedRO, fetchROs, fetchSelectedRO, showToast } = useShop();

  const [filterQuery, setFilterQuery] = useState('');
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [payMethod, setPayMethod] = useState('card');

  // Estimate lines builder
  const [estimateLines, setEstimateLines] = useState([
    { type: 'labor', description: 'Diagnostic Labor & Multi-Point Testing', laborHours: 1.5, laborRate: 175, lineTotal: 262.50 },
    { type: 'part', description: 'OEM Spark Plug Set', partNumber: 'OEM-PLUG-6', quantity: 6, unitPrice: 19.50, lineTotal: 117.00 }
  ]);
  const [newLineDesc, setNewLineDesc] = useState('');
  const [newLineType, setNewLineType] = useState('labor');
  const [newLineHours, setNewLineHours] = useState('1.0');
  const [newLineRate, setNewLineRate] = useState('175');
  const [newLinePrice, setNewLinePrice] = useState('65.00');
  const [newLineQty, setNewLineQty] = useState('1');

  useEscapeKey(showEstimateModal, () => setShowEstimateModal(false));
  useEscapeKey(showCheckoutModal && !isProcessingPay, () => setShowCheckoutModal(false));

  const filteredROs = repairOrders.filter(ro => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      ro.roNumber.toLowerCase().includes(q) ||
      (ro.customer?.name && ro.customer.name.toLowerCase().includes(q)) ||
      (ro.vehicle?.vin && ro.vehicle.vin.toLowerCase().includes(q)) ||
      (ro.vehicle?.licensePlate && ro.vehicle.licensePlate.toLowerCase().includes(q)) ||
      (ro.vehicle?.make && ro.vehicle.make.toLowerCase().includes(q))
    );
  });

  const currentRO = selectedRO || repairOrders.find(r => r.id === selectedRoId) || repairOrders[0];

  const handleAddEstimateLine = (e) => {
    e.preventDefault();
    if (!newLineDesc) return;
    let total = 0;
    if (newLineType === 'labor') {
      total = parseFloat(newLineHours) * parseFloat(newLineRate);
    } else {
      total = parseFloat(newLineQty) * parseFloat(newLinePrice);
    }

    setEstimateLines([
      ...estimateLines,
      {
        id: `line_${Date.now()}`,
        type: newLineType,
        description: newLineDesc,
        laborHours: parseFloat(newLineHours) || 0,
        laborRate: parseFloat(newLineRate) || 0,
        quantity: parseFloat(newLineQty) || 1,
        unitPrice: parseFloat(newLinePrice) || 0,
        lineTotal: parseFloat(total.toFixed(2)),
        approved: null
      }
    ]);

    setNewLineDesc('');
  };

  const handleSendEstimate = async () => {
    try {
      const res = await api.saveEstimate(selectedRoId, estimateLines, 'sent');
      if (res.success) {
        showToast(`Estimate sent to customer (${currentRO?.customer?.phone || 'SMS'})`, 'success');
        setShowEstimateModal(false);
        fetchROs();
        fetchSelectedRO(selectedRoId);
      }
    } catch (err) {
      showToast('Failed to send estimate', 'error');
    }
  };

  const handleCheckoutPayment = async () => {
    try {
      setIsProcessingPay(true);
      const res = await api.processPayment(selectedRoId, {
        paymentMethod: payMethod,
        cardLast4: '4242'
      });
      if (res.success) {
        showToast('Payment recorded and transaction confirmed. RO closed.', 'success');
        setShowCheckoutModal(false);
        fetchROs();
        fetchSelectedRO(selectedRoId);
      }
    } catch (err) {
      showToast('Payment processing error', 'error');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const columns = [
    { id: 'checked_in', label: 'Checked In', color: 'var(--ft-text-3)' },
    { id: 'inspection', label: 'In Inspection', color: 'var(--ft-warning)' },
    { id: 'estimate_pending', label: 'Estimate Pending', color: 'var(--ft-cyan)' },
    { id: 'work_authorized', label: 'Authorized / Bay', color: 'var(--ft-success)' },
    { id: 'ready_for_payment', label: 'Ready for Pay', color: 'var(--ft-cyan)' },
    { id: 'completed', label: 'Completed', color: 'var(--ft-success)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Search and Action Toolbar */}
      <div className="card-panel" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem',
        background: 'rgba(18, 21, 44, 0.8)'
      }}>
        <div style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ft-text-3)' }} />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search Customer, VIN, Phone, or Plate..."
            aria-label="Search repair orders by customer, VIN, phone or plate"
            style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.4rem', fontSize: '0.85rem', borderRadius: '10px' }}
          />
        </div>

        <button
          onClick={onOpenCheckIn}
          className="btn btn-primary"
          style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', borderRadius: '10px' }}
        >
          <Plus size={16} /> New Check-In
        </button>
      </div>

      {/* Lovable Kanban Board Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: '0.9rem',
        alignItems: 'start'
      }}>
        {columns.map(col => {
          const colROs = filteredROs.filter(ro => {
            if (col.id === 'work_authorized') {
              return ro.status === 'work_authorized' || ro.status === 'in_progress';
            }
            return ro.status === col.id;
          });

          return (
            <div
              key={col.id}
              style={{
                background: 'rgba(18, 21, 44, 0.6)',
                border: '1px solid var(--ft-line-2)',
                borderRadius: '12px',
                padding: '0.85rem',
                minHeight: '280px',
                backdropFilter: 'blur(8px)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  {col.label}
                </span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--ft-line-2)',
                  fontSize: '0.72rem',
                  color: 'var(--ft-text-2)',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px',
                  fontWeight: 700
                }}>
                  {colROs.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {colROs.map(ro => {
                  const isSelected = ro.id === selectedRoId;
                  return (
                    <div
                      key={ro.id}
                      {...pressable(() => setSelectedRoId(ro.id))}
                      aria-pressed={isSelected}
                      aria-label={`${ro.roNumber}, ${ro.vehicle?.year || ''} ${ro.vehicle?.make || ''} ${ro.vehicle?.model || ''}`.trim()}
                      style={{
                        background: isSelected ? 'rgba(121, 87, 255, 0.08)' : 'rgba(24, 28, 56, 0.7)',
                        border: isSelected ? '1px solid rgba(199, 184, 255, 0.42)' : '1px solid var(--ft-line)',
                        boxShadow: isSelected ? '0 0 16px rgba(121, 87, 255, 0.15)' : 'none',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--ft-text)', fontSize: '0.85rem' }}>{ro.roNumber}</span>
                        <span className="badge badge-brand" style={{ fontSize: '0.65rem' }}>{ro.bayNumber || 'Bay 1'}</span>
                      </div>

                      <div style={{ fontWeight: 700, color: 'var(--ft-text-soft)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                        {ro.vehicle?.year} {ro.vehicle?.make} {ro.vehicle?.model}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--ft-text-2)' }}>
                        {ro.customer?.name} • {ro.customer?.phone}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.55rem', paddingTop: '0.45rem', borderTop: '1px solid var(--ft-line)', fontSize: '0.72rem', color: 'var(--ft-text-2)' }}>
                        <span>
                          {ro.dtcCount > 0 ? (
                            <strong style={{ color: 'var(--ft-danger)' }}>{ro.dtcCount} Faults</strong>
                          ) : (
                            <span style={{ color: 'var(--ft-success)' }}>0 Codes</span>
                          )}
                        </span>
                        <span>Tech: <strong style={{ color: 'var(--ft-text)' }}>{ro.assignedTech?.name?.split(' ')[0] || 'Unassigned'}</strong></span>
                      </div>
                    </div>
                  );
                })}

                {colROs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--ft-text-3)', fontSize: '0.78rem' }}>
                    No jobs
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected RO Workspace Card */}
      {currentRO && (
        <div className="card-panel" style={{ padding: '1.5rem', background: 'rgba(18, 21, 44, 0.85)', border: '1px solid rgba(199, 184, 255, 0.29)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--ft-text)' }}>
                  {currentRO.roNumber} — {currentRO.vehicle?.year} {currentRO.vehicle?.make} {currentRO.vehicle?.model}
                </span>
                <StatusBadge status={currentRO.status} type="ro" />
                <span className="badge badge-brand">{currentRO.customer?.membership?.tier || 'VIP Member'}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ft-text-2)' }}>
                Customer: <strong style={{ color: 'var(--ft-text)' }}>{currentRO.customer?.name}</strong> ({currentRO.customer?.phone}) • VIN: <span style={{ fontFamily: 'var(--ft-font-mono)', color: 'var(--ft-cyan)' }}>{currentRO.vehicle?.vin}</span> • Plate: {currentRO.vehicle?.licensePlate}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowEstimateModal(true)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <FileText size={15} /> Build / Dispatch Estimate
              </button>

              {(currentRO.status === 'ready_for_payment' || currentRO.status === 'completed' || currentRO.estimateStatus === 'approved') && (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="btn btn-emerald"
                  style={{ fontSize: '0.85rem' }}
                >
                  <CreditCard size={15} /> Checkout & Payment
                </button>
              )}
            </div>
          </div>

          {/* Details Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--ft-cyan)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Customer Concern</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--ft-text)', marginTop: '0.35rem', fontWeight: 500 }}>
                {currentRO.customerComplaints?.join(', ') || 'General Inspection'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ft-text-3)', marginTop: '0.45rem' }}>
                Odometer: <strong style={{ color: 'var(--ft-text-soft)' }}>{currentRO.odometerIn} mi</strong> • Assigned: {currentRO.assignedTech?.name || 'Marcus Vance'}
              </div>
            </div>

            <div style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--ft-cyan)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Inspection Results</div>
              {currentRO.inspectionSummary ? (
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.45rem' }}>
                  <span className="badge badge-emerald">{currentRO.inspectionSummary.pass} Passed</span>
                  <span className="badge badge-amber">{currentRO.inspectionSummary.attention} Caution</span>
                  <span className="badge badge-rose">{currentRO.inspectionSummary.fail} Failed</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--ft-text-3)', marginTop: '0.35rem' }}>Inspection in progress</div>
              )}
            </div>

            <div style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--ft-cyan)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Estimate & Billing</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
                {currentRO.estimateTotal ? `$${currentRO.estimateTotal.toFixed(2)}` : 'Awaiting Estimate'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ft-text-3)', marginTop: '0.3rem' }}>
                Status: <strong style={{ color: 'var(--ft-cyan)', textTransform: 'capitalize' }}>{currentRO.estimateStatus || 'Draft'}</strong> • Invoice: {currentRO.invoiceStatus || 'Unpaid'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estimate Modal */}
      {showEstimateModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="estimate-title" style={{ maxWidth: '750px', padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '0.75rem' }}>
              <div>
                <h4 id="estimate-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ft-text)' }}>
                  Estimate Builder — {currentRO?.roNumber}
                </h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--ft-text-2)' }}>
                  {currentRO?.vehicle?.year} {currentRO?.vehicle?.make} {currentRO?.vehicle?.model}
                </span>
              </div>
              <button type="button" onClick={() => setShowEstimateModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} aria-label="Close estimate builder">✕</button>
            </div>

            {/* Existing lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {estimateLines.map((line, idx) => (
                <div key={idx} style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line)', padding: '0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="badge badge-brand" style={{ marginRight: '0.5rem' }}>{line.type}</span>
                    <span style={{ color: 'var(--ft-text)', fontSize: '0.9rem', fontWeight: 600 }}>{line.description}</span>
                  </div>
                  <strong style={{ color: 'var(--ft-cyan)', fontSize: '1rem' }}>
                    ${line.lineTotal.toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>

            {/* Add line input */}
            <form onSubmit={handleAddEstimateLine} style={{ background: 'var(--ft-inset)', border: '1px solid rgba(199, 184, 255, 0.29)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ft-cyan)', marginBottom: '0.65rem' }}>
                Add Itemized Line:
              </div>
              <div className="ft-grid-estimate-line">
                <select aria-label="Line type" value={newLineType} onChange={(e) => setNewLineType(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.82rem' }}>
                  <option value="labor">Labor</option>
                  <option value="part">Part</option>
                </select>
                <input type="text" aria-label="Line description" placeholder="Line description" value={newLineDesc} onChange={(e) => setNewLineDesc(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.82rem' }} />
                {newLineType === 'labor' ? (
                  <>
                    <input type="number" step="0.1" aria-label="Labor hours" placeholder="Hrs" value={newLineHours} onChange={(e) => setNewLineHours(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.82rem' }} />
                    <input type="number" aria-label="Labor rate in dollars" placeholder="Rate ($)" value={newLineRate} onChange={(e) => setNewLineRate(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.82rem' }} />
                  </>
                ) : (
                  <>
                    <input type="number" aria-label="Quantity" placeholder="Qty" value={newLineQty} onChange={(e) => setNewLineQty(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.82rem' }} />
                    <input type="number" step="0.01" aria-label="Unit price in dollars" placeholder="Price ($)" value={newLinePrice} onChange={(e) => setNewLinePrice(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.82rem' }} />
                  </>
                )}
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.82rem' }}>+ Add</button>
              </div>
            </form>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button type="button" onClick={() => setShowEstimateModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="button" onClick={handleSendEstimate} className="btn btn-primary">
                <Send size={15} /> Send Estimate to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="checkout-title" style={{ maxWidth: '500px', padding: 'clamp(1.25rem, 4vw, 1.75rem)' }}>
            <h4 id="checkout-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ft-text)', marginBottom: '0.35rem' }}>
              Record Payment — {currentRO?.roNumber}
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--ft-text-2)', marginBottom: '1.25rem' }}>
              Total Due: <strong style={{ color: 'var(--ft-success)', fontSize: '1.15rem' }}>${currentRO?.estimateTotal || '345.50'}</strong>
            </div>

            <div style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line-2)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.5rem' }}>Payment Method</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`btn ${payMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.55rem' }}
                >
                  <CreditCard size={15} /> Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('cash')}
                  className={`btn ${payMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.55rem' }}
                >
                  <DollarSign size={15} /> Cash / Register
                </button>
              </div>

              {payMethod === 'card' && (
                <div style={{ background: 'var(--ft-surface)', border: '1px solid rgba(199, 184, 255, 0.34)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--ft-text)', fontFamily: 'var(--ft-font-mono)' }}>
                  💳 Card Terminal: STRIPE_POS_01 • Pre-authorized •••• 4242
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button type="button" onClick={() => setShowCheckoutModal(false)} className="btn btn-secondary">Cancel</button>
              <button
                type="button"
                onClick={handleCheckoutPayment}
                disabled={isProcessingPay}
                className="btn btn-emerald"
              >
                {isProcessingPay ? 'Recording...' : 'Confirm Payment & Close RO'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
