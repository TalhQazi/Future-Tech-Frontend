import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const CustomersTab = ({ onSelectCustomer, onOpenCheckIn }) => {
  const { customers, vehicles, showToast, refreshAll } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    membershipTier: 'Standard',
    marketingOptIn: true
  });

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.email && c.email.toLowerCase().includes(q))
        )
      );
    }
  }, [searchTerm, customers]);

  useEffect(() => {
    if (selectedCustomer) {
      const vList = vehicles.filter(v => v.customerId === selectedCustomer.id);
      setCustomerVehicles(vList);
    } else {
      setCustomerVehicles([]);
    }
  }, [selectedCustomer, vehicles]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      showToast('Customer name and phone number are required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createCustomer(newCustomer);
      if (res.success) {
        showToast(`Customer account for ${newCustomer.name} created successfully!`, 'success');
        setShowAddModal(false);
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
          membershipTier: 'Standard',
          marketingOptIn: true
        });
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error creating customer account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0d1527',
        padding: '18px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
            Customer Management & Fleet Accounts
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Live customer directory, membership status, consent records, and vehicle garage profiles
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
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
              width: '280px'
            }}
          />
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Main Grid: Customer Table + Selected Customer Garage Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 380px' : '1fr', gap: '20px' }}>
        <div style={{
          background: '#0a0f1d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0e1628', color: '#8fa0c0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px' }}>Customer Name</th>
                <th style={{ padding: '14px 18px' }}>Direct Phone</th>
                <th style={{ padding: '14px 18px' }}>Email Address</th>
                <th style={{ padding: '14px 18px' }}>Membership Tier</th>
                <th style={{ padding: '14px 18px' }}>Consent Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust, idx) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <tr
                    key={cust.id || idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isSelected ? 'rgba(0, 112, 243, 0.12)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <td style={{ padding: '14px 18px', color: '#fff', fontWeight: '700' }}>
                      {cust.name}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#00d2ff', fontFamily: 'monospace' }}>
                      {cust.phone}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#d0d8ea' }}>
                      {cust.email || 'None on file'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        background: cust.membershipTier?.includes('VIP')
                          ? 'rgba(251, 191, 36, 0.15)'
                          : cust.membershipTier?.includes('Elite')
                          ? 'rgba(167, 139, 250, 0.15)'
                          : 'rgba(0, 210, 255, 0.12)',
                        color: cust.membershipTier?.includes('VIP')
                          ? '#fbbf24'
                          : cust.membershipTier?.includes('Elite')
                          ? '#a78bfa'
                          : '#00d2ff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '11px'
                      }}>
                        {cust.membershipTier || 'Standard'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        color: cust.consent?.marketingConsent !== false ? '#4ade80' : '#8fa0c0',
                        fontSize: '12px'
                      }}>
                        ● {cust.consent?.marketingConsent !== false ? 'SMS / Email Active' : 'Restricted'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCustomer(isSelected ? null : cust)}
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
                        {isSelected ? 'Close Garage' : 'Garage & History'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#8fa0c0' }}>
                    {searchTerm 
                      ? `No customer records found matching "${searchTerm}".` 
                      : 'No customer accounts in database yet. Click "+ Add Customer" to register a client.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Customer Garage Drawer */}
        {selectedCustomer && (
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
                  {selectedCustomer.name}
                </h3>
                <div style={{ color: '#00d2ff', fontSize: '12px', marginTop: '3px' }}>
                  {selectedCustomer.phone} • {selectedCustomer.membershipTier || 'Standard'} Tier
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'transparent', border: 'none', color: '#8fa0c0', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#d0d8ea', background: '#070b14', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div><strong>Address:</strong> {selectedCustomer.address || '1420 Silicon Blvd, Suite 200'}</div>
              <div style={{ marginTop: '4px' }}><strong>Email:</strong> {selectedCustomer.email || 'None on file'}</div>
              <div style={{ marginTop: '4px' }}><strong>Customer ID:</strong> {selectedCustomer.id}</div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#8fa0c0', textTransform: 'uppercase', marginBottom: '8px' }}>
                REGISTERED GARAGE VEHICLES ({customerVehicles.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {customerVehicles.map(veh => (
                  <div
                    key={veh.id}
                    style={{
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                      {veh.year} {veh.make} {veh.model}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00d2ff', fontFamily: 'monospace', marginTop: '2px' }}>
                      VIN: {veh.vin}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#8fa0c0' }}>
                      <span>Mileage: {veh.mileage?.toLocaleString() || veh.currentMileage || 'N/A'} mi</span>
                      <span style={{ color: '#4ade80', fontWeight: '700' }}>Health: {veh.healthScore || 90}/100</span>
                    </div>
                  </div>
                ))}
                {customerVehicles.length === 0 && (
                  <div style={{ color: '#8fa0c0', fontSize: '12px', fontStyle: 'italic', padding: '10px' }}>
                    No vehicles registered for this customer yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
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
          <form onSubmit={handleCreateCustomer} style={{
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
                Register New Customer
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
                FULL NAME *
              </label>
              <input
                type="text"
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="e.g. Rachel Adams"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                  PHONE NUMBER *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="(555) 000-0000"
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
                  MEMBERSHIP TIER
                </label>
                <select
                  value={newCustomer.membershipTier}
                  onChange={(e) => setNewCustomer({ ...newCustomer, membershipTier: e.target.value })}
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
                  <option value="Standard">Standard Care</option>
                  <option value="Bronze Club">Bronze Club</option>
                  <option value="Silver Pro">Silver Pro</option>
                  <option value="Gold Elite">Gold Elite</option>
                  <option value="VIP Executive">VIP Executive</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="rachel.adams@domain.com"
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
                STREET ADDRESS
              </label>
              <input
                type="text"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="100 Silicon Way, Palo Alto, CA"
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
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomersTab;
