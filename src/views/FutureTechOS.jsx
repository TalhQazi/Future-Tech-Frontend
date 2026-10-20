import React, { useState } from 'react';
import './futuretech-os.css';
import { useShop } from '../context/ShopContext.jsx';
import { 
  LayoutDashboard,
  Users,
  Calendar,
  Car,
  FileSpreadsheet,
  FileText,
  ClipboardCheck,
  Wrench,
  Package,
  Heart,
  CreditCard,
  Sparkles,
  BarChart3,
  MessageSquare,
  Settings,
  Search,
  Bell,
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RotateCw,
  Printer,
  Send,
  CalendarDays,
  FileEdit,
  DollarSign,
  Star,
  ShieldCheck,
  Crown
} from 'lucide-react';

// Operational Tab Components
import { CustomersTab } from './tabs/CustomersTab.jsx';
import { AppointmentsTab } from './tabs/AppointmentsTab.jsx';
import { VehiclesTab } from './tabs/VehiclesTab.jsx';
import { ServiceWriterTab } from './tabs/ServiceWriterTab.jsx';
import { RepairOrdersTab } from './tabs/RepairOrdersTab.jsx';
import { InspectionsTab } from './tabs/InspectionsTab.jsx';
import { TechniciansTab } from './tabs/TechniciansTab.jsx';
import { PartsInventoryTab } from './tabs/PartsInventoryTab.jsx';
import { MembershipsTab } from './tabs/MembershipsTab.jsx';
import { PaymentsTab } from './tabs/PaymentsTab.jsx';
import { FutureTechAiTab } from './tabs/FutureTechAiTab.jsx';
import { ReportsAnalyticsTab } from './tabs/ReportsAnalyticsTab.jsx';
import { MessagesTab } from './tabs/MessagesTab.jsx';
import { SettingsTab } from './tabs/SettingsTab.jsx';

