import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const ServiceWriterTab = () => {
  const { selectedRO, repairOrders, setSelectedRoId, showToast, refreshAll } = useShop();
  const [estimate, setEstimate] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

  const activeRo = selectedRO || repairOrders[0];

  const fetchEstimate = async (roId) => {
    if (!roId) return;
    try {
      setLoading(true);
      const res = await api.getEstimate(roId);
      if (res.success && res.estimate) {
        setEstimate(res.estimate);
        setLines(res.estimate.lines || []);
      } else {
        setEstimate(null);
        setLines([]);
      }
    } catch (err) {
      console.warn('Could not load estimate:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRo?.id) {
      fetchEstimate(activeRo.id);
    }
  }, [activeRo?.id]);

  const handleAddLine = (type) => {
    const newLine = {
      id: `line_${Date.now()}`,
      type: type, // 'labor' | 'part'
      description: type === 'labor' ? 'Automotive Diagnostic & Calibration Labor' : 'OEM Replacement Part',
      quantity: 1,
      unitPrice: type === 'labor' ? 175.00 : 85.00,
      approved: false
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + (parseFloat(line.quantity) || 1) * (parseFloat(line.unitPrice) || 0), 0);
  };

  const subtotal = calculateSubtotal();
  const isVip = activeRo?.customer?.membershipTier === 'VIP Executive' || activeRo?.customer?.membershipTier === 'Gold Elite';
  const memberDiscount = isVip ? subtotal * 0.15 : 0;
  const taxableAmount = lines.filter(l => l.type === 'part').reduce((sum, l) => sum + (parseFloat(l.quantity) || 1) * (parseFloat(l.unitPrice) || 0), 0);
  const salesTax = taxableAmount * 0.0825;
  const shopSupplies = (lines.filter(l => l.type === 'labor').reduce((sum, l) => sum + (parseFloat(l.quantity) || 1) * (parseFloat(l.unitPrice) || 0), 0)) * 0.05;
  const total = subtotal - memberDiscount + salesTax + shopSupplies;

  const handleSaveEstimate = async () => {
    if (!activeRo?.id) return;
    try {
      setSaving(true);
      const res = await api.saveEstimate(activeRo.id, lines, 'estimate_pending');
      if (res.success) {
        showToast('Commercial estimate saved & dispatched to customer portal!', 'success');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error saving estimate', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAiDraftExplanation = async () => {
    if (!activeRo?.id) return;
    try {
      setAiDrafting(true);
      const res = await api.invokeServiceWriter(activeRo.id);
      if (res.success && res.recommendation) {
        setAiExplanation(res.recommendation.plainEnglishSummary || res.recommendation.explanation || '');
        showToast('AI Service Writer generated customer-friendly repair explanation!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error invoking AI Service Writer', 'error');
    } finally {
      setAiDrafting(false);
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
            Service Writer & Commercial Estimate Builder
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Itemized labor operations, parts pricing, tax/fee calculations, and AI customer explanations
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={activeRo?.id || ''}
            onChange={(e) => setSelectedRoId(e.target.value)}
            style={{
              background: '#070b14',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              color: '#00d2ff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              outline: 'none'
            }}
          >
            {repairOrders.map(ro => (
              <option key={ro.id} value={ro.id}>
                {ro.roNumber} • {ro.customer?.name || ro.customerName}
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveEstimate}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #0070f3, #00d2ff)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : '💾 Save & Dispatch Estimate'}
          </button>
        </div>
      </div>

      {/* RO Context Banner */}
      {activeRo && (
        <div style={{
          background: '#0a0f1d',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '13px'
        }}>
          <div>
            <span style={{ color: '#8fa0c0', fontSize: '11px', textTransform: 'uppercase' }}>Customer</span>
            <div style={{ color: '#fff', fontWeight: '700', marginTop: '2px' }}>
              {activeRo.customer?.name || activeRo.customerName}
            </div>
            <div style={{ color: isVip ? '#fbbf24' : '#00d2ff', fontSize: '11px' }}>
              {activeRo.customer?.membershipTier || 'Standard'} Member
            </div>
          </div>
          <div>
            <span style={{ color: '#8fa0c0', fontSize: '11px', textTransform: 'uppercase' }}>Vehicle</span>
            <div style={{ color: '#fff', fontWeight: '700', marginTop: '2px' }}>
              {activeRo.vehicle ? `${activeRo.vehicle.year} ${activeRo.vehicle.make} ${activeRo.vehicle.model}` : activeRo.vehicleSummary}
            </div>
            <div style={{ color: '#8fa0c0', fontSize: '11px', fontFamily: 'monospace' }}>
              VIN: {activeRo.vehicle?.vin || activeRo.vehicleVin}
            </div>
          </div>
          <div>
            <span style={{ color: '#8fa0c0', fontSize: '11px', textTransform: 'uppercase' }}>Assigned Bay & Tech</span>
            <div style={{ color: '#00d2ff', fontWeight: '700', marginTop: '2px' }}>
              {activeRo.bayNumber || 'Bay 3 (Diagnostics)'}
            </div>
            <div style={{ color: '#8fa0c0', fontSize: '11px' }}>
              Tech: {activeRo.assignedTechName || 'Marcus Vance'}
            </div>
          </div>
          <div>
            <span style={{ color: '#8fa0c0', fontSize: '11px', textTransform: 'uppercase' }}>Estimate Status</span>
            <div style={{ color: '#4ade80', fontWeight: '700', marginTop: '2px' }}>
              {(estimate?.status || activeRo.status || 'draft').replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Line Items Editor */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: '800' }}>
            Line-Item Operations & Parts Catalog
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleAddLine('labor')}
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
              + Add Labor Op
            </button>
            <button
              onClick={() => handleAddLine('part')}
              style={{
                background: 'rgba(74, 222, 128, 0.15)',
                border: '1px solid #4ade80',
                color: '#4ade80',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              + Add Part
            </button>
          </div>
        </div>

        {/* Table of lines */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#0e1628', color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '12px 14px' }}>Type</th>
              <th style={{ padding: '12px 14px' }}>Operation / Description</th>
              <th style={{ padding: '12px 14px', width: '90px' }}>Qty / Hrs</th>
              <th style={{ padding: '12px 14px', width: '120px' }}>Unit Rate</th>
              <th style={{ padding: '12px 14px', width: '120px' }}>Total</th>
              <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              const lineTotal = (parseFloat(line.quantity) || 1) * (parseFloat(line.unitPrice) || 0);
              return (
                <tr key={line.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: line.type === 'labor' ? 'rgba(0, 112, 243, 0.2)' : 'rgba(74, 222, 128, 0.15)',
                      color: line.type === 'labor' ? '#00d2ff' : '#4ade80',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {line.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => handleUpdateLine(idx, 'description', e.target.value)}
                      style={{
                        width: '100%',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <input
                      type="number"
                      step="0.1"
                      value={line.quantity}
                      onChange={(e) => handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 14px', color: '#4ade80', fontWeight: '700' }}>
                    ${lineTotal.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemoveLine(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '15px' }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '28px', textAlign: 'center', color: '#8fa0c0' }}>
                  No lines added yet. Click "+ Add Labor Op" or "+ Add Part" above.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Commercial Totals Block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{
            background: '#070b14',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '18px 24px',
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8fa0c0' }}>
              <span>Gross Subtotal:</span>
              <span style={{ color: '#fff', fontWeight: '600' }}>${subtotal.toFixed(2)}</span>
            </div>
            {isVip && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                <span>VIP Member Discount (15%):</span>
                <span>-${memberDiscount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8fa0c0' }}>
              <span>Sales Tax (Parts @ 8.25%):</span>
              <span style={{ color: '#fff' }}>${salesTax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8fa0c0' }}>
              <span>Shop Supplies & Environmental (5%):</span>
              <span style={{ color: '#fff' }}>${shopSupplies.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#00d2ff',
              fontWeight: '800',
              fontSize: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '10px',
              marginTop: '4px'
            }}>
              <span>Total Estimate:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Governed AI Service Writer Box */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(0, 210, 255, 0.25)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#00d2ff', fontWeight: '800' }}>
              ✨ Governed AI Service Writer — Plain-English Customer Explanation
            </h3>
            <div style={{ color: '#8fa0c0', fontSize: '12px', marginTop: '2px' }}>
              Summarizes technical DTC findings into clear, transparent customer-facing explanations
            </div>
          </div>
          <button
            onClick={handleAiDraftExplanation}
            disabled={aiDrafting}
            style={{
              background: 'linear-gradient(135deg, #0070f3, #00d2ff)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: aiDrafting ? 'not-allowed' : 'pointer'
            }}
          >
            {aiDrafting ? 'Generating...' : '✨ Draft Customer Summary'}
          </button>
        </div>

        <textarea
          rows={4}
          value={aiExplanation}
          onChange={(e) => setAiExplanation(e.target.value)}
          placeholder="AI-generated plain English customer summary will populate here. Advisor can review, edit, or override before sending to customer."
          style={{
            width: '100%',
            background: '#070b14',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: 1.5,
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>
    </div>
  );
};

export default ServiceWriterTab;
