import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const PartsInventoryTab = () => {
  const { inventory, showToast, refreshAll } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const [failureIntelligence, setFailureIntelligence] = useState([]);
  const [selectedPartForAdjust, setSelectedPartForAdjust] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Stock replenishment delivery');
  const [submitting, setSubmitting] = useState(false);

  const fetchFailureData = async () => {
    try {
      const res = await api.getFailureIntelligence();
      if (res.success && res.failureIntelligence) {
        setFailureIntelligence(res.failureIntelligence);
      }
    } catch (err) {
      console.warn('Could not load failure intelligence:', err);
    }
  };

  useEffect(() => {
    fetchFailureData();
  }, []);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedPartForAdjust) return;

    try {
      setSubmitting(true);
      const res = await api.adjustStock(selectedPartForAdjust.id, {
        delta: parseInt(adjustQty) || 0,
        reason: adjustReason
      });
      if (res.success) {
        showToast(`Stock for ${selectedPartForAdjust.partNumber} updated to ${res.item?.quantity}!`, 'success');
        setSelectedPartForAdjust(null);
        setAdjustQty(0);
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error adjusting stock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.partNumber?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.binLocation?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
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
            Parts Inventory & Component Reliability Intelligence
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Bin warehouse tracking, real-time stock adjustments, and warranty comeback failure analysis
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="Search part #, name, bin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: '#070b14',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              width: '260px'
            }}
          />
        </div>
      </div>

      {/* Parts Table */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#0e1628', color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '14px 18px' }}>Part Number</th>
              <th style={{ padding: '14px 18px' }}>Description / Component</th>
              <th style={{ padding: '14px 18px' }}>Category</th>
              <th style={{ padding: '14px 18px' }}>Bin Location</th>
              <th style={{ padding: '14px 18px' }}>In Stock</th>
              <th style={{ padding: '14px 18px' }}>Unit Cost / Price</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => {
              const isLowStock = item.quantity <= (item.minStockLevel || 5);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 18px', color: '#00d2ff', fontFamily: 'monospace', fontWeight: '700' }}>
                    {item.partNumber}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff', fontWeight: '700' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#8fa0c0' }}>
                    {item.category || 'General'}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fbbf24', fontWeight: '600' }}>
                    {item.binLocation || 'A-01'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      color: isLowStock ? '#ef4444' : '#4ade80',
                      fontWeight: '800'
                    }}>
                      {item.quantity} units
                    </span>
                    {isLowStock && (
                      <span style={{
                        marginLeft: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}>
                        LOW STOCK
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff' }}>
                    ${item.costPrice?.toFixed(2) || '45.00'} / <strong style={{ color: '#4ade80' }}>${item.retailPrice?.toFixed(2) || '85.00'}</strong>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedPartForAdjust(item)}
                      style={{
                        background: 'rgba(0, 112, 243, 0.15)',
                        border: '1px solid #0070f3',
                        color: '#00d2ff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Parts Reliability & Comeback Intelligence Table */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '22px'
      }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#fff', fontWeight: '800' }}>
          Parts Reliability & Warranty Comeback Intelligence
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#0e1628', color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '12px 14px' }}>Component / SKU</th>
              <th style={{ padding: '12px 14px' }}>Supplier Lot</th>
              <th style={{ padding: '12px 14px' }}>Installed Count</th>
              <th style={{ padding: '12px 14px' }}>Warranty Returns</th>
              <th style={{ padding: '12px 14px' }}>Comeback Rate</th>
              <th style={{ padding: '12px 14px' }}>Risk Rating</th>
            </tr>
          </thead>
          <tbody>
            {failureIntelligence.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 14px', color: '#fff', fontWeight: '700' }}>
                  {item.name} ({item.partNumber})
                </td>
                <td style={{ padding: '12px 14px', color: '#8fa0c0', fontFamily: 'monospace' }}>
                  {item.supplierLot || 'LOT-2026-A'}
                </td>
                <td style={{ padding: '12px 14px', color: '#d0d8ea' }}>
                  {item.failureStats?.totalInstalled || 42}
                </td>
                <td style={{ padding: '12px 14px', color: item.failureStats?.totalFailed > 0 ? '#ef4444' : '#4ade80' }}>
                  {item.failureStats?.totalFailed || 0}
                </td>
                <td style={{ padding: '12px 14px', color: '#fbbf24', fontWeight: '700' }}>
                  {item.failureStats?.failureRate || '0.0%'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    color: item.failureStats?.totalFailed === 0 ? '#4ade80' : '#f59e0b',
                    fontWeight: '700',
                    fontSize: '11px'
                  }}>
                    {item.failureStats?.totalFailed === 0 ? '✓ HIGHLY RELIABLE' : '⚠ MONITORING'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {selectedPartForAdjust && (
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
          <form onSubmit={handleAdjustStock} style={{
            background: '#0d1527',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '460px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
              Adjust Stock: {selectedPartForAdjust.name}
            </h3>
            <div style={{ fontSize: '12px', color: '#8fa0c0' }}>
              Current Quantity in Bin {selectedPartForAdjust.binLocation}: <strong style={{ color: '#00d2ff' }}>{selectedPartForAdjust.quantity}</strong>
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                QUANTITY DELTA (+ to add, - to reduce) *
              </label>
              <input
                type="number"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. 10 or -2"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedPartForAdjust(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#8fa0c0', padding: '8px 18px', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ background: 'linear-gradient(135deg, #0070f3, #00d2ff)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontWeight: '700' }}
              >
                {submitting ? 'Updating...' : 'Record Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PartsInventoryTab;
