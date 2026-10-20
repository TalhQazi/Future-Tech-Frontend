import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const VehiclesTab = ({ onOpenCheckIn }) => {
  const { vehicles, customers, showToast, refreshAll } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const [vinToDecode, setVinToDecode] = useState('');
  const [decodedSpec, setDecodedSpec] = useState(null);
  const [decoding, setDecoding] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newVehicle, setNewVehicle] = useState({
    customerId: '',
    vin: '',
    year: 2023,
    make: '',
    model: '',
    licensePlate: '',
    mileage: 35000,
    engine: '2.0L Turbocharged I4',
    transmission: 'Automatic 8-Speed'
  });

  const handleDecodeVin = async (e) => {
    if (e) e.preventDefault();
    if (!vinToDecode || vinToDecode.length < 11) {
      showToast('Please enter a valid VIN (11 to 17 characters)', 'error');
      return;
    }

    try {
      setDecoding(true);
      const res = await api.decodeVin(vinToDecode);
      if (res.success && res.specs) {
        setDecodedSpec(res.specs);
        showToast(`Successfully decoded VIN specifications for ${res.specs.make} ${res.specs.model}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error decoding VIN', 'error');
    } finally {
      setDecoding(false);
    }
  };

  const handleViewHistory = async (veh) => {
    setSelectedVehicle(veh);
    try {
      setLoadingHistory(true);
      const res = await api.getVehicleHistory(veh.id);
      if (res.success) {
        setHistoryTimeline(res.history || []);
      }
    } catch (err) {
      console.warn('Could not fetch vehicle history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.vin || !newVehicle.make || !newVehicle.model) {
      showToast('VIN, Make, and Model are required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createVehicle(newVehicle);
      if (res.success) {
        showToast(`Vehicle ${newVehicle.year} ${newVehicle.make} ${newVehicle.model} registered!`, 'success');
        setShowAddModal(false);
        setNewVehicle({
          customerId: '',
          vin: '',
          year: 2023,
          make: '',
          model: '',
          licensePlate: '',
          mileage: 35000,
          engine: '2.0L Turbocharged I4',
          transmission: 'Automatic 8-Speed'
        });
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error registering vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      v.vin?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.licensePlate?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & VIN Decoder Tool */}
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
            Vehicle Fleet Intelligence & VIN Decoding Engine
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            17-character ISO 3779 VIN decoder, 360-degree service history dossiers, and real-time telemetry health scores
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddModal(true)}
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
            + Register Vehicle
          </button>
        </div>
      </div>

      {/* Interactive VIN Decoder Bar */}
      <form onSubmit={handleDecodeVin} style={{
        background: '#0a0f1d',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap'
      }}>
        <div style={{ color: '#00d2ff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⚡ VIN DECODER:
        </div>
        <input
          type="text"
          placeholder="Enter 17-digit VIN (e.g. WP0AB2Y14NSA92811)..."
          value={vinToDecode}
          onChange={(e) => setVinToDecode(e.target.value.toUpperCase())}
          style={{
            flex: 1,
            minWidth: '240px',
            background: '#070b14',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            color: '#fff',
            fontFamily: 'monospace',
            padding: '9px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={decoding}
          style={{
            background: '#0070f3',
            border: 'none',
            color: '#fff',
            padding: '9px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: decoding ? 'not-allowed' : 'pointer'
          }}
        >
          {decoding ? 'Decoding...' : 'Decode VIN Specifications'}
        </button>
      </form>

      {/* Decoded Specs Panel */}
      {decodedSpec && (
        <div style={{
          background: 'rgba(0, 112, 243, 0.08)',
          border: '1px solid rgba(0, 210, 255, 0.35)',
          borderRadius: '12px',
          padding: '18px 24px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
              OEM Spec Decoded: {decodedSpec.year} {decodedSpec.make} {decodedSpec.model} {decodedSpec.trim}
            </h3>
            <button
              onClick={() => setDecodedSpec(null)}
              style={{ background: 'none', border: 'none', color: '#8fa0c0', fontSize: '16px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={{ background: '#070b14', padding: '10px', borderRadius: '6px' }}>
              <span style={{ color: '#8fa0c0' }}>Engine:</span> <strong style={{ color: '#fff' }}>{decodedSpec.engine}</strong>
            </div>
            <div style={{ background: '#070b14', padding: '10px', borderRadius: '6px' }}>
              <span style={{ color: '#8fa0c0' }}>Transmission:</span> <strong style={{ color: '#fff' }}>{decodedSpec.transmission}</strong>
            </div>
            <div style={{ background: '#070b14', padding: '10px', borderRadius: '6px' }}>
              <span style={{ color: '#8fa0c0' }}>Drivetrain:</span> <strong style={{ color: '#fff' }}>{decodedSpec.drivetrain}</strong>
            </div>
            <div style={{ background: '#070b14', padding: '10px', borderRadius: '6px' }}>
              <span style={{ color: '#8fa0c0' }}>Plant:</span> <strong style={{ color: '#4ade80' }}>{decodedSpec.assemblyPlant}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Table & History Split */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedVehicle ? '1fr 380px' : '1fr', gap: '20px' }}>
        <div style={{
          background: '#0a0f1d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 18px', background: '#0e1628', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8fa0c0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
              ACTIVE FLEET VEHICLES ({filteredVehicles.length})
            </span>
            <input
              type="text"
              placeholder="Filter by VIN, model, plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: '#070b14',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none',
                width: '200px'
              }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px' }}>Vehicle / Model</th>
                <th style={{ padding: '14px 18px' }}>VIN Identifier</th>
                <th style={{ padding: '14px 18px' }}>Owner</th>
                <th style={{ padding: '14px 18px' }}>Mileage</th>
                <th style={{ padding: '14px 18px' }}>Health Score</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>History</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((veh, idx) => {
                const owner = customers.find(c => c.id === veh.customerId);
                const isSelected = selectedVehicle?.id === veh.id;

                return (
                  <tr
                    key={veh.id || idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isSelected ? 'rgba(0, 112, 243, 0.12)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 18px', color: '#fff', fontWeight: '700' }}>
                      {veh.year} {veh.make} {veh.model}
                      <div style={{ fontSize: '11px', color: '#8fa0c0', fontWeight: '400', marginTop: '2px' }}>
                        Plate: {veh.licensePlate || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#00d2ff', fontFamily: 'monospace', fontWeight: '600' }}>
                      {veh.vin}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#d0d8ea' }}>
                      {owner?.name || 'Shop Fleet'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fff' }}>
                      {veh.mileage?.toLocaleString() || veh.currentMileage || 'N/A'} mi
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        color: (veh.healthScore || 90) >= 80 ? '#4ade80' : (veh.healthScore || 90) >= 60 ? '#fbbf24' : '#ef4444',
                        fontWeight: '700'
                      }}>
                        {veh.healthScore || 90}/100
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewHistory(veh)}
                        style={{
                          background: isSelected ? '#0070f3' : 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#fff',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        360° History
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#8fa0c0' }}>
                    No vehicle records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 360° History Drawer */}
        {selectedVehicle && (
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '800' }}>
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h3>
                <div style={{ color: '#00d2ff', fontSize: '12px', fontFamily: 'monospace', marginTop: '3px' }}>
                  VIN: {selectedVehicle.vin}
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                style={{ background: 'transparent', border: 'none', color: '#8fa0c0', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '12px', fontWeight: '700', color: '#8fa0c0', textTransform: 'uppercase' }}>
              360-DEGREE SERVICE TIMELINE ({historyTimeline.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px' }}>
              {loadingHistory ? (
                <div style={{ color: '#8fa0c0', fontSize: '12px', padding: '16px', textAlign: 'center' }}>
                  Loading timeline records...
                </div>
              ) : historyTimeline.length === 0 ? (
                <div style={{ color: '#8fa0c0', fontSize: '12px', fontStyle: 'italic', padding: '12px' }}>
                  No historical repair records logged for this VIN yet.
                </div>
              ) : (
                historyTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#00d2ff', fontWeight: '700', fontSize: '12px' }}>
                        {item.roNumber || `Visit #${idx + 1}`}
                      </span>
                      <span style={{ color: '#8fa0c0', fontSize: '11px' }}>
                        {item.date || 'Recent'}
                      </span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '12px', marginTop: '4px' }}>
                      {item.serviceSummary || item.description || 'Routine service maintenance'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#8fa0c0' }}>
                      <span>Tech: {item.technician || 'Shop Tech'}</span>
                      <span style={{ color: '#4ade80' }}>${item.totalAmount ? item.totalAmount.toFixed(2) : '320.00'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Register Vehicle Modal */}
      {showAddModal && (
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
          <form onSubmit={handleCreateVehicle} style={{
            background: '#0d1527',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
                Register New Vehicle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#8fa0c0', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                ASSIGN TO CUSTOMER *
              </label>
              <select
                required
                value={newVehicle.customerId}
                onChange={(e) => setNewVehicle({ ...newVehicle, customerId: e.target.value })}
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
              >
                <option value="">-- Choose Owner --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#00d2ff', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                17-DIGIT VIN *
              </label>
              <input
                type="text"
                required
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value.toUpperCase() })}
                placeholder="WP0AB2Y14NSA92811"
                style={{
                  width: '100%',
                  background: '#070b14',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  color: '#fff',
                  fontFamily: 'monospace',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                  YEAR *
                </label>
                <input
                  type="number"
                  required
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || 2023 })}
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
                  MAKE *
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  placeholder="e.g. Porsche"
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
                  MODEL *
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="e.g. Taycan Turbo S"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                  LICENSE PLATE
                </label>
                <input
                  type="text"
                  value={newVehicle.licensePlate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="CAL-9281"
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
                  CURRENT MILEAGE
                </label>
                <input
                  type="number"
                  value={newVehicle.mileage}
                  onChange={(e) => setNewVehicle({ ...newVehicle, mileage: parseInt(e.target.value) || 0 })}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#8fa0c0',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #0070f3, #00d2ff)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Registering...' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehiclesTab;
