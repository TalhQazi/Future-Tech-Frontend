import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';

export const TechniciansTab = () => {
  const { repairOrders } = useShop();
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTechs = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success && res.users) {
        const techList = res.users.filter(u => u.role === 'technician' || u.role === 'tech');
        setTechs(techList);
      }
    } catch (err) {
      console.warn('Could not load technicians:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        background: '#0d1527',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
            Diagnostic Technicians & Shop Bay Assignments
          </h2>
          <div style={{ color: '#8fa0c0', fontSize: '13px' }}>
            ASE Master certifications, assigned service lifts, and real-time labor efficiency tracking
          </div>
        </div>
        <span style={{
          background: 'rgba(0, 210, 255, 0.15)',
          color: '#00d2ff',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          {techs.length} Active Master Techs
        </span>
      </div>

      {/* Technicians Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {techs.map(tech => {
          const assignedRos = repairOrders.filter(ro => ro.assignedTechId === tech.id || ro.assignedTechName === tech.name);
          return (
            <div
              key={tech.id}
              style={{
                background: '#0a0f1d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '800' }}>
                    {tech.name}
                  </h3>
                  <div style={{ color: '#00d2ff', fontSize: '12px', marginTop: '3px' }}>
                    {tech.specialty || 'Master Diagnostic Specialist'}
                  </div>
                </div>
                <span style={{
                  background: 'rgba(74, 222, 128, 0.15)',
                  color: '#4ade80',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  ACTIVE
                </span>
              </div>

              <div style={{
                background: '#070b14',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: '#8fa0c0' }}>Labor Efficiency:</span>
                  <div style={{ color: '#4ade80', fontWeight: '800', fontSize: '14px', marginTop: '2px' }}>
                    {tech.efficiency || '96.4%'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8fa0c0' }}>Current Bay:</span>
                  <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', marginTop: '2px' }}>
                    {tech.bay || 'Bay 3 (Diagnostics)'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#8fa0c0', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                  ACTIVE REPAIR ORDERS ({assignedRos.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {assignedRos.map(ro => (
                    <div
                      key={ro.id}
                      style={{
                        background: '#070b14',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#d0d8ea'
                      }}
                    >
                      <strong style={{ color: '#00d2ff' }}>{ro.roNumber}</strong>
                      <span>{ro.vehicle ? `${ro.vehicle.make} ${ro.vehicle.model}` : ro.vehicleSummary}</span>
                      <span style={{ color: '#4ade80', fontWeight: '700' }}>{(ro.status || '').replace('_', ' ').toUpperCase()}</span>
                    </div>
                  ))}
                  {assignedRos.length === 0 && (
                    <div style={{ color: '#8fa0c0', fontSize: '12px', fontStyle: 'italic', padding: '6px 0' }}>
                      Ready for next job dispatch.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechniciansTab;
