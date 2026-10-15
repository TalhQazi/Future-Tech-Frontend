import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useShop } from '../context/ShopContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { BrandLogo } from '../components/BrandLogo.jsx';
import { useEscapeKey } from '../components/a11y.js';
import { 
  Car, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  FileCheck, 
  ChevronRight
} from 'lucide-react';

export const CustomerView = () => {
  const { showToast } = useShop();

  const [customerData, setCustomerData] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeRO, setActiveRO] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  // Digital Signature & Approval
  const [signatureName, setSignatureName] = useState('Elena Rostova');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEscapeKey(showPayModal && !isPaying, () => setShowPayModal(false));

  useEffect(() => {
    loadCustomerPortal();
  }, []);

  const loadCustomerPortal = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomerById('cust_1');
      if (res.success) {
        setCustomerData(res.customer);
        if (res.customer.vehicles?.length > 0) {
          const veh = res.customer.vehicles[0];
          setSelectedVehicle(veh);
          await loadVehicleRO(veh.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleRO = async (vehicleId) => {
    try {
      const roRes = await api.getRepairOrders({ customerId: 'cust_1' });
      if (roRes.success && roRes.repairOrders.length > 0) {
        const ro = roRes.repairOrders[0];
        setActiveRO(ro);
        const [estRes, inspRes] = await Promise.all([
          api.getEstimate(ro.id).catch(() => ({ success: false })),
          api.getInspection(ro.id).catch(() => ({ success: false }))
        ]);
        if (estRes.success) setEstimate(estRes.estimate);
        if (inspRes.success) setInspection(inspRes.inspection);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Approve sets a line to approved, Decline sets it to declined
  const handleSetLineApproval = async (lineId, newStatus) => {
    if (!activeRO) return;
    try {
      const res = await api.updateLineApproval(activeRO.id, lineId, newStatus, signatureName);
      if (res.success) {
        setEstimate(res.estimate);
        showToast(`Line item ${newStatus ? 'APPROVED' : 'DECLINED'}. Total adjusted.`, 'info');
      }
    } catch (err) {
      showToast('Could not update line approval', 'error');
    }
  };

  const handleApproveAll = async () => {
    if (!activeRO) return;
    try {
      setIsSubmittingApproval(true);
      const res = await api.approveAllEstimate(activeRO.id, signatureName);
      if (res.success) {
        setEstimate(res.estimate);
        showToast('All recommended work approved! Technician authorized.', 'success');
      }
    } catch (err) {
      showToast('Failed to approve estimate', 'error');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleProcessCardPayment = async (e) => {
    e.preventDefault();
    if (!activeRO) return;
    try {
      setIsPaying(true);
      const res = await api.processPayment(activeRO.id, {
        paymentMethod: 'credit_card',
        cardLast4: '4242'
      });
      if (res.success) {
        showToast('Payment successful! Receipt sent to your email.', 'success');
        setShowPayModal(false);
        loadVehicleRO(selectedVehicle.id);
      }
    } catch (err) {
      showToast('Payment authorization failed', 'error');
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ft-text-2)' }}>
        <p>Loading your garage portal...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      
      {/* Customer Header Banner with FutureTech Brand */}
      <div className="card-panel" style={{
        background: 'var(--ft-grad-panel)',
        border: '1px solid rgba(199, 184, 255, 0.34)',
        borderRadius: '16px',
        padding: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 8px 32px rgba(121, 87, 255, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <BrandLogo style={{ height: '56px', width: 'auto', flex: 'none' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ft-text)' }}>
                Welcome back, {customerData?.name}
              </span>
              <span className="badge badge-brand">{customerData?.membership?.tier || 'VIP Gold Care'}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--ft-text-2)' }}>
              Account #: <span style={{ fontFamily: 'var(--ft-font-mono)', color: 'var(--ft-cyan)' }}>{customerData?.membership?.number || 'MBR-88291'}</span> • Benefits: 15% Labor Discount & Free Diagnostics Active
            </p>
          </div>
        </div>

        {/* Garage Vehicle Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} role="group" aria-label="Your vehicles">
          {customerData?.vehicles?.map(veh => {
            const isSelected = selectedVehicle?.id === veh.id;
            return (
              <button
                key={veh.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => { setSelectedVehicle(veh); loadVehicleRO(veh.id); }}
                style={{
                  background: isSelected ? 'var(--ft-grad-brand)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? 'var(--ft-text)' : 'var(--ft-text-soft)',
                  border: isSelected ? '1px solid rgba(199, 184, 255, 0.42)' : '1px solid var(--ft-line-2)',
                  boxShadow: isSelected ? '0 2px 10px rgba(121, 87, 255, 0.35)' : 'none',
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Car size={16} />
                <span>{veh.year} {veh.model}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Repair Progress Stepper */}
      {activeRO && (
        <div className="card-panel" style={{ padding: '1.5rem', background: 'rgba(18, 21, 44, 0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ft-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Service Order
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ft-text)' }}>
                {activeRO.roNumber} — {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
              </h3>
            </div>
            <StatusBadge status={activeRO.status} type="ro" />
          </div>

          {/* Stepper */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
            gap: '0.75rem',
            textAlign: 'center'
          }}>
            {[
              { label: 'Check-In', done: true },
              { label: 'Digital Inspection', done: ['inspection', 'estimate_pending', 'work_authorized', 'in_progress', 'ready_for_payment', 'completed'].includes(activeRO.status) },
              { label: 'Estimate & Approval', done: ['work_authorized', 'in_progress', 'ready_for_payment', 'completed'].includes(activeRO.status) },
              { label: 'Service In Progress', done: ['in_progress', 'ready_for_payment', 'completed'].includes(activeRO.status) },
              { label: 'Ready for Pickup', done: ['ready_for_payment', 'completed'].includes(activeRO.status) },
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: step.done ? 'rgba(121, 87, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: step.done ? '1px solid rgba(199, 184, 255, 0.39)' : '1px solid var(--ft-line)',
                  padding: '0.85rem 0.6rem',
                  borderRadius: '10px'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: step.done ? 'var(--ft-grad-brand)' : 'rgba(255, 255, 255, 0.08)',
                  color: step.done ? 'var(--ft-text)' : 'var(--ft-text-3)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.45rem',
                  boxShadow: step.done ? '0 0 10px rgba(121, 87, 255, 0.3)' : 'none'
                }}>
                  {step.done ? '✓' : idx + 1}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: step.done ? 'var(--ft-text)' : 'var(--ft-text-3)' }}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Transparent Inspection on Left, Itemized Estimate on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.5rem' }}>
        
        {/* Left: Digital Vehicle Inspection Report */}
        <div className="card-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="#36D6F5" size={22} />
              Digital Inspection Report
            </h3>
            {inspection?.summary && (
              <span className="badge badge-brand">{inspection.summary.pass} Pass / {inspection.summary.fail} Action Items</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {inspection?.items?.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(18, 21, 44, 0.7)',
                  border: '1px solid var(--ft-line)',
                  borderRadius: '10px',
                  padding: '1rem',
                  borderLeft: `4px solid ${item.status === 'pass' ? 'var(--ft-success)' : item.status === 'attention' ? 'var(--ft-warning)' : 'var(--ft-danger)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ color: 'var(--ft-text)', fontSize: '0.92rem' }}>{item.name}</strong>
                  <StatusBadge status={item.status} type="inspection" />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--ft-text-soft)', marginBottom: '0.45rem' }}>
                  {item.finding || 'Inspected by technician.'}
                </p>
                {item.photoUrl && (
                  <img
                    src={item.photoUrl}
                    alt="Photo evidence"
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(199, 184, 255, 0.29)', marginTop: '0.35rem' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Estimate Review & Line Approval */}
        <div className="card-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck color="#36D6F5" size={22} />
              Review & Authorize Estimate
            </h3>
            <span className="badge badge-brand">{estimate?.status || 'Pending'}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ft-text-2)', marginBottom: '1.25rem' }}>
            Select individual items to approve or decline. Only approved work will be performed.
          </p>

          {/* Itemized Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {estimate?.lines?.map(line => {
              const isApproved = line.approved === true;
              const isDeclined = line.approved === false;

              return (
                <div
                  key={line.id}
                  style={{
                    background: isApproved ? 'rgba(46, 211, 160, 0.08)' : isDeclined ? 'rgba(255, 93, 125, 0.08)' : 'rgba(18, 21, 44, 0.7)',
                    border: isApproved ? '1px solid rgba(46, 211, 160, 0.4)' : isDeclined ? '1px solid rgba(255, 93, 125, 0.3)' : '1px solid var(--ft-line)',
                    borderRadius: '10px',
                    padding: '0.95rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ft-text)', fontSize: '0.9rem' }}>
                        {line.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ft-text-3)', marginTop: '0.2rem' }}>
                        {line.type === 'part' ? `Part #${line.partNumber || 'OEM'}` : `Labor Operation (${line.laborHours} hrs)`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ft-cyan)', fontSize: '1.05rem' }}>
                        ${line.lineTotal?.toFixed(2)}
                      </div>

                      {/* Approval Toggles */}
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem' }}>
                        <button
                          type="button"
                          aria-pressed={isApproved}
                          onClick={() => handleSetLineApproval(line.id, true)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: 'none',
                            background: isApproved ? 'var(--ft-success)' : 'rgba(255, 255, 255, 0.08)',
                            color: isApproved ? 'var(--ft-text)' : 'var(--ft-text-soft)'
                          }}
                        >
                          {isApproved ? '✓ Approved' : 'Approve'}
                        </button>

                        <button
                          type="button"
                          aria-pressed={isDeclined}
                          onClick={() => handleSetLineApproval(line.id, false)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: 'none',
                            background: isDeclined ? 'var(--ft-danger)' : 'rgba(255, 255, 255, 0.08)',
                            color: isDeclined ? 'var(--ft-text)' : 'var(--ft-text-3)'
                          }}
                        >
                          {isDeclined ? '✕ Declined' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Summary */}
          {estimate?.summary && (
            <div style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line)', borderRadius: '10px', padding: '1.1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text-2)', marginBottom: '0.35rem' }}>
                <span>Subtotal (Approved Work)</span>
                <span>${estimate.summary.subtotal?.toFixed(2)}</span>
              </div>
              {estimate.summary.memberDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-success)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <span>VIP Gold Care Discount (15% Labor)</span>
                  <span>-${estimate.summary.memberDiscount?.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text-2)', marginBottom: '0.35rem' }}>
                <span>Taxes & Environmental Disposal</span>
                <span>${estimate.summary.tax?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text-2)', marginBottom: '0.35rem' }}>
                <span>Shop Supplies Fee</span>
                <span>${estimate.summary.shopSuppliesFee?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text)', fontWeight: 700, fontSize: '1.25rem', borderTop: '1px solid var(--ft-line-2)', paddingTop: '0.65rem', marginTop: '0.65rem' }}>
                <span>Total Authorized</span>
                <span style={{ color: 'var(--ft-cyan)' }}>${estimate.summary.total?.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleApproveAll}
              disabled={isSubmittingApproval}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', borderRadius: '10px' }}
            >
              <CheckCircle2 size={18} /> Approve All Recommended Items
            </button>

            {(activeRO?.status === 'ready_for_payment' || activeRO?.status === 'completed') && (
              <button
                onClick={() => setShowPayModal(true)}
                className="btn btn-emerald"
                style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', borderRadius: '10px' }}
              >
                <CreditCard size={18} /> Pay Invoice Online (${estimate?.summary?.total?.toFixed(2) || '171.75'})
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="pay-title" style={{ maxWidth: '500px', padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} color="#2ED3A0" />
                <h3 id="pay-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ft-text)' }}>
                  Secure Payment
                </h3>
              </div>
              <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} aria-label="Close payment">✕</button>
            </div>

            <div style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--ft-text-2)' }}>Repair Order</span>
                <span style={{ color: 'var(--ft-text)', fontWeight: 700 }}>{activeRO?.roNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--ft-line-2)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--ft-text)', fontWeight: 700 }}>Total Amount Due</span>
                <span style={{ color: 'var(--ft-success)', fontWeight: 700, fontSize: '1.2rem' }}>${estimate?.summary?.total || 171.75}</span>
              </div>
            </div>

            <form onSubmit={handleProcessCardPayment}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="pay-cardholder-name" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.35rem' }}>
                  Cardholder Name
                </label>
                <input
                  id="pay-cardholder-name"
                  type="text"
                  required
                  defaultValue="Elena Rostova"
                  style={{ width: '100%', padding: '0.65rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.35rem' }}>
                  Card Information (Stripe Tokenized)
                </label>
                <div style={{ background: 'var(--ft-inset)', border: '1px solid rgba(199, 184, 255, 0.34)', padding: '0.75rem', borderRadius: '8px', color: 'var(--ft-text-soft)', fontFamily: 'var(--ft-font-mono)', fontSize: '0.9rem' }}>
                  •••• •••• •••• 4242 &nbsp;|&nbsp; 12/28 &nbsp;|&nbsp; CVC •••
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--ft-text-3)', display: 'block', marginTop: '0.35rem' }}>
                  🔒 Securely processed via Stripe. Raw card numbers are never stored.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="btn btn-emerald"
                  style={{ minWidth: '160px' }}
                >
                  {isPaying ? 'Authorizing...' : 'Pay Now →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
