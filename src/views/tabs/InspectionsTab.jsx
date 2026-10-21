import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const InspectionsTab = () => {
  const { selectedRO, repairOrders, setSelectedRoId, showToast, refreshAll } = useShop();
  const [inspection, setInspection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeRo = selectedRO || repairOrders[0];

  const fetchInspection = async (roId) => {
    if (!roId) return;
    try {
      setLoading(true);
      const res = await api.getInspection(roId);
      if (res.success && res.inspection) {
        setInspection(res.inspection);
        setItems(res.inspection.items || []);
      }
    } catch (err) {
      console.warn('Could not load inspection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRo?.id) {
      fetchInspection(activeRo.id);
    }
  }, [activeRo?.id]);

  const handleUpdateStatus = async (itemId, newStatus) => {
    if (!activeRo?.id || inspection?.locked) return;
    const updated = items.map(item => item.id === itemId ? { ...item, status: newStatus } : item);
    setItems(updated);

    try {
      await api.updateInspectionItem(activeRo.id, itemId, { status: newStatus });
      showToast('Finding updated', 'info');
    } catch (err) {
      showToast(err.message || 'Error updating finding', 'error');
    }
  };

  const handleUpdateMeasurement = async (itemId, measurement) => {
    if (!activeRo?.id || inspection?.locked) return;
    const updated = items.map(item => item.id === itemId ? { ...item, measurement } : item);
    setItems(updated);

    try {
      await api.updateInspectionItem(activeRo.id, itemId, { measurement });
    } catch (err) {
      console.warn('Measurement update failed:', err);
    }
  };

  const handleLockInspection = async () => {
    if (!activeRo?.id || inspection?.locked) return;
    try {
      setSaving(true);
      const res = await api.completeInspection(activeRo.id);
      if (res.success) {
        setInspection(prev => ({ ...prev, locked: true }));
        showToast('Inspection findings signed off and permanently locked into immutable record!', 'success');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error locking inspection', 'error');
    } finally {
      setSaving(false);
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
            Multi-Point Digital Vehicle Inspection (DVI)
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Specification-based evaluation, photo evidence capture, and tamper-evident findings locking
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
            {repairOrders.length === 0 ? (
              <option value="">No Active Repair Orders</option>
            ) : (
              repairOrders.map(ro => (
                <option key={ro.id} value={ro.id}>
                  {ro.roNumber} • {ro.vehicle ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : ro.vehicleSummary}
                </option>
              ))
            )}
          </select>

          {inspection?.locked ? (
            <span style={{
              background: 'rgba(74, 222, 128, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              🔒 EVIDENCE LOCKED
            </span>
          ) : (
            <button
              onClick={handleLockInspection}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #10b981, #00d2ff)',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Locking...' : '✓ Complete & Lock Inspection'}
            </button>
          )}
        </div>
      </div>

      {/* Checklist Grid */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        {loading ? (
          <div style={{ color: '#8fa0c0', textAlign: 'center', padding: '40px' }}>
            Loading inspection checklist...
          </div>
        ) : items.length === 0 ? (
          <div style={{ color: '#8fa0c0', textAlign: 'center', padding: '40px' }}>
            No inspection items initialized for this repair order.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  background: '#070b14',
                  border: item.status === 'fail'
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : item.status === 'attention'
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#8fa0c0', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>
                      {item.category || 'General'}
                    </span>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                      {item.name}
                    </span>
                  </div>
                  {item.notes && (
                    <div style={{ color: '#d0d8ea', fontSize: '12px', marginTop: '4px' }}>
                      {item.notes}
                    </div>
                  )}
                  {item.photoUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={item.photoUrl}
                        alt="Evidence"
                        style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Measurement field */}
                  <input
                    type="text"
                    disabled={inspection?.locked}
                    value={item.measurement || ''}
                    onChange={(e) => handleUpdateMeasurement(item.id, e.target.value)}
                    placeholder="Measurement (e.g. 4mm / 12.6V)"
                    style={{
                      background: '#0e1628',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#00d2ff',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      outline: 'none',
                      width: '180px'
                    }}
                  />

                  {/* 3-Way Pass / Attention / Fail Button Group */}
                  <div style={{ display: 'flex', background: '#0e1628', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button
                      type="button"
                      disabled={inspection?.locked}
                      onClick={() => handleUpdateStatus(item.id, 'pass')}
                      style={{
                        background: item.status === 'pass' ? '#10b981' : 'transparent',
                        border: 'none',
                        color: item.status === 'pass' ? '#fff' : '#8fa0c0',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: inspection?.locked ? 'default' : 'pointer'
                      }}
                    >
                      ✓ Pass
                    </button>
                    <button
                      type="button"
                      disabled={inspection?.locked}
                      onClick={() => handleUpdateStatus(item.id, 'attention')}
                      style={{
                        background: item.status === 'attention' ? '#f59e0b' : 'transparent',
                        border: 'none',
                        color: item.status === 'attention' ? '#fff' : '#8fa0c0',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: inspection?.locked ? 'default' : 'pointer'
                      }}
                    >
                      ! Attention
                    </button>
                    <button
                      type="button"
                      disabled={inspection?.locked}
                      onClick={() => handleUpdateStatus(item.id, 'fail')}
                      style={{
                        background: item.status === 'fail' ? '#ef4444' : 'transparent',
                        border: 'none',
                        color: item.status === 'fail' ? '#fff' : '#8fa0c0',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: inspection?.locked ? 'default' : 'pointer'
                      }}
                    >
                      ✕ Fail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionsTab;
