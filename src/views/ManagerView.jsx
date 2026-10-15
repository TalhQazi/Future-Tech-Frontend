import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useShop } from '../context/ShopContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { 
  ShieldAlert, 
  Users, 
  DollarSign, 
  Wrench, 
  CheckCircle2, 
  TrendingUp, 
  Activity,
  Layers
} from 'lucide-react';

export const ManagerView = () => {
  const { repairOrders, fetchROs, showToast } = useShop();

  const [assigningRoId, setAssigningRoId] = useState(null);

  // Shop KPIs
  const activeJobs = repairOrders.filter(r => ['inspection', 'work_authorized', 'in_progress'].includes(r.status)).length;
  const readyToPay = repairOrders.filter(r => r.status === 'ready_for_payment').length;
  const completedJobs = repairOrders.filter(r => r.status === 'completed').length;

  const techs = [
    { id: 'usr_tech_1', name: 'Marcus Vance', title: 'Master Diagnostics', load: '3 Jobs Active', efficiency: '96%' },
    { id: 'usr_tech_2', name: 'Jake Ramirez', title: 'Suspension & Alignment', load: '1 Job Active', efficiency: '92%' },
    { id: 'usr_tech_3', name: 'Chloe Lin', title: 'EV & High Voltage', load: '1 Job Active', efficiency: '98%' }
  ];

  const handleAssignTech = async (roId, techId) => {
    try {
      const res = await api.assignTechnician(roId, techId);
      if (res.success) {
        showToast('Technician assigned to Repair Order', 'success');
        setAssigningRoId(null);
        fetchROs();
      }
    } catch (err) {
      showToast('Failed to assign technician', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Shop KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '1rem' }}>
        <div className="card-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-signal)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>ACTIVE JOBS IN SHOP</span>
            <Wrench size={16} color="#36D6F5" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
            {activeJobs}
          </div>
          <span className="badge badge-brand" style={{ fontSize: '0.68rem', marginTop: '0.3rem' }}>Bays 1-4 Operating</span>
        </div>

        <div className="card-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-success)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>PENDING CHECKOUT</span>
            <DollarSign size={16} color="#2ED3A0" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
            {readyToPay}
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', marginTop: '0.3rem' }}>Ready for Payment</span>
        </div>

        <div className="card-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-signal)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>COMPLETED TODAY</span>
            <CheckCircle2 size={16} color="#36D6F5" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ft-text)', marginTop: '0.35rem' }}>
            {completedJobs}
          </div>
          <span className="badge badge-cyan" style={{ fontSize: '0.68rem', marginTop: '0.3rem' }}>Turnaround &lt; 4 Hours</span>
        </div>

        <div className="card-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--ft-grad-violet)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ft-text-2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>SHOP EFFICIENCY</span>
            <TrendingUp size={16} color="#2ED3A0" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ft-success)', marginTop: '0.35rem' }}>
            94.8%
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', marginTop: '0.3rem' }}>+6.2% vs Industry Standard</span>
        </div>
      </div>

      {/* Technician Dispatch Grid */}
      <div className="card-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ft-text)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users color="#36D6F5" size={20} />
          Technician Bay Roster & Dispatch
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--ft-text-2)', marginBottom: '1.25rem' }}>
          Monitor technician workloads and reassign repair orders to balance bay throughput.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
          {techs.map(tech => (
            <div key={tech.id} style={{ background: 'var(--ft-inset)', border: '1px solid var(--ft-line-2)', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ft-text)' }}>{tech.name}</h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ft-cyan)', fontWeight: 600 }}>{tech.title}</div>
                </div>
                <span className="badge badge-brand">{tech.efficiency} Efficiency</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--ft-line)', fontSize: '0.8rem', color: 'var(--ft-text-2)' }}>
                <span>Workload: <strong style={{ color: 'var(--ft-text)' }}>{tech.load}</strong></span>
                <span style={{ color: 'var(--ft-success)', fontWeight: 600 }}>● Active in Bay</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repair Order Master Dispatch Board */}
      <div className="card-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ft-text)', marginBottom: '1.25rem' }}>
          Shop Bay Live Dispatch Board
        </h3>

        <div className="ft-table-wrap">
          <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ft-line-2)', color: 'var(--ft-text-2)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                <th style={{ padding: '0.85rem 1rem' }}>RO #</th>
                <th style={{ padding: '0.85rem 1rem' }}>Vehicle</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bay</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assigned Tech</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {repairOrders.map(ro => (
                <tr key={ro.id} style={{ borderBottom: '1px solid var(--ft-line)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--ft-cyan)' }}>{ro.roNumber}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--ft-text)', fontWeight: 600 }}>
                    {ro.vehicle?.year} {ro.vehicle?.make} {ro.vehicle?.model}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--ft-text-soft)' }}>
                    {ro.customer?.name}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-brand">{ro.bayNumber || 'Bay 1'}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--ft-text)' }}>
                    {ro.assignedTech?.name || 'Unassigned'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <StatusBadge status={ro.status} type="ro" />
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleAssignTech(ro.id, 'usr_tech_1')}
                      aria-label={`Reassign ${ro.roNumber}`}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Reassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
