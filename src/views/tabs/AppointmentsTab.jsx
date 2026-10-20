import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const AppointmentsTab = ({ onOpenCheckIn }) => {
  const { appointments, customers, vehicles, showToast, refreshAll } = useShop();
  const [capacity, setCapacity] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBookModal, setShowBookModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newApt, setNewApt] = useState({
    customerId: '',
    vehicleId: '',
    requestedDate: new Date().toISOString().split('T')[0],
    requestedTime: '09:00 AM',
    serviceDescription: '',
    assignedBay: 'Bay 1 (Alignment)',
    isWaitingCustomer: true
  });

  const fetchCapacity = async () => {
    try {
      const res = await api.getBayCapacity();
      if (res.success) {
        setCapacity(res);
      }
    } catch (err) {
      console.warn('Could not fetch bay capacity:', err);
    }
  };

  useEffect(() => {
    fetchCapacity();
  }, []);

  const handleCheckInToRo = async (apt) => {
    try {
      const payload = {
        customerId: apt.customerId,
        vehicleId: apt.vehicleId,
        bayNumber: apt.assignedBay || 'Bay 2 (Lube & Express)',
        notes: `Intake from Appointment: ${apt.serviceDescription || 'Scheduled Service'}`,
        mileage: 45000
      };

      const roRes = await api.createRepairOrder(payload);
      if (roRes.success) {
        await api.updateAppointmentStatus(apt.id, 'checked_in', roRes.repairOrder?.id);
        showToast(`Checked in! Created Repair Order ${roRes.repairOrder?.roNumber}`, 'success');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error converting appointment to Repair Order', 'error');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!newApt.customerId || !newApt.serviceDescription) {
      showToast('Customer and service description are required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createAppointment(newApt);
      if (res.success) {
        showToast('Appointment successfully scheduled and reserved!', 'success');
        setShowBookModal(false);
        setNewApt({
          customerId: '',
          vehicleId: '',
          requestedDate: new Date().toISOString().split('T')[0],
          requestedTime: '09:00 AM',
          serviceDescription: '',
          assignedBay: 'Bay 1 (Alignment)',
          isWaitingCustomer: true
        });
        refreshAll();
        fetchCapacity();
      }
    } catch (err) {
      showToast(err.message || 'Error booking appointment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true;
    return apt.status === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Capacity Gauge */}
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
            Appointments & Bay Capacity Matrix
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Multi-bay dispatch schedule, real-time bay utilization, and 1-click RO check-in
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {capacity && (
            <div style={{
              background: '#070b14',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '11px', color: '#8fa0c0', fontWeight: '700', textTransform: 'uppercase' }}>
                Bay Load:
              </span>
              <span style={{
                color: capacity.utilizationPercent >= 85 ? '#ef4444' : '#00d2ff',
                fontWeight: '800',
                fontSize: '14px'
              }}>
                {capacity.utilizationPercent}% ({capacity.totalBays - capacity.availableBays}/{capacity.totalBays} Bays)
              </span>
            </div>
          )}

          <button
            onClick={() => setShowBookModal(true)}
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
            + Book Appointment
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'all', label: `All (${appointments.length})` },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'checked_in', label: 'Checked In' },
          { id: 'completed', label: 'Completed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            style={{
              background: filterStatus === tab.id ? '#0070f3' : '#0a0f1d',
              border: filterStatus === tab.id ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              color: filterStatus === tab.id ? '#fff' : '#8fa0c0',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#0e1628', color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '14px 18px' }}>Time & Date</th>
              <th style={{ padding: '14px 18px' }}>Customer</th>
              <th style={{ padding: '14px 18px' }}>Vehicle</th>
              <th style={{ padding: '14px 18px' }}>Requested Service</th>
              <th style={{ padding: '14px 18px' }}>Assigned Bay</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((apt, idx) => {
              const cust = customers.find(c => c.id === apt.customerId);
              const veh = vehicles.find(v => v.id === apt.vehicleId);

              return (
                <tr
                  key={apt.id || idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                  }}
                >
                  <td style={{ padding: '14px 18px', color: '#00d2ff', fontWeight: '700' }}>
                    {apt.requestedTime || '09:00 AM'}
                    <div style={{ fontSize: '11px', color: '#8fa0c0', fontWeight: '400' }}>
                      {apt.requestedDate || 'Today'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff', fontWeight: '700' }}>
                    {cust?.name || apt.customerName || 'Walk-in Customer'}
                    <div style={{ fontSize: '11px', color: '#8fa0c0' }}>
                      {cust?.phone || ''}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#d0d8ea' }}>
                    {veh ? `${veh.year} ${veh.make} ${veh.model}` : apt.vehicleSummary || 'Vehicle TBD'}
                    {veh?.vin && (
                      <div style={{ fontSize: '11px', color: '#00d2ff', fontFamily: 'monospace' }}>
                        {veh.vin.substring(0, 10)}...
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff' }}>
                    {apt.serviceDescription}
                    {apt.isWaitingCustomer && (
                      <span style={{
                        marginLeft: '8px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}>
                        WAITING IN LOUNGE
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#8fa0c0' }}>
                    {apt.assignedBay || 'Any Available Lift'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      background: apt.status === 'checked_in'
                        ? 'rgba(74, 222, 128, 0.15)'
                        : apt.status === 'confirmed'
                        ? 'rgba(0, 210, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: apt.status === 'checked_in'
                        ? '#4ade80'
                        : apt.status === 'confirmed'
                        ? '#00d2ff'
                        : '#8fa0c0',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '11px'
                    }}>
                      {(apt.status || 'scheduled').replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {apt.status !== 'checked_in' ? (
                      <button
                        onClick={() => handleCheckInToRo(apt)}
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
                        ⚡ Check-In to RO
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700' }}>
                        RO Active ✓
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredAppointments.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#8fa0c0' }}>
                  No appointments found for current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
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
          <form onSubmit={handleBookAppointment} style={{
            background: '#0d1527',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
                Schedule Service Appointment
              </h3>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                style={{ background: 'none', border: 'none', color: '#8fa0c0', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                SELECT CUSTOMER *
              </label>
              <select
                required
                value={newApt.customerId}
                onChange={(e) => setNewApt({ ...newApt, customerId: e.target.value })}
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
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                SELECT VEHICLE
              </label>
              <select
                value={newApt.vehicleId}
                onChange={(e) => setNewApt({ ...newApt, vehicleId: e.target.value })}
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
                <option value="">-- Choose Vehicle --</option>
                {vehicles
                  .filter(v => !newApt.customerId || v.customerId === newApt.customerId)
                  .map(v => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.vin})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                  DATE *
                </label>
                <input
                  type="date"
                  required
                  value={newApt.requestedDate}
                  onChange={(e) => setNewApt({ ...newApt, requestedDate: e.target.value })}
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
                  TIME SLOT *
                </label>
                <select
                  value={newApt.requestedTime}
                  onChange={(e) => setNewApt({ ...newApt, requestedTime: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#00d2ff',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                PRIMARY SERVICE CONCERN / REASON *
              </label>
              <input
                type="text"
                required
                value={newApt.serviceDescription}
                onChange={(e) => setNewApt({ ...newApt, serviceDescription: e.target.value })}
                placeholder="e.g. 50K Scheduled Inspection & Brake Pulsation Check"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
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
                {submitting ? 'Scheduling...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AppointmentsTab;
