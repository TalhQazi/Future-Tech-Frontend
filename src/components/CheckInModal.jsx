import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useShop } from '../context/ShopContext.jsx';
import { BrandLogo } from './BrandLogo.jsx';
import { pressable, useEscapeKey } from './a11y.js';
import { 
  X, 
  Search, 
  User, 
  Car, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  Hash, 
  Phone, 
  Mail,
  Gauge
} from 'lucide-react';

export const CheckInModal = ({ isOpen, onClose }) => {
  const { fetchROs, setSelectedRoId, showToast } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected or New Customer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [customerVehicles, setCustomerVehicles] = useState([]);

  // New Customer Form toggle
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [membershipTier, setMembershipTier] = useState('Standard');

  // New Vehicle Form
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [newVin, setNewVin] = useState('');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('2022');
  const [newPlate, setNewPlate] = useState('');

  // RO Specifics
  const [odometer, setOdometer] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [advisorNotes, setAdvisorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(isOpen && !submitting, onClose);

  // Quick VIN Decoder
  const handleVinLookup = async (vinVal) => {
    setNewVin(vinVal);
    if (vinVal.length >= 11) {
      if (vinVal.startsWith('WA1')) {
        setNewMake('Audi');
        setNewModel('Q7 Quattro');
        setNewYear('2022');
      } else if (vinVal.startsWith('1FT')) {
        setNewMake('Ford');
        setNewModel('F-150 PowerBoost');
        setNewYear('2021');
      } else if (vinVal.startsWith('2T3')) {
        setNewMake('Toyota');
        setNewModel('RAV4 Hybrid');
        setNewYear('2020');
      } else if (vinVal.startsWith('7SA')) {
        setNewMake('Tesla');
        setNewModel('Model Y Dual Motor');
        setNewYear('2023');
      }
    }
  };

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const custRes = await api.searchCustomers(searchQuery);
        const vehRes = await api.searchVehicles(searchQuery);

        const combined = [];
        if (custRes.success) {
          custRes.customers.forEach(c => combined.push({ type: 'customer', data: c }));
        }
        if (vehRes.success) {
          vehRes.vehicles.forEach(v => combined.push({ type: 'vehicle', data: v }));
        }
        setSearchResults(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectExistingCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setIsNewCustomer(false);
    try {
      const res = await api.getCustomerById(cust.id);
      if (res.success && res.customer.vehicles) {
        setCustomerVehicles(res.customer.vehicles);
        if (res.customer.vehicles.length > 0) {
          setSelectedVehicle(res.customer.vehicles[0]);
          setOdometer(res.customer.vehicles[0].mileage || '');
        } else {
          setIsNewVehicle(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRO = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalCustId = selectedCustomer ? selectedCustomer.id : null;
      let finalVehId = selectedVehicle ? selectedVehicle.id : null;

      if (isNewCustomer || !finalCustId) {
        const custRes = await api.createCustomer({
          name: newCustName,
          phone: newCustPhone,
          email: newCustEmail,
          membershipTier
        });
        if (!custRes.success) throw new Error('Customer creation failed');
        finalCustId = custRes.customer.id;
      }

      if (isNewVehicle || !finalVehId) {
        const vehRes = await api.createVehicle({
          customerId: finalCustId,
          vin: newVin || `VIN${Date.now()}`,
          make: newMake || 'Generic Make',
          model: newModel || 'Vehicle Model',
          year: newYear || 2022,
          licensePlate: newPlate || 'TEMP',
          mileage: odometer || 35000
        });
        if (!vehRes.success) throw new Error('Vehicle creation failed');
        finalVehId = vehRes.vehicle.id;
      }

      const roRes = await api.createRepairOrder({
        customerId: finalCustId,
        vehicleId: finalVehId,
        odometerIn: odometer || 0,
        customerComplaints: complaintText ? [complaintText] : ['Initial Vehicle Check & Multi-Point Inspection'],
        advisorNotes: advisorNotes || 'Customer checked in via front desk terminal.',
        assignedTechId: 'usr_tech_1',
        bayNumber: 'Bay 3'
      });

      if (roRes.success) {
        showToast(`Opened ${roRes.repairOrder.roNumber} for ${selectedVehicle ? selectedVehicle.make : newMake}`, 'success');
        await fetchROs();
        setSelectedRoId(roRes.repairOrder.id);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to check in vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="checkin-title" style={{ maxWidth: '800px', padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
        {/* Header with FutureTech Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--ft-line-2)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <BrandLogo style={{ height: '48px', width: 'auto', flex: 'none' }} />
            <div>
              <h2 id="checkin-title" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ft-text)', letterSpacing: '-0.01em' }}>
                Vehicle Check-In & Intake
              </h2>
              <p style={{ color: 'var(--ft-text-2)', fontSize: '0.85rem' }}>
                Single VIN lookup • Zero redundant data entry • Open job & assign bay
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.7rem', flex: 'none' }}
            aria-label="Close check-in"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Existing */}
        {!selectedCustomer && !isNewCustomer && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="checkin-search-customer-or-vehicle-name-" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--ft-text-soft)', marginBottom: '0.5rem' }}>
              Search Customer or Vehicle (Name, Phone, VIN, or License Plate)
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ft-text-3)' }} size={18} />
              <input
                  id="checkin-search-customer-or-vehicle-name-"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Elena, 555-0192, WA1VAAF..., or 8XYZ21"
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.8rem',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div style={{
                marginTop: '0.75rem',
                background: 'var(--ft-inset)',
                border: '1px solid rgba(199, 184, 255, 0.34)',
                borderRadius: '10px',
                overflow: 'hidden',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                {searchResults.map((item, idx) => {
                  if (item.type === 'customer') {
                    const c = item.data;
                    return (
                      <div
                        key={`c_${c.id}_${idx}`}
                        {...pressable(() => selectExistingCustomer(c))}
                        style={{
                          padding: '0.85rem 1.15rem',
                          borderBottom: '1px solid var(--ft-line)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.15s ease'
                        }}
                        className="ft-option"
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--ft-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={15} color="#36D6F5" />
                            {c.name}
                            <span className="badge badge-brand" style={{ fontSize: '0.65rem' }}>{c.membership?.tier || 'Member'}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ft-text-3)', marginTop: '0.15rem' }}>
                            {c.phone} • {c.email}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.82rem', color: 'var(--ft-cyan)', fontWeight: 700 }}>Select & Intake →</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--ft-text-3)', fontSize: '0.85rem' }}>
              <span>Customer not found? </span>
              <button
                type="button"
                onClick={() => { setIsNewCustomer(true); setIsNewVehicle(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--ft-cyan)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                + Register New Customer & Vehicle
              </button>
            </div>
          </div>
        )}

        {/* Selected Customer Card */}
        {selectedCustomer && (
          <div className="card-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'var(--ft-inset)', border: '1px solid rgba(199, 184, 255, 0.34)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--ft-text)' }}>{selectedCustomer.name}</span>
                  <span className="badge badge-brand">{selectedCustomer.membership?.tier}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ft-text-2)', marginTop: '0.2rem' }}>
                  <Phone size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {selectedCustomer.phone} • <Mail size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {selectedCustomer.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedCustomer(null); setSelectedVehicle(null); }}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                Change Customer
              </button>
            </div>

            {/* Vehicle Selector */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--ft-line-2)', paddingTop: '0.85rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ft-text-soft)', display: 'block', marginBottom: '0.45rem' }}>
                Select Vehicle for Repair Order:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '0.75rem' }}>
                {customerVehicles.map(veh => {
                  const isChosen = selectedVehicle?.id === veh.id;
                  return (
                    <div
                      key={veh.id}
                      {...pressable(() => { setSelectedVehicle(veh); setOdometer(veh.mileage || ''); setIsNewVehicle(false); })}
                      aria-pressed={isChosen}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: isChosen ? '2px solid var(--ft-cyan)' : '1px solid var(--ft-line-2)',
                        background: isChosen ? 'rgba(121, 87, 255, 0.1)' : 'var(--ft-surface)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ft-text)' }}>
                        {veh.year} {veh.make} {veh.model}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ft-text-3)', fontFamily: 'var(--ft-font-mono)', marginTop: '0.15rem' }}>
                        VIN: {veh.vin.slice(0, 8)}... • Plate: {veh.licensePlate}
                      </div>
                    </div>
                  );
                })}
                <div
                  {...pressable(() => { setIsNewVehicle(true); setSelectedVehicle(null); })}
                  aria-pressed={isNewVehicle}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: isNewVehicle ? '2px solid var(--ft-cyan)' : '1px dashed rgba(255, 255, 255, 0.18)',
                    background: isNewVehicle ? 'rgba(54, 214, 245, 0.08)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: 'var(--ft-text-2)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <Plus size={16} /> Add Another Vehicle
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleCreateRO}>
          {/* New Customer Fields */}
          {isNewCustomer && (
            <div style={{ background: 'var(--ft-inset)', border: '1px solid rgba(199, 184, 255, 0.29)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ft-cyan)', marginBottom: '0.85rem' }}>
                New Customer Profile
              </h3>
              <div className="ft-grid-2">
                <div>
                  <label htmlFor="checkin-full-name" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
                  <input
                  id="checkin-full-name"
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Robert Smith"
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
                <div>
                  <label htmlFor="checkin-phone-number" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>Phone Number *</label>
                  <input
                  id="checkin-phone-number"
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="555-0199"
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
                <div>
                  <label htmlFor="checkin-email-address" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                  <input
                  id="checkin-email-address"
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="customer@email.com"
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
                <div>
                  <label htmlFor="checkin-membership-tier" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>Membership Tier</label>
                  <select
                  id="checkin-membership-tier"
                    value={membershipTier}
                    onChange={(e) => setMembershipTier(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="Standard">Standard Member</option>
                    <option value="VIP Gold Care">VIP Gold Care (Free Diagnostics + 15% Labor)</option>
                    <option value="Fleet Pro">Fleet Pro Commercial</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* New Vehicle Fields */}
          {isNewVehicle && (
            <div style={{ background: 'var(--ft-inset)', border: '1px solid rgba(199, 184, 255, 0.29)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ft-cyan)' }}>
                  Vehicle Information (Instant VIN Decoder)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--ft-text-3)' }}>No double VIN typing</span>
              </div>
              <div className="ft-grid-vehicle">
                <div>
                  <label htmlFor="checkin-vin-17-characters" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>VIN (17 Characters) *</label>
                  <input
                  id="checkin-vin-17-characters"
                    type="text"
                    required
                    value={newVin}
                    onChange={(e) => handleVinLookup(e.target.value.toUpperCase())}
                    placeholder="WA1VAAF75ND..."
                    style={{ width: '100%', padding: '0.65rem', fontFamily: 'var(--ft-font-mono)' }}
                  />
                </div>
                <div>
                  <label htmlFor="checkin-year" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>Year</label>
                  <input
                  id="checkin-year"
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
                <div>
                  <label htmlFor="checkin-make" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>Make *</label>
                  <input
                  id="checkin-make"
                    type="text"
                    required
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    placeholder="Audi"
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
                <div>
                  <label htmlFor="checkin-model" style={{ fontSize: '0.78rem', color: 'var(--ft-text-2)', display: 'block', marginBottom: '0.25rem' }}>Model *</label>
                  <input
                  id="checkin-model"
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="Q7"
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Odometer, Complaints, Notes */}
          <div className="ft-grid-odometer" style={{ marginBottom: '1rem' }}>
            <div>
              <label htmlFor="checkin-odometer-reading-mi" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ft-text-soft)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Gauge size={14} color="#36D6F5" /> Odometer Reading (mi) *
              </label>
              <input
                  id="checkin-odometer-reading-mi"
                type="number"
                required
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="42150"
                style={{ width: '100%', padding: '0.65rem' }}
              />
            </div>
            <div>
              <label htmlFor="checkin-primary-customer-complaint" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ft-text-soft)', display: 'block', marginBottom: '0.35rem' }}>
                Primary Customer Complaint *
              </label>
              <input
                  id="checkin-primary-customer-complaint"
                type="text"
                required
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Check Engine Light flashing, engine shudder at 50 mph"
                style={{ width: '100%', padding: '0.65rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="checkin-service-advisor-intake-notes" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ft-text-soft)', display: 'block', marginBottom: '0.35rem' }}>
              Service Advisor Intake Notes
            </label>
            <textarea
                  id="checkin-service-advisor-intake-notes"
              rows={2}
              value={advisorNotes}
              onChange={(e) => setAdvisorNotes(e.target.value)}
              placeholder="Loaner vehicle requested, customer prefers SMS updates, expedited..."
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!selectedCustomer && !isNewCustomer)}
              className="btn btn-primary"
              style={{ minWidth: '180px' }}
            >
              {submitting ? 'Opening Job...' : 'Open Repair Order →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