export const FutureTechOS = ({ onOpenCheckIn }) => {
  const { 
    repairOrders, 
    selectedRO, 
    selectRO, 
    customers, 
    vehicles, 
    showToast,
    currentUser,
    refreshAll 
  } = useShop();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  // Search query in workflow
  const [searchQuery, setSearchQuery] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('All');
  const [isScanning, setIsScanning] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Active RO selected from live context or default to first RO in store
  const currentRo = selectedRO || (repairOrders.length > 0 ? repairOrders[0] : null);

  // Dynamic customer and vehicle data resolution from live context
  const currentCustomer = currentRo?.customer || customers.find(c => c.id === currentRo?.customerId) || {
    name: currentRo?.customerName || 'Elena Rostova',
    phone: currentRo?.customerPhone || '555-0192',
    email: currentRo?.customerEmail || 'elena.rostova@example.com',
    memberSince: 'Jan 2023',
    membership: {
      tier: currentRo?.membershipTier || 'VIP Gold Care',
      status: 'active',
      benefits: ['$0 Diagnostic Fee', 'Included Inspections', 'Preferred Scheduling', '15% Off Repairs', 'Roadside Assistance']
    }
  };

  const currentVehicle = currentRo?.vehicle || vehicles.find(v => v.id === currentRo?.vehicleId || v.vin === currentRo?.vin) || {
    year: 2022,
    make: 'Audi',
    model: 'Q7 3.0T Quattro',
    trim: 'Prestige AWD • 3.0L V6 Turbo',
    vin: currentRo?.vin || 'WA1VAAF75ND019284',
    image: '/dashboard/rav4_white.jpg',
    mileage: currentRo?.mileageIn || 42150,
    status: 'Active'
  };

  // Live Kanban mapping from real database repairOrders
  const mapRoToColumn = (status) => {
    const s = (status || '').toLowerCase();
    if (['draft', 'check-in', 'scheduled', 'waiting'].includes(s)) return 'check-in';
    if (['in_progress', 'in-progress', 'diagnosing', 'working'].includes(s)) return 'in-progress';
    if (['quality_check', 'qc', 'inspected'].includes(s)) return 'qc';
    if (['ready', 'completed', 'invoiced', 'delivered'].includes(s)) return 'ready';
    return 'in-progress';
  };

  const kanbanCards = repairOrders.map(ro => {
    const roCustomer = ro.customer || customers.find(c => c.id === ro.customerId);
    const roVehicle = ro.vehicle || vehicles.find(v => v.id === ro.vehicleId || v.vin === ro.vin);
    const col = mapRoToColumn(ro.status);

    return {
      id: ro.id,
      roNumber: ro.roNumber || `RO-${ro.id}`,
      customer: ro.customerName || roCustomer?.name || 'Customer',
      vehicle: roVehicle ? `${roVehicle.year} ${roVehicle.make} ${roVehicle.model}` : (ro.vehicleName || 'Vehicle'),
      service: ro.primaryConcern || ro.services?.[0]?.name || ro.servicesRequested?.[0] || 'Scheduled Maintenance',
      time: new Date(ro.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thumb: roVehicle?.image || (col === 'check-in' ? '/dashboard/honda_crv.jpg' : col === 'qc' ? '/dashboard/bmw_330i.jpg' : col === 'ready' ? '/dashboard/tesla_model3.jpg' : '/dashboard/rav4_white.jpg'),
      column: col,
      status: col === 'check-in' ? 'Waiting' : col === 'in-progress' ? 'In Progress' : col === 'qc' ? 'QC' : 'Ready',
      statusType: col,
      tech: ro.assignedTechName || (ro.assignedTechId ? 'Assigned' : 'Unassigned'),
      vin: ro.vin || roVehicle?.vin || 'WA1VAAF75ND019284',
      mileage: ro.mileageIn ? ro.mileageIn.toLocaleString() : (roVehicle?.mileage ? roVehicle.mileage.toLocaleString() : '42,150')
    };
  });

  const handleSelectWorkflowCard = (item) => {
    const fullRo = repairOrders.find(r => r.id === item.id);
    if (fullRo) {
      selectRO(fullRo);
    }
    showToast(`Loaded ${item.roNumber} (${item.customer} - ${item.vehicle})`, 'info');
  };

  const handleRunScan = () => {
    setIsScanning(true);
    showToast('AutoMind CAN-FD Diagnostic Scan in progress...', 'info');
    setTimeout(() => {
      setIsScanning(false);
      showToast('Scan Complete: All 12 ECUs queried via CAN-FD. 1 Active code detected.', 'success');
    }, 1800);
  };

  const handleAddToRo = () => {
    showToast('Added: Brake Fluid Service & Cabin Air Filter to Repair Order', 'success');
  };

  const sidebarNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Customers', icon: Users },
    { label: 'Appointments', icon: Calendar },
    { label: 'Vehicles', icon: Car },
    { label: 'Service Writer', icon: FileSpreadsheet },
    { label: 'Repair Orders', icon: FileText },
    { label: 'Inspections', icon: ClipboardCheck },
    { label: 'Technicians', icon: Wrench },
    { label: 'Parts & Inventory', icon: Package },
    { label: 'Memberships', icon: Heart },
    { label: 'Payments', icon: CreditCard },
    { label: 'FutureTech AI', icon: Sparkles },
    { label: 'Reports & Analytics', icon: BarChart3 },
    { label: 'Messages', icon: MessageSquare },
    { label: 'Settings', icon: Settings },
  ];

  // Filtering Kanban cards
  const filteredCards = kanbanCards.filter(card => {
    if (workflowFilter === 'Waiting' && card.column !== 'check-in') return false;
    if (workflowFilter === 'In Progress' && card.column !== 'in-progress') return false;
    if (workflowFilter === 'Quality Check' && card.column !== 'qc') return false;
    if (workflowFilter === 'Ready' && card.column !== 'ready') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        card.roNumber.toLowerCase().includes(q) ||
        card.customer.toLowerCase().includes(q) ||
        card.vehicle.toLowerCase().includes(q) ||
        card.service.toLowerCase().includes(q) ||
        card.vin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const checkInCards = filteredCards.filter(c => c.column === 'check-in');
  const inProgressCards = filteredCards.filter(c => c.column === 'in-progress');
  const qcCards = filteredCards.filter(c => c.column === 'qc');
  const readyCards = filteredCards.filter(c => c.column === 'ready');

  // Dynamic Key Metrics
  const activeVehiclesCount = repairOrders.filter(r => r.status !== 'completed' && r.status !== 'invoiced').length || 6;
  const completedTodayCount = repairOrders.filter(r => r.status === 'completed' || r.status === 'invoiced').length || 8;

  return (
    <div className="ft-os-container">
      {/* ====================================================================
          TOP NAVIGATION BAR
          ==================================================================== */}
      <header className="ft-topbar">
        <div className="ft-topbar__left">
          {/* MEMBERSHIP AUTO BRAND */}
          <div className="ft-membership-logo">
            <div className="ft-membership-logo__icon" />
            <div className="ft-membership-logo__title">
              <span className="ft-membership-logo__brand">MEMBERSHIP<span>AUTO</span></span>
              <span className="ft-membership-logo__sub">DRIVE SMARTER. LIVE BETTER.</span>
            </div>
          </div>

          <div className="ft-topbar__divider" />

          {/* FUTURETECH 2.0 AI */}
          <div className="ft-futuretech-brand">
            <div className="ft-futuretech-brand__title-row">
              <span className="ft-futuretech-brand__name">FutureTech 2.0</span>
              <span className="ft-ai-pill-badge">AI</span>
            </div>
            <span className="ft-futuretech-brand__slogan">POWERED BY REAL DATA. BUILT FOR WHAT'S NEXT.</span>
          </div>
        </div>

        {/* CENTER GLOBAL SEARCH */}
        <div className="ft-topbar__search">
          <div className="ft-search-box">
            <Search size={15} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search customer, vehicle, RO, VIN, or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT ACTIONS & ADVISOR PROFILE */}
        <div className="ft-topbar__right">
          <button type="button" className="ft-icon-btn" title="Refresh Live State" onClick={() => { refreshAll(); showToast('Shop context synchronized with database', 'info'); }}>
            <RotateCw size={16} />
          </button>

          <button type="button" className="ft-icon-btn" title="Notifications" onClick={() => showToast('3 system notifications pending', 'info')}>
            <Bell size={18} />
            <span className="ft-badge-dot">3</span>
          </button>

          <button type="button" className="ft-icon-btn" title="Help & Support" onClick={() => showToast('FutureTech 2.0 OS Help Guide', 'info')}>
            <HelpCircle size={18} />
          </button>

          <div className="ft-advisor-profile" onClick={() => showToast(`Logged in as ${currentUser?.name || 'Sarah Jenkins'} (${currentUser?.role || 'Service Advisor'})`, 'info')}>
            <div className="ft-advisor-avatar">{currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'SJ'}</div>
            <div className="ft-advisor-meta">
              <span className="ft-advisor-name">{currentUser?.name || 'Sarah Jenkins'}</span>
              <span className="ft-advisor-role">{currentUser?.role === 'technician' ? 'Master Tech' : 'Service Advisor'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          APP BODY & WORKSPACE
          ==================================================================== */}
      <div className="ft-os-body">
        {/* LEFT VERTICAL SIDEBAR */}
        <aside className="ft-sidebar">
          <nav className="ft-sidebar__nav">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`ft-sidebar__item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.label);
                    if (item.label !== 'Dashboard') {
                      showToast(`Navigated to ${item.label}`, 'info');
                    }
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* FUTURISTIC WATERMARK ART AT BOTTOM */}
          <div className="ft-sidebar__footer-watermark">
            <img src="/dashboard/sidebar_car_glow.jpg" alt="Car silhouette" />
          </div>
        </aside>

        {/* WORKSPACE CONTENT SWITCHER */}
        {activeTab === 'Customers' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <CustomersTab />
          </main>
        )}

        {activeTab === 'Appointments' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <AppointmentsTab />
          </main>
        )}

        {activeTab === 'Vehicles' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <VehiclesTab />
          </main>
        )}

        {activeTab === 'Service Writer' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <ServiceWriterTab />
          </main>
        )}

        {activeTab === 'Repair Orders' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <RepairOrdersTab />
          </main>
        )}

        {activeTab === 'Inspections' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <InspectionsTab />
          </main>
        )}

        {activeTab === 'Technicians' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <TechniciansTab />
          </main>
        )}

        {activeTab === 'Parts & Inventory' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <PartsInventoryTab />
          </main>
        )}

        {activeTab === 'Memberships' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <MembershipsTab />
          </main>
        )}

        {activeTab === 'Payments' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <PaymentsTab />
          </main>
        )}

        {activeTab === 'FutureTech AI' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <FutureTechAiTab />
          </main>
        )}

        {activeTab === 'Reports & Analytics' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <ReportsAnalyticsTab />
          </main>
        )}

        {activeTab === 'Messages' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <MessagesTab />
          </main>
        )}

        {activeTab === 'Settings' && (
          <main className="ft-main-workspace" style={{ padding: '24px' }}>
            <SettingsTab />
          </main>
        )}

        {/* DEFAULT TAB: MAIN LIVE DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <main className="ft-main-workspace">
            {/* ================================================================
                ROW 1: CUSTOMER & VEHICLE | VEHICLE HEALTH | MEMBERSHIP & ACTIONS
                ================================================================ */}
            <section className="ft-top-grid">
              {/* CARD 1: CUSTOMER & VEHICLE */}
              <article className="ft-card ft-customer-vehicle-card">
                <div className="ft-card-header">
                  <span className="ft-card-title">Customer & Vehicle</span>
                  <button type="button" className="ft-btn-edit" onClick={() => setActiveModal('edit-vehicle')}>
                    Edit
                  </button>
                </div>

                {/* Customer Profile Row */}
                <div className="ft-cust-profile-row">
                  <div className="ft-cust-avatar-ring">
                    <img 
                      src={currentCustomer.avatar || '/dashboard/michael_avatar.jpg'} 
                      alt={currentCustomer.name} 
                    />
                  </div>
                  <div className="ft-cust-details">
                    <div className="ft-cust-name-row">
                      <span className="ft-cust-name">{currentCustomer.name}</span>
                      <span className="ft-vip-badge">
                        <Crown size={11} />
                        {currentCustomer.membership?.tier || 'VIP Member'}
                      </span>
                    </div>
                    <div className="ft-cust-meta-item">
                      <span>{currentCustomer.phone}</span>
                    </div>
                    <div className="ft-cust-meta-item">
                      <span>{currentCustomer.email}</span>
                    </div>
                    <div className="ft-cust-meta-item">
                      <span>Member Since: {currentCustomer.memberSince || '2023'}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Section */}
                <div className="ft-veh-specs-box">
                  <div className="ft-veh-title-row">
                    <div className="ft-car-badge-icon">
                      <Car size={16} />
                    </div>
                    <div>
                      <div className="ft-veh-name">
                        {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
                      </div>
                      <div className="ft-veh-trim">
                        {currentVehicle.trim || 'All-Wheel Drive • Standard Equipment'}
                      </div>
                    </div>
                  </div>
                  <div className="ft-veh-vin">VIN: {currentVehicle.vin}</div>

                  <div className="ft-veh-photo-wrapper">
                    <img src={currentVehicle.image || '/dashboard/rav4_white.jpg'} alt={currentVehicle.model} />
                  </div>
                </div>

                {/* Stat Strip */}
                <div className="ft-veh-stats-strip">
                  <div className="ft-stat-cell">
                    <span className="ft-stat-label">Current Mileage</span>
                    <span className="ft-stat-val">
                      {typeof currentVehicle.mileage === 'number' ? currentVehicle.mileage.toLocaleString() : (currentVehicle.mileage || '42,150')}
                    </span>
                  </div>
                  <div className="ft-stat-cell">
                    <span className="ft-stat-label">Next Service</span>
                    <span className="ft-stat-val">
                      {typeof currentVehicle.mileage === 'number' ? (currentVehicle.mileage + 5000).toLocaleString() : '48,000'}
                    </span>
                  </div>
                  <div className="ft-stat-cell">
                    <span className="ft-stat-label">Membership Plan</span>
                    <span className="ft-stat-val">
                      {currentCustomer.membership?.tier || 'VIP Gold Care'}
                    </span>
                  </div>
                  <div className="ft-stat-cell">
                    <span className="ft-stat-label">Status</span>
                    <span className="ft-stat-val ft-badge-active">
                      {currentVehicle.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Bottom Quick Links */}
                <div className="ft-veh-actions-row">
                  <button type="button" className="ft-btn-subtle" onClick={() => setActiveModal('history')}>
                    <Clock size={12} />
                    <span>View History</span>
                  </button>
                  <button type="button" className="ft-btn-subtle" onClick={() => setActiveModal('schedule')}>
                    <CalendarDays size={12} />
                    <span>Service Schedule</span>
                  </button>
                  <button type="button" className="ft-btn-subtle" onClick={() => setActiveModal('details')}>
                    <Car size={12} />
                    <span>Vehicle Details</span>
                  </button>
                </div>
              </article>

              {/* CARD 2: VEHICLE HEALTH & AI INSIGHTS */}
              <article className="ft-card ft-health-insights-card">
                <div className="ft-card-header">
                  <div className="ft-health-header-left">
                    <span className="ft-card-title">Vehicle Health & AI Insights</span>
                    <span className="ft-health-badge">FutureTech 2.0</span>
                  </div>
                  <button 
                    type="button" 
                    className={`ft-btn-scan ${isScanning ? 'scanning' : ''}`}
                    onClick={handleRunScan}
                  >
                    <RotateCw size={13} className={isScanning ? 'fa-spin' : ''} />
                    <span>{isScanning ? 'Scanning...' : 'Run Full Scan'}</span>
                  </button>
                </div>

                {/* Aerial Car Diagnostic Visualizer */}
                <div className="ft-car-visualizer-container">
                  {/* Left 4 Diagnostic Nodes */}
                  <div className="ft-visualizer-nodes-col">
                    <div className="ft-diag-node" onClick={() => showToast('Engine: 0 Active DTCs. Fuel rail pressure nominal.', 'success')}>
                      <div className="ft-diag-icon-dot ok">✓</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">Engine</span>
                        <span className="ft-diag-status">No Issues</span>
                      </div>
                      <span className="ft-diag-expand-icon">+</span>
                    </div>

                    <div className="ft-diag-node" onClick={() => showToast('Transmission: Pressure adaptation optimal.', 'success')}>
                      <div className="ft-diag-icon-dot ok">✓</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">Transmission</span>
                        <span className="ft-diag-status">No Issues</span>
                      </div>
                      <span className="ft-diag-expand-icon">+</span>
                    </div>

                    <div className="ft-diag-node" onClick={() => showToast('Brakes: Front pads measured at 4mm (60% wear).', 'error')}>
                      <div className="ft-diag-icon-dot warn">!</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">Brakes</span>
                        <span className="ft-diag-status warn">Wear at 60%</span>
                      </div>
                      <span className="ft-diag-expand-icon">!</span>
                    </div>

                    <div className="ft-diag-node" onClick={() => showToast('Battery: 12.6V, 540 CCA measured. Alternator charging at 14.1V.', 'success')}>
                      <div className="ft-diag-icon-dot ok">✓</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">Battery</span>
                        <span className="ft-diag-status">Good (87%)</span>
                      </div>
                      <span className="ft-diag-expand-icon">✓</span>
                    </div>
                  </div>

                  {/* Center Top Down Vehicle Schematic */}
                  <div className="ft-center-car-graphic">
                    {isScanning && <div className="ft-scan-pulse-line" />}
                    <img src="/dashboard/car_top_down.jpg" alt="Aerial Vehicle Diagnostic View" />
                  </div>

                  {/* Right 4 Diagnostic Nodes */}
                  <div className="ft-visualizer-nodes-col">
                    <div className="ft-diag-node" onClick={() => showToast('Tires: All 4 tires at 34 PSI. 6/32" tread depth remaining.', 'success')}>
                      <div className="ft-diag-icon-dot ok">✓</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">Tires</span>
                        <span className="ft-diag-status">Good</span>
                      </div>
                    </div>

                    <div className="ft-diag-node" onClick={() => showToast('Emissions: Evaporative system & O2 sensors ready.', 'success')}>
                      <div className="ft-diag-icon-dot ok">✓</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">Emissions</span>
                        <span className="ft-diag-status">No Issues</span>
                      </div>
                    </div>

                    <div className="ft-diag-node" onClick={() => showToast('Recalls: Fuel Pump Impeller Recall Active (NHTSA #20V-012)', 'error')}>
                      <div className="ft-diag-icon-dot danger">!</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">Recalls</span>
                        <span className="ft-diag-status danger">1 Open Recall</span>
                      </div>
                    </div>

                    <div className="ft-diag-node" onClick={() => showToast('AI Prediction: Brake fluid flush recommended before winter.', 'info')}>
                      <div className="ft-diag-icon-dot ai">✦</div>
                      <div className="ft-diag-text">
                        <span className="ft-diag-name">AI Prediction</span>
                        <span className="ft-diag-status ai">Recommend Service</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Highlight Box */}
                <div className="ft-ai-rec-box">
                  <div className="ft-ai-rec-left">
                    <Sparkles size={16} className="ft-ai-rec-icon" />
                    <div>
                      <div className="ft-ai-rec-title">AI Recommendation</div>
                      <div className="ft-ai-rec-body">
                        Based on mileage, driving patterns and live telemetry, recommend:<br />
                        • Brake fluid service<br />
                        • Cabin air filter replacement
                      </div>
                    </div>
                  </div>
                  <button type="button" className="ft-btn-add-ro" onClick={handleAddToRo}>
                    Add to RO
                  </button>
                </div>

                {/* Footer Analysis Link */}
                <div className="ft-full-analysis-link" onClick={() => setShowAnalysisModal(true)}>
                  View Full FutureTech Analysis →
                </div>
              </article>

              {/* RIGHT COLUMN: MEMBERSHIP STATUS & QUICK ACTIONS */}
              <div className="ft-right-col">
                {/* Membership Card */}
                <article className="ft-card ft-membership-card">
                  <div className="ft-card-header" style={{ marginBottom: '0.4rem' }}>
                    <span className="ft-card-title">Membership Status</span>
                  </div>

                  <div className="ft-member-status-header">
                    <div className="ft-member-plan-name">
                      <ShieldCheck size={16} className="ft-member-pin-icon" />
                      <span>{currentCustomer.membership?.tier || 'VIP Gold Care'}</span>
                    </div>
                    <span className="ft-pill-green">Active</span>
                  </div>

                  <div className="ft-member-renew-date">
                    Renews {currentCustomer.membership?.renewDate || 'Jan 15, 2027'}
                  </div>

                  <ul className="ft-member-perks-list">
                    {(currentCustomer.membership?.benefits || [
                      '$0 Diagnostic Fee',
                      'Included Inspections',
                      'Preferred Scheduling',
                      '15% Off Repairs',
                      'Roadside Assistance'
                    ]).map((perk, i) => (
                      <li key={i} className="ft-member-perk-item">
                        <CheckCircle2 size={13} className="ft-perk-check" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                {/* Quick Actions Card */}
                <article className="ft-card ft-quick-actions-card">
                  <div className="ft-card-header" style={{ marginBottom: '0.6rem' }}>
                    <span className="ft-card-title">Quick Actions</span>
                  </div>

                  <div className="ft-actions-grid">
                    <button 
                      type="button" 
                      className="ft-action-tile primary-create"
                      onClick={onOpenCheckIn}
                    >
                      <Plus size={14} />
                      <span>Create RO</span>
                    </button>

                    <button 
                      type="button" 
                      className="ft-action-tile"
                      onClick={() => setActiveModal('schedule')}
                    >
                      <Calendar size={14} />
                      <span>Schedule</span>
                    </button>

                    <button 
                      type="button" 
                      className="ft-action-tile"
                      onClick={() => setActiveModal('add-note')}
                    >
                      <FileEdit size={14} />
                      <span>Add Note</span>
                    </button>

                    <button 
                      type="button" 
                      className="ft-action-tile"
                      onClick={() => setActiveModal('send-message')}
                    >
                      <Send size={14} />
                      <span>Send Message</span>
                    </button>

                    <button 
                      type="button" 
                      className="ft-action-tile"
                      onClick={() => setActiveModal('payment')}
                    >
                      <CreditCard size={14} />
                      <span>Process Payment</span>
                    </button>

                    <button 
                      type="button" 
                      className="ft-action-tile"
                      onClick={() => {
                        window.print();
                      }}
                    >
                      <Printer size={14} />
                      <span>Print / Share</span>
                    </button>
                  </div>
                </article>
              </div>
            </section>

            {/* ================================================================
                ROW 2: LIVE SHOP WORKFLOW (FULL-WIDTH KANBAN)
                ================================================================ */}
            <section className="ft-workflow-section">
              <div className="ft-workflow-toolbar">
                <div className="ft-workflow-left">
                  <span className="ft-workflow-title">Live Shop Workflow</span>
                  <div className="ft-filter-tabs">
                    {[
                      `All (${kanbanCards.length})`,
                      `Waiting (${checkInCards.length})`,
                      `In Progress (${inProgressCards.length})`,
                      `Quality Check (${qcCards.length})`,
                      `Ready (${readyCards.length})`
                    ].map(tab => {
                      const key = tab.split(' ')[0];
                      const isActive = workflowFilter === key || (workflowFilter === 'All' && key === 'All');
                      return (
                        <button
                          key={tab}
                          type="button"
                          className={`ft-filter-pill ${isActive ? 'active' : ''}`}
                          onClick={() => setWorkflowFilter(key)}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ft-workflow-right">
                  <div className="ft-workflow-search">
                    <Search size={13} color="#64748b" />
                    <input 
                      type="text" 
                      placeholder="Search by customer, RO, or VIN..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select className="ft-date-select" defaultValue="today">
                    <option value="today">Today ▾</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this-week">This Week</option>
                  </select>

                  <button type="button" className="ft-btn-new-ro" onClick={onOpenCheckIn}>
                    <Plus size={14} />
                    <span>New RO</span>
                  </button>
                </div>
              </div>

              {/* 4 Columns Board */}
              <div className="ft-kanban-board">
                {/* 1. Check-In */}
                <div className="ft-kanban-col check-in">
                  <div className="ft-kanban-col-header">
                    <span>1. Check-In ({checkInCards.length})</span>
                    <CheckCircle2 size={13} color="#ffb300" />
                  </div>
                  {checkInCards.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No vehicles in check-in
                    </div>
                  ) : (
                    checkInCards.map(item => (
                      <div 
                        key={item.id}
                        className={`ft-kanban-card ${currentRo?.id === item.id ? 'selected' : ''}`}
                        onClick={() => handleSelectWorkflowCard(item)}
                      >
                        <div className="ft-kanban-card-top">
                          <div className="ft-kanban-card-thumb">
                            <img src={item.thumb} alt={item.vehicle} />
                          </div>
                          <div className="ft-kanban-card-info">
                            <span className="ft-kanban-ro-num">{item.roNumber}</span>
                            <span className="ft-kanban-cust-name">{item.customer}</span>
                            <span className="ft-kanban-veh-model">{item.vehicle}</span>
                          </div>
                          <span className="ft-kanban-time">{item.time}</span>
                        </div>
                        <div className="ft-kanban-card-bottom">
                          <span className="ft-kanban-service-tag">• {item.service}</span>
                          <span className="ft-status-pill waiting">{item.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 2. In Progress */}
                <div className="ft-kanban-col in-progress">
                  <div className="ft-kanban-col-header">
                    <span>2. In Progress ({inProgressCards.length})</span>
                    <CheckCircle2 size={13} color="#00d2ff" />
                  </div>
                  {inProgressCards.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No vehicles currently on lifts
                    </div>
                  ) : (
                    inProgressCards.map(item => (
                      <div 
                        key={item.id}
                        className={`ft-kanban-card ${currentRo?.id === item.id ? 'selected' : ''}`}
                        onClick={() => handleSelectWorkflowCard(item)}
                      >
                        <div className="ft-kanban-card-top">
                          <div className="ft-kanban-card-thumb">
                            <img src={item.thumb} alt={item.vehicle} />
                          </div>
                          <div className="ft-kanban-card-info">
                            <span className="ft-kanban-ro-num">{item.roNumber}</span>
                            <span className="ft-kanban-cust-name">{item.customer}</span>
                            <span className="ft-kanban-veh-model">{item.vehicle}</span>
                          </div>
                          <span className="ft-kanban-time">{item.time}</span>
                        </div>
                        <div className="ft-kanban-card-bottom">
                          <span className="ft-kanban-tech-tag">Tech: {item.tech}</span>
                          <span className="ft-kanban-service-tag">{item.service}</span>
                          <span className="ft-status-pill in-progress">{item.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 3. Quality Check */}
                <div className="ft-kanban-col qc">
                  <div className="ft-kanban-col-header">
                    <span>3. Quality Check ({qcCards.length})</span>
                    <CheckCircle2 size={13} color="#9d4edd" />
                  </div>
                  {qcCards.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No vehicles pending QC inspection
                    </div>
                  ) : (
                    qcCards.map(item => (
                      <div 
                        key={item.id}
                        className={`ft-kanban-card ${currentRo?.id === item.id ? 'selected' : ''}`}
                        onClick={() => handleSelectWorkflowCard(item)}
                      >
                        <div className="ft-kanban-card-top">
                          <div className="ft-kanban-card-thumb">
                            <img src={item.thumb} alt={item.vehicle} />
                          </div>
                          <div className="ft-kanban-card-info">
                            <span className="ft-kanban-ro-num">{item.roNumber}</span>
                            <span className="ft-kanban-cust-name">{item.customer}</span>
                            <span className="ft-kanban-veh-model">{item.vehicle}</span>
                          </div>
                          <span className="ft-kanban-time">{item.time}</span>
                        </div>
                        <div className="ft-kanban-card-bottom">
                          <span className="ft-kanban-tech-tag">Tech: {item.tech}</span>
                          <span className="ft-kanban-service-tag">{item.service}</span>
                          <span className="ft-status-pill qc">{item.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 4. Ready for Pickup */}
                <div className="ft-kanban-col ready">
                  <div className="ft-kanban-col-header">
                    <span>4. Ready for Pickup ({readyCards.length})</span>
                    <CheckCircle2 size={13} color="#00e676" />
                  </div>
                  {readyCards.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No completed vehicles in ready bay
                    </div>
                  ) : (
                    readyCards.map(item => (
                      <div 
                        key={item.id}
                        className={`ft-kanban-card ${currentRo?.id === item.id ? 'selected' : ''}`}
                        onClick={() => handleSelectWorkflowCard(item)}
                      >
                        <div className="ft-kanban-card-top">
                          <div className="ft-kanban-card-thumb">
                            <img src={item.thumb} alt={item.vehicle} />
                          </div>
                          <div className="ft-kanban-card-info">
                            <span className="ft-kanban-ro-num">{item.roNumber}</span>
                            <span className="ft-kanban-cust-name">{item.customer}</span>
                            <span className="ft-kanban-veh-model">{item.vehicle}</span>
                          </div>
                          <span className="ft-kanban-time">{item.time}</span>
                        </div>
                        <div className="ft-kanban-card-bottom">
                          <span className="ft-kanban-service-tag">{item.service}</span>
                          <span className="ft-status-pill ready">{item.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* ================================================================
                ROW 3: TODAY'S KEY METRICS | SHOP ACTIVITY | FUTURETECH AI ALERTS
                ================================================================ */}
            <section className="ft-bottom-grid">
              {/* 1. Today's Key Metrics */}
              <article className="ft-card ft-metrics-card">
                <div className="ft-card-header">
                  <span className="ft-card-title">Today's Key Metrics</span>
                </div>

                <div className="ft-key-metrics-grid">
                  {/* Metric 1 */}
                  <div className="ft-metric-box">
                    <div className="ft-metric-icon-circle blue">
                      <Car size={16} />
                    </div>
                    <div className="ft-metric-num">{activeVehiclesCount}</div>
                    <div className="ft-metric-label">Vehicles in Shop</div>
                  </div>

                  {/* Metric 2 */}
                  <div className="ft-metric-box">
                    <div className="ft-metric-icon-circle teal">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="ft-metric-num">{completedTodayCount}</div>
                    <div className="ft-metric-label">ROs Completed</div>
                  </div>

                  {/* Metric 3 */}
                  <div className="ft-metric-box">
                    <div className="ft-metric-icon-circle green">
                      <DollarSign size={16} />
                    </div>
                    <div className="ft-metric-num">$8,420</div>
                    <div className="ft-metric-label">Today's Revenue</div>
                  </div>

                  {/* Metric 4 */}
                  <div className="ft-metric-box">
                    <div className="ft-metric-icon-circle gold">
                      <Star size={16} />
                    </div>
                    <div className="ft-metric-num">4.8</div>
                    <div className="ft-metric-label">Avg. Customer Rating</div>
                  </div>
                </div>
              </article>

              {/* 2. Shop Activity Bar Chart */}
              <article className="ft-card ft-activity-card">
                <div className="ft-card-header ft-activity-header">
                  <span className="ft-card-title">Shop Activity</span>
                  <div className="ft-activity-legend">
                    <span><span className="ft-legend-dot blue" />Check-In</span>
                    <span><span className="ft-legend-dot cyan" />In Progress</span>
                    <span><span className="ft-legend-dot teal" />Ready</span>
                  </div>
                </div>

                {/* Graphic Bars */}
                <div className="ft-activity-bars-wrapper">
                  {[
                    { time: '8AM', heights: [25, 45, 10] },
                    { time: '', heights: [40, 30, 20] },
                    { time: '10AM', heights: [60, 50, 35] },
                    { time: '', heights: [55, 65, 40] },
                    { time: '12PM', heights: [75, 80, 50] },
                    { time: '', heights: [65, 70, 60] },
                    { time: '2PM', heights: [45, 85, 70] },
                    { time: '', heights: [35, 75, 80] },
                    { time: '4PM', heights: [20, 60, 85] },
                    { time: '', heights: [15, 45, 65] },
                    { time: '6PM', heights: [10, 25, 40] }
                  ].map((col, idx) => (
                    <div key={idx} className="ft-bar-column">
                      <div className="ft-bar-segment" style={{ height: `${col.heights[0]}%`, background: '#0070f3' }} title="Check-In" />
                      <div className="ft-bar-segment" style={{ height: `${col.heights[1]}%`, background: '#00d2ff' }} title="In Progress" />
                      <div className="ft-bar-segment" style={{ height: `${col.heights[2]}%`, background: '#00e676' }} title="Ready" />
                    </div>
                  ))}
                </div>

                <div className="ft-activity-time-axis">
                  <span>8AM</span>
                  <span>10AM</span>
                  <span>12PM</span>
                  <span>2PM</span>
                  <span>4PM</span>
                  <span>6PM</span>
                </div>
              </article>

              {/* 3. FutureTech AI Alerts */}
              <article className="ft-card ft-ai-alerts-card">
                <div className="ft-card-header">
                  <span className="ft-card-title">FutureTech AI Alerts</span>
                  <span className="ft-full-analysis-link" style={{ margin: 0 }} onClick={() => setShowAnalysisModal(true)}>
                    View All
                  </span>
                </div>

                <div className="ft-alerts-list">
                  {/* Alert 1 */}
                  <div className="ft-alert-row" onClick={() => showToast('Manufacturer Recall #20V-012: Low-pressure fuel pump replacement required.', 'error')}>
                    <div className="ft-alert-icon red">
                      <AlertTriangle size={15} />
                    </div>
                    <div className="ft-alert-content">
                      <span className="ft-alert-title">Recall Alert - {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}</span>
                      <span className="ft-alert-desc">Open safety bulletin found. NHTSA Campaign #20V-012.</span>
                    </div>
                    <span className="ft-alert-time">2 min ago</span>
                  </div>

                  {/* Alert 2 */}
                  <div className="ft-alert-row" onClick={() => showToast('AI Predictive Model: Vibration anomaly detected in coolant loop.', 'info')}>
                    <div className="ft-alert-icon gold">
                      <Star size={15} />
                    </div>
                    <div className="ft-alert-content">
                      <span className="ft-alert-title">Predicted Failure - Water Pump</span>
                      <span className="ft-alert-desc">Impeller friction index elevated by 24%.</span>
                    </div>
                    <span className="ft-alert-time">12 min ago</span>
                  </div>

                  {/* Alert 3 */}
                  <div className="ft-alert-row" onClick={() => showToast('Battery Health at 42%: Low cold-cranking capacity.', 'error')}>
                    <div className="ft-alert-icon gray">
                      <AlertCircle size={15} />
                    </div>
                    <div className="ft-alert-content">
                      <span className="ft-alert-title">Battery Health - Low</span>
                      <span className="ft-alert-desc">Measured at 42% state of health. Recommend replacement.</span>
                    </div>
                    <span className="ft-alert-time">28 min ago</span>
                  </div>
                </div>
              </article>
            </section>
          </main>
        )}
      </div>

      {/* ====================================================================
          DETAILED AI ANALYSIS MODAL
          ==================================================================== */}
      {showAnalysisModal && (
        <div className="ft-modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="ft-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={20} color="#00d2ff" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>FutureTech AI Diagnostic Dossier</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAnalysisModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
              Real-time telemetry and deep OBD-II stream for <strong>{currentVehicle.year} {currentVehicle.make} {currentVehicle.model}</strong> (VIN: {currentVehicle.vin}).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>CAN-BUS Link Status</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00e676', marginTop: '0.2rem' }}>Connected (5.0 Mbps CAN-FD)</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Diagnostic Trouble Codes</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffb300', marginTop: '0.2rem' }}>0 Active / 1 Pending</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.25)', padding: '0.9rem', borderRadius: '8px', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffb300', marginBottom: '0.3rem' }}>Predicted Component Failure Warning</div>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                Sensor signature P0087-Pending: Coolant temperature delta between radiator inlet and engine block exceeds threshold during stop-and-go driving. Water pump bearing friction index elevated by 24%.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button 
                type="button" 
                className="ft-btn-subtle" 
                style={{ padding: '0.5rem 1rem' }} 
                onClick={() => setShowAnalysisModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="ft-btn-add-ro" 
                style={{ padding: '0.5rem 1rem' }} 
                onClick={() => {
                  handleAddToRo();
                  setShowAnalysisModal(false);
                }}
              >
                Add Preventive Service to RO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTION MODALS */}
      {activeModal && (
        <div className="ft-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ft-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {activeModal.replace('-', ' ')}
              </h3>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
              {activeModal === 'schedule' && `Select appointment date & service bay for ${currentCustomer.name}`}
              {activeModal === 'add-note' && `Add internal technician or advisor inspection note to ${currentRo?.roNumber || 'RO'}`}
              {activeModal === 'send-message' && `Send instant SMS update to ${currentCustomer.phone}`}
              {activeModal === 'payment' && `Process payment terminal for ${currentRo?.roNumber || 'RO'} - Total: $428.50`}
              {activeModal === 'history' && `Displaying previous maintenance records for VIN ${currentVehicle.vin}`}
              {activeModal === 'details' && `Vehicle Specs: ${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model} • VIN ${currentVehicle.vin}`}
              {activeModal === 'edit-vehicle' && `Edit vehicle and customer profile for ${currentCustomer.name}`}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
              <button type="button" className="ft-btn-subtle" style={{ padding: '0.4rem 0.9rem' }} onClick={() => setActiveModal(null)}>
                Dismiss
              </button>
              <button 
                type="button" 
                className="ft-btn-new-ro" 
                style={{ padding: '0.4rem 0.9rem' }} 
                onClick={() => {
                  showToast(`Action "${activeModal}" saved successfully`, 'success');
                  setActiveModal(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FutureTechOS;
