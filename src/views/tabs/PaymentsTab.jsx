import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const PaymentsTab = () => {
  const { repairOrders, showToast, refreshAll } = useShop();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Adjustment state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Customer goodwill discount');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices();
      if (res.success && res.invoices) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      console.warn('Could not fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice?.roId) return;

    try {
      setProcessing(true);
      const res = await api.processPayment(selectedInvoice.roId, {
        amount: selectedInvoice.total || 320.00,
        paymentMethod: 'credit_card',
        cardNumber: cardNumber.replace(/\s+/g, ''),
        cardholderName: cardholderName || 'Valued Customer'
      });

      if (res.success) {
        showToast(`Payment of $${selectedInvoice.total?.toFixed(2)} processed! Receipt #${res.payment?.receiptNumber}`, 'success');
        setSelectedInvoice(null);
        setCardNumber('');
        setCardholderName('');
        setExpDate('');
        setCvv('');
        fetchInvoices();
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Payment processing failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePostAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice?.roId) return;

    try {
      setProcessing(true);
      const res = await api.postInvoiceAdjustment(selectedInvoice.roId, {
        amount: parseFloat(adjustAmount) || 0,
        type: 'credit',
        reason: adjustReason
      });

      if (res.success) {
        showToast('Financial adjustment posted to ledger!', 'success');
        setShowAdjustModal(false);
        fetchInvoices();
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Adjustment failed', 'error');
    } finally {
      setProcessing(false);
    }
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
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
            Invoices, Virtual Terminal & PCI-Safe Billing
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Itemized customer invoices, simulated gateway authorization, receipts, and ledger adjustments
          </div>
        </div>

        <button
          onClick={fetchInvoices}
          disabled={loading}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#d0d8ea',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh Invoices'}
        </button>
      </div>

      {/* Invoices List */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#0e1628', color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '14px 18px' }}>Invoice / RO #</th>
              <th style={{ padding: '14px 18px' }}>Customer Name</th>
              <th style={{ padding: '14px 18px' }}>Total Amount</th>
              <th style={{ padding: '14px 18px' }}>Paid Amount</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, idx) => {
              const ro = repairOrders.find(r => r.id === inv.roId);
              const isPaid = inv.status === 'paid';

              return (
                <tr key={inv.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 18px', color: '#00d2ff', fontWeight: '800' }}>
                    {ro?.roNumber || `RO-${inv.roId}`}
                    <div style={{ fontSize: '11px', color: '#8fa0c0', fontWeight: '400' }}>
                      Invoice #{inv.invoiceNumber || inv.id}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff', fontWeight: '700' }}>
                    {ro?.customer?.name || ro?.customerName || 'Valued Customer'}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff', fontWeight: '700' }}>
                    ${inv.total?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#4ade80' }}>
                    ${inv.amountPaid?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      background: isPaid ? 'rgba(74, 222, 128, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isPaid ? '#4ade80' : '#fbbf24',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '11px'
                    }}>
                      {isPaid ? 'PAID & SETTLED' : 'PENDING PAYMENT'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {!isPaid ? (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          style={{
                            background: 'linear-gradient(135deg, #0070f3, #00d2ff)',
                            border: 'none',
                            color: '#fff',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          💳 Pay Invoice
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowAdjustModal(true);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#d0d8ea',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Adjustment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#8fa0c0' }}>
                  No invoices found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Virtual Terminal Payment Modal */}
      {selectedInvoice && !showAdjustModal && (
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
          <form onSubmit={handleProcessPayment} style={{
            background: '#0d1527',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '480px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
                  PCI Virtual Payment Terminal
                </h3>
                <div style={{ color: '#00d2ff', fontSize: '12px', marginTop: '3px' }}>
                  Total to Charge: <strong style={{ color: '#4ade80', fontSize: '14px' }}>${selectedInvoice.total?.toFixed(2)}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'none', border: 'none', color: '#8fa0c0', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                CARDHOLDER NAME *
              </label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Elena Rostova"
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#00d2ff', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                CARD NUMBER *
              </label>
              <input
                type="text"
                required
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4000 1234 5678 9010"
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  color: '#fff',
                  fontFamily: 'monospace',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                  EXPIRATION (MM/YY) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  placeholder="12/28"
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                  SECURITY CODE (CVV) *
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="•••"
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#8fa0c0', background: '#070b14', padding: '10px', borderRadius: '6px' }}>
              🔒 <strong>PCI Compliance Invariant:</strong> Raw card details and CVV are sanitized and stripped in memory. Only the last 4 digits and gateway authorization tokens are stored.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#8fa0c0', padding: '10px 20px', borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #00d2ff)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: processing ? 'not-allowed' : 'pointer'
                }}
              >
                {processing ? 'Authorizing...' : `Authorize & Charge $${selectedInvoice.total?.toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Financial Adjustment Modal */}
      {showAdjustModal && selectedInvoice && (
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
          <form onSubmit={handlePostAdjustment} style={{
            background: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '460px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
              Post Financial Adjustment / Refund
            </h3>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                ADJUSTMENT CREDIT AMOUNT ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                REASON FOR ADJUSTMENT *
              </label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#8fa0c0', padding: '10px 20px', borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                style={{ background: '#0070f3', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontWeight: '700' }}
              >
                {processing ? 'Posting...' : 'Post Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;
