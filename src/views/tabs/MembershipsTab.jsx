import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const MembershipsTab = () => {
  const { customers, showToast, refreshAll } = useShop();
  const [plans, setPlans] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedCust, setSelectedCust] = useState(customers[0]?.id || '');
  const [selectedTier, setSelectedTier] = useState('VIP Executive');
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [upgrading, setUpgrading] = useState(false);

  const fetchPlans = async () => {
    try {
      const [planRes, riderRes] = await Promise.all([
        api.getMembershipPlans(),
        api.getMembershipRiders()
      ]);
      if (planRes.success) setPlans(planRes.plans || []);
      if (riderRes.success) setRiders(riderRes.riders || []);
    } catch (err) {
      console.warn('Could not load membership plans:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleUpgrade = async (e) => {
    e.preventDefault();
    if (!selectedCust) {
      showToast('Please select a customer to upgrade.', 'error');
      return;
    }

    try {
      setUpgrading(true);
      const res = await api.upgradeMembership(selectedCust, selectedTier, selectedRiders);
      if (res.success) {
        showToast(`Customer plan upgraded to ${selectedTier}!`, 'success');
        refreshAll();
      }
    } catch (err) {
      showToast(err.message || 'Error updating membership', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const toggleRider = (riderId) => {
    if (selectedRiders.includes(riderId)) {
      setSelectedRiders(selectedRiders.filter(id => id !== riderId));
    } else {
      setSelectedRiders([...selectedRiders, riderId]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            Membership Auto Subscription Tiers & Entitlements
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Customer recurring maintenance plans, labor discounts, service riders, and roadside assistance
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '18px'
      }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            style={{
              background: '#0a0f1d',
              border: plan.tier === 'VIP Executive' ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}
          >
            {plan.tier === 'VIP Executive' && (
              <span style={{
                position: 'absolute',
                top: '-10px',
                right: '18px',
                background: '#fbbf24',
                color: '#070c16',
                padding: '2px 10px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: '900',
                textTransform: 'uppercase'
              }}>
                MOST POPULAR
              </span>
            )}

            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' }}>
                {plan.name || plan.tier}
              </h3>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#00d2ff', marginTop: '6px' }}>
                ${plan.monthlyPrice?.toFixed(2) || '49.00'}<span style={{ fontSize: '13px', color: '#8fa0c0' }}>/mo</span>
              </div>
            </div>

            <div style={{ color: '#d0d8ea', fontSize: '12px', lineHeight: 1.6 }}>
              {plan.description}
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#8fa0c0', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                INCLUDED ENTITLEMENTS:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#fff', lineHeight: 1.8 }}>
                <li><strong>{plan.laborDiscountPercent || 15}% Off</strong> All Shop Labor</li>
                <li><strong>$0 Diagnostic Fee</strong> (Unlimited scans)</li>
                <li><strong>Included DVI Inspections</strong> with photo evidence</li>
                <li><strong>Priority Bay Scheduling</strong></li>
                {plan.roadsideAssistance && <li><strong>24/7 Roadside Assistance</strong> Included</li>}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Service Riders & Customer Upgrade Card */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#fff', fontWeight: '800' }}>
          Customer Plan Upgrades & Add-on Service Riders
        </h3>

        <form onSubmit={handleUpgrade} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
              SELECT CUSTOMER *
            </label>
            <select
              value={selectedCust}
              onChange={(e) => setSelectedCust(e.target.value)}
              style={{
                width: '100%',
                background: '#070b14',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '14px'
              }}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.membershipTier || 'Standard'})
                </option>
              ))}
            </select>

            <label style={{ display: 'block', color: '#8fa0c0', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
              TARGET MEMBERSHIP TIER *
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              style={{
                width: '100%',
                background: '#070b14',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                color: '#00d2ff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                outline: 'none'
              }}
            >
              {plans.map(p => (
                <option key={p.id} value={p.tier}>
                  {p.name || p.tier} (${p.monthlyPrice}/mo)
                </option>
              ))}
            </select>

            <div style={{ marginTop: '20px' }}>
              <button
                type="submit"
                disabled={upgrading}
                style={{
                  background: 'linear-gradient(135deg, #0070f3, #00d2ff)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: upgrading ? 'not-allowed' : 'pointer'
                }}
              >
                {upgrading ? 'Upgrading...' : 'Apply Tier & Entitlement Upgrade'}
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#8fa0c0', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
              OPTIONAL ADD-ON SERVICE RIDERS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {riders.map(r => {
                const isSelected = selectedRiders.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleRider(r.id)}
                    style={{
                      background: isSelected ? 'rgba(0, 112, 243, 0.15)' : '#070b14',
                      border: isSelected ? '1px solid #0070f3' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                        {isSelected ? '✓ ' : '+ '} {r.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8fa0c0' }}>
                        {r.description}
                      </div>
                    </div>
                    <span style={{ color: '#00d2ff', fontWeight: '800', fontSize: '13px' }}>
                      +${r.monthlyPrice}/mo
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MembershipsTab;
