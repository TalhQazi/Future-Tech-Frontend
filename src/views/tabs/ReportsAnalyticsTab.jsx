import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { 
  BarChart3, 
  DollarSign, 
  Car, 
  CheckCircle2, 
  TrendingUp, 
  Wrench, 
  Star, 
  ShieldAlert,
  ArrowUpRight,
  Download,
  Filter
} from 'lucide-react';

export const ReportsAnalyticsTab = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsDashboard();
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.warn('Analytics fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpis = analytics?.kpis || {
    activeVehiclesInShop: 0,
    rosCompletedToday: 0,
    todayRevenue: 0,
    totalRevenueMonth: 0,
    avgCustomerRating: null,
    overallComebackRate: '0.0%',
    shopLaborEfficiency: '100%'
  };

  const profitPerVin = analytics?.profitPerVin || [];
  const bayEfficiency = analytics?.bayEfficiency || [];

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
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
            Executive Shop Intelligence & Profit-per-VIN Analytics
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            Live financial yield, technician labor productivity, bay utilization, and vehicle lifetime margin
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            style={{
              background: '#070b14',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '12px'
            }}
          >
            <option value="today">Today's Shift</option>
            <option value="week">Trailing 7 Days</option>
            <option value="month">Current Month (MTD)</option>
            <option value="quarter">Quarterly Rollup</option>
          </select>

          <button
            onClick={() => window.print()}
            style={{
              background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>Export Financial Ledger</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        {[
          { label: "Today's Revenue", value: `$${(kpis.todayRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: '#00e676', sub: 'Settled repair orders' },
          { label: "MTD Gross Revenue", value: `$${(kpis.totalRevenueMonth || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: '#00d2ff', sub: 'Cumulative closed billings' },
          { label: 'Vehicles in Bay', value: kpis.activeVehiclesInShop ?? 0, icon: Car, color: '#ffb300', sub: 'Active repair orders' },
          { label: 'ROs Completed Today', value: kpis.rosCompletedToday ?? 0, icon: CheckCircle2, color: '#a855f7', sub: 'Final quality control passed' },
          { label: 'Labor Efficiency', value: kpis.shopLaborEfficiency || '100%', icon: Wrench, color: '#00e676', sub: 'Billed vs clocked hours' },
          { label: 'Comeback / Warranty', value: kpis.overallComebackRate || '0.0%', icon: ShieldAlert, color: '#4ade80', sub: 'Industry standard < 3.0%' },
          { label: 'Customer CSAT', value: kpis.avgCustomerRating ? `${kpis.avgCustomerRating} / 5.0` : '—', icon: Star, color: '#ffb300', sub: 'Verified customer ratings' }
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              style={{
                background: '#0a0f1d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#8fa0c0', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>{k.label}</span>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={14} color={k.color} />
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>
                {k.value}
              </div>
              <div style={{ color: '#64748b', fontSize: '11px' }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Service Bay Utilization & Efficiency */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
              Service Lift & Bay Utilization Radar
            </h3>
            <div style={{ color: '#8fa0c0', fontSize: '12px', marginTop: '2px' }}>
              Hourly occupancy rates, cycle time, and diagnostic throughput per physical bay
            </div>
          </div>
          <span style={{ color: '#00d2ff', fontSize: '12px', fontWeight: '700' }}>
            {bayEfficiency.length > 0 ? 'Active Fleet Throughput' : 'Bays In Standby (0% Occupancy)'}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: bayEfficiency.length > 0 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
          gap: '14px'
        }}>
          {bayEfficiency.length === 0 ? (
            <div style={{
              background: '#070b14',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '28px',
              textAlign: 'center',
              color: '#8fa0c0',
              fontSize: '13px'
            }}>
              Service bays in standby · Real-time bay occupancy metrics stream dynamically as vehicles enter active repair dispatch.
            </div>
          ) : (
            bayEfficiency.map((bay, idx) => {
              const utilNum = parseInt(bay.utilization) || 80;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>{bay.bay}</span>
                    <span style={{
                      color: utilNum >= 85 ? '#00e676' : '#00d2ff',
                      fontSize: '12px',
                      fontWeight: '800',
                      fontFamily: 'monospace'
                    }}>
                      {bay.utilization}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${utilNum}%`,
                      height: '100%',
                      background: utilNum >= 90 ? 'linear-gradient(90deg, #00d2ff, #00e676)' : '#00d2ff',
                      borderRadius: '3px'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8fa0c0' }}>
                    <span>Efficiency Index: <strong style={{ color: '#fff' }}>{bay.efficiencyScore}/100</strong></span>
                    <span style={{ color: '#00e676' }}>Optimal Throughput</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Row 3: Profit-per-VIN Ledger */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
              Profit-per-VIN Lifetime Accounting Ledger
            </h3>
            <div style={{ color: '#8fa0c0', fontSize: '12px', marginTop: '2px' }}>
              Individual vehicle lifetime revenue, parts/labor gross margin, and health score correlation
            </div>
          </div>
          <span style={{
            background: 'rgba(0, 210, 255, 0.15)',
            color: '#00d2ff',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            {profitPerVin.length} Fleet & Retail VINs Tracked
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#8fa0c0' }}>
                <th style={{ padding: '10px 12px' }}>Vehicle / Model</th>
                <th style={{ padding: '10px 12px' }}>VIN Number</th>
                <th style={{ padding: '10px 12px' }}>Plate</th>
                <th style={{ padding: '10px 12px' }}>Visits</th>
                <th style={{ padding: '10px 12px' }}>Lifetime Revenue</th>
                <th style={{ padding: '10px 12px' }}>Gross Profit</th>
                <th style={{ padding: '10px 12px' }}>Margin %</th>
                <th style={{ padding: '10px 12px' }}>Health Score</th>
              </tr>
            </thead>
            <tbody>
              {profitPerVin.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No vehicle service records or revenue ledger entries recorded yet.
                  </td>
                </tr>
              ) : (
                profitPerVin.map((row) => (
                  <tr
                    key={row.vehicleId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      color: '#cbd5e1'
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: '700', color: '#fff' }}>
                      {row.vehicle}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#00d2ff', fontSize: '12px' }}>
                      {row.vin}
                    </td>
                    <td style={{ padding: '12px', color: '#8fa0c0' }}>
                      {row.licensePlate}
                    </td>
                    <td style={{ padding: '12px', color: '#fff', fontWeight: '700' }}>
                      {row.visitCount}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#00e676', fontWeight: '700' }}>
                      ${row.totalRevenue?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#fff', fontWeight: '700' }}>
                      ${row.grossProfit?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: 'rgba(0, 230, 118, 0.15)',
                        color: '#00e676',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {row.marginPercent}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        color: row.healthScore >= 80 ? '#00e676' : '#ffb300',
                        fontWeight: '800'
                      }}>
                        {row.healthScore}/100
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalyticsTab;
