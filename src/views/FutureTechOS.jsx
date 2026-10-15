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
  ChevronRight,
  ExternalLink,
  Crown
} from 'lucide-react';

export const FutureTechOS = ({ onOpenCheckIn }) => {
  const { showToast } = useShop();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  // Search query in workflow
  const [searchQuery, setSearchQuery] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('All');
  const [isScanning, setIsScanning] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Selected RO / Vehicle in the OS
  const [selectedRo, setSelectedRo] = useState({
    id: 'ro_10018',
    roNumber: 'RO #10018',
    customer: {
      name: 'Michael Thompson',
      phone: '(615) 555-0187',
      email: 'mthompson@email.com',
      memberSince: 'Jan 2023',
      tier: 'VIP Member',
      avatar: '/dashboard/michael_avatar.jpg'
    },
    vehicle: {
      year: 2021,
      make: 'Toyota',
      model: 'RAV4',
      trim: 'XLE AWD • 2.5L 4-Cyl',
      vin: '2T3P1RFV2MW123456',
      image: '/dashboard/rav4_white.jpg',
      currentMileage: '48,215',
      nextService: '52,500',
      membershipPlan: 'Premium Care',
      status: 'Active'
    },
    service: 'Oil Leak Repair',
    tech: 'Alex',
    time: '10:30 AM',
    column: 'in-progress'
  });

  // Kanban workflow cards data matching photo
  const workflowData = [
    {
      id: 'ro_10021',
      roNumber: 'RO #10021',
      customer: 'Sarah Miller',
      vehicle: '2020 Honda CR-V',
      service: 'Oil Change',
      time: '8:15 AM',
      thumb: '/dashboard/honda_crv.jpg',
      column: 'check-in',
      status: 'Waiting',
      statusType: 'waiting',
      tech: 'Unassigned',
      vin: '7FARW1H82LE019284',
      mileage: '38,120'
    },
    {
      id: 'ro_10022',
      roNumber: 'RO #10022',
      customer: 'Jason Carter',
      vehicle: '2019 Ford F-150',
      service: 'Noise Diagnosis',
      time: '9:00 AM',
      thumb: '/dashboard/ford_f150.jpg',
      column: 'check-in',
      status: 'Waiting',
      statusType: 'waiting',
      tech: 'Unassigned',
      vin: '1FTFW1E84KFB92817',
      mileage: '64,980'
    },
    {
      id: 'ro_10018',
      roNumber: 'RO #10018',
      customer: 'Michael Thompson',
      vehicle: '2021 Toyota RAV4',
      service: 'Oil Leak Repair',
      time: '10:30 AM',
      thumb: '/dashboard/rav4_white.jpg',
      column: 'in-progress',
      status: 'In Progress',
      statusType: 'in-progress',
      tech: 'Alex',
      vin: '2T3P1RFV2MW123456',
      mileage: '48,215'
    },
    {
      id: 'ro_10020',
      roNumber: 'RO #10020',
      customer: 'Lisa Martinez',
      vehicle: '2022 Chevy Equinox',
      service: 'Brake Service',
      time: '11:15 AM',
      thumb: '/dashboard/ford_f150.jpg',
      column: 'in-progress',
      status: 'In Progress',
      statusType: 'in-progress',
      tech: 'Brian',
      vin: '3GNAXUEV6NS192837',
      mileage: '29,450'
    },
    {
      id: 'ro_10017',
      roNumber: 'RO #10017',
      customer: 'Robert Kim',
      vehicle: '2018 BMW 330i',
      service: 'Inspection',
      time: '1:00 PM',
      thumb: '/dashboard/bmw_330i.jpg',
      column: 'qc',
      status: 'QC',
      statusType: 'qc',
      tech: 'Chris',
      vin: 'WBA8B7C50JA819201',
      mileage: '54,100'
    },
    {
      id: 'ro_10019',
      roNumber: 'RO #10019',
      customer: 'Amanda Lewis',
      vehicle: '2021 Jeep Grand Cherokee',
      service: 'Suspension Repair',
      time: '2:30 PM',
      thumb: '/dashboard/rav4_white.jpg',
      column: 'qc',
      status: 'QC',
      statusType: 'qc',
      tech: 'Daniel',
      vin: '1C4RJFBG3MC891234',
      mileage: '41,750'
    },
    {
      id: 'ro_10016',
      roNumber: 'RO #10016',
      customer: 'David Wilson',
      vehicle: '2020 Tesla Model 3',
      service: 'Tire Replacement',
      time: '3:15 PM',
      thumb: '/dashboard/tesla_model3.jpg',
      column: 'ready',
      status: 'Ready',
      statusType: 'ready',
      tech: 'Tyler',
      vin: '5YJ3E1EB8LF819203',
      mileage: '33,920'
    },
    {
      id: 'ro_10015',
      roNumber: 'RO #10015',
      customer: 'Emily Clark',
      vehicle: '2019 Subaru Outback',
      service: '90K Service',
      time: '4:00 PM',
      thumb: '/dashboard/honda_crv.jpg',
      column: 'ready',
      status: 'Ready',
      statusType: 'ready',
      tech: 'Marcus',
      vin: '4S4BSANC4K3981273',
      mileage: '91,400'
    }
  ];

  const handleSelectWorkflowCard = (item) => {
    setSelectedRo({
      id: item.id,
      roNumber: item.roNumber,
      customer: {
        name: item.customer,
        phone: item.customer === 'Michael Thompson' ? '(615) 555-0187' : '(615) 555-0921',
        email: `${item.customer.toLowerCase().replace(' ', '.')}@email.com`,
        memberSince: 'Jan 2023',
        tier: 'VIP Member',
        avatar: item.customer === 'Michael Thompson' ? '/dashboard/michael_avatar.jpg' : '/dashboard/michael_avatar.jpg'
      },
      vehicle: {
        year: parseInt(item.vehicle.split(' ')[0]),
        make: item.vehicle.split(' ')[1],
        model: item.vehicle.split(' ').slice(2).join(' '),
        trim: 'All-Wheel Drive • Standard Equipment',
        vin: item.vin || '2T3P1RFV2MW123456',
        image: item.thumb,
        currentMileage: item.mileage || '48,215',
        nextService: '52,500',
        membershipPlan: 'Premium Care',
        status: 'Active'
      },
      service: item.service,
      tech: item.tech,
      time: item.time,
      column: item.column
    });
    showToast(`Loaded ${item.roNumber} (${item.customer} - ${item.vehicle})`, 'info');
  };

  const handleRunScan = () => {
    setIsScanning(true);
    showToast('Running FutureTech AI Diagnostic Scan...', 'info');
    setTimeout(() => {
      setIsScanning(false);
      showToast('Scan Complete: 8 Controller Systems Analyzed. 1 Action Required.', 'success');
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

  const filteredCards = workflowData.filter(card => {
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
        card.service.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
          <button type="button" className="ft-icon-btn" title="Notifications" onClick={() => showToast('3 system notifications pending', 'info')}>
            <Bell size={18} />
            <span className="ft-badge-dot">3</span>
          </button>

          <button type="button" className="ft-icon-btn" title="Help & Support" onClick={() => showToast('FutureTech 2.0 OS Help Guide', 'info')}>
            <HelpCircle size={18} />
          </button>

          <div className="ft-advisor-profile" onClick={() => showToast('Logged in as John Davis (Service Advisor)', 'info')}>
            <div className="ft-advisor-avatar">JD</div>
            <div className="ft-advisor-meta">
              <span className="ft-advisor-name">John Davis</span>
              <span className="ft-advisor-role">Service Advisor</span>
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

        {/* MAIN DASHBOARD CONTENT */}
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
                  <img src={selectedRo.customer.avatar} alt={selectedRo.customer.name} />
                </div>
                <div className="ft-cust-details">
                  <div className="ft-cust-name-row">
                    <span className="ft-cust-name">{selectedRo.customer.name}</span>
                    <span className="ft-vip-badge">
                      <Crown size={11} />
                      {selectedRo.customer.tier}
                    </span>
                  </div>
                  <div className="ft-cust-meta-item">
                    <span>{selectedRo.customer.phone}</span>
                  </div>
                  <div className="ft-cust-meta-item">
                    <span>{selectedRo.customer.email}</span>
                  </div>
                  <div className="ft-cust-meta-item">
                    <span>Member Since: {selectedRo.customer.memberSince}</span>
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
                    <div className="ft-veh-name">{selectedRo.vehicle.year} {selectedRo.vehicle.make} {selectedRo.vehicle.model}</div>
                    <div className="ft-veh-trim">{selectedRo.vehicle.trim}</div>
                  </div>
                </div>
                <div className="ft-veh-vin">VIN: {selectedRo.vehicle.vin}</div>

                <div className="ft-veh-photo-wrapper">
                  <img src={selectedRo.vehicle.image} alt={selectedRo.vehicle.model} />
                </div>
              </div>

              {/* Stat Strip */}
              <div className="ft-veh-stats-strip">
                <div className="ft-stat-cell">
                  <span className="ft-stat-label">Current Mileage</span>
                  <span className="ft-stat-val">{selectedRo.vehicle.currentMileage}</span>
                </div>
                <div className="ft-stat-cell">
                  <span className="ft-stat-label">Next Service</span>
                  <span className="ft-stat-val">{selectedRo.vehicle.nextService}</span>
                </div>
                <div className="ft-stat-cell">
                  <span className="ft-stat-label">Membership Plan</span>
                  <span className="ft-stat-val">{selectedRo.vehicle.membershipPlan}</span>
                </div>
                <div className="ft-stat-cell">
                  <span className="ft-stat-label">Status</span>
                  <span className="ft-stat-val ft-badge-active">{selectedRo.vehicle.status}</span>
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
                  <div className="ft-diag-node" onClick={() => showToast('Engine: 0 DTCs. Fuel trim optimal.', 'success')}>
                    <div className="ft-diag-icon-dot ok">✓</div>
                    <div className="ft-diag-text">
                      <span className="ft-diag-name">Engine</span>
                      <span className="ft-diag-status">No Issues</span>
                    </div>
                    <span className="ft-diag-expand-icon">+</span>
                  </div>

                  <div className="ft-diag-node" onClick={() => showToast('Transmission: Fluid pressure normal.', 'success')}>
                    <div className="ft-diag-icon-dot ok">✓</div>
                    <div className="ft-diag-text">
                      <span className="ft-diag-name">Transmission</span>
                      <span className="ft-diag-status">No Issues</span>
                    </div>
                    <span className="ft-diag-expand-icon">+</span>
                  </div>

                  <div className="ft-diag-node" onClick={() => showToast('Brakes: Front pads at 4mm (60% wear).', 'error')}>
                    <div className="ft-diag-icon-dot warn">!</div>
                    <div className="ft-diag-text">
                      <span className="ft-diag-name">Brakes</span>
                      <span className="ft-diag-status warn">Wear at 60%</span>
                    </div>
                    <span className="ft-diag-expand-icon">!</span>
                  </div>

                  <div className="ft-diag-node" onClick={() => showToast('Battery: 12.6V, 540 CCA measured.', 'success')}>
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
                  <div className="ft-diag-node" onClick={() => showToast('Tires: All 4 tires at 34 PSI. 6/32" tread remaining.', 'success')}>
                    <div className="ft-diag-icon-dot ok">✓</div>
                    <div className="ft-diag-text">
                      <span className="ft-diag-name">Tires</span>
                      <span className="ft-diag-status">Good</span>
                    </div>
                  </div>

                  <div className="ft-diag-node" onClick={() => showToast('Emissions: Catalyst & O2 sensors ready.', 'success')}>
                    <div className="ft-diag-icon-dot ok">✓</div>
                    <div className="ft-diag-text">
                      <span className="ft-diag-name">Emissions</span>
                      <span className="ft-diag-status">No Issues</span>
                    </div>
                  </div>

                  <div className="ft-diag-node" onClick={() => showToast('Recall: Fuel Pump Impeller Recall Active (NHTSA #20V-012)', 'error')}>
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
                      Based on mileage, driving patterns and live data, recommend:<br />
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
                    <span>Premium Care</span>
                  </div>
                  <span className="ft-pill-green">Active</span>
                </div>

                <div className="ft-member-renew-date">Renews Jan 15, 2026</div>

                <ul className="ft-member-perks-list">
                  <li className="ft-member-perk-item">
                    <CheckCircle2 size={13} className="ft-perk-check" />
                    <span>$0 Diagnostic Fee</span>
                  </li>
                  <li className="ft-member-perk-item">
                    <CheckCircle2 size={13} className="ft-perk-check" />
                    <span>Included Inspections</span>
                  </li>
                  <li className="ft-member-perk-item">
                    <CheckCircle2 size={13} className="ft-perk-check" />
                    <span>Preferred Scheduling</span>
                  </li>
                  <li className="ft-member-perk-item">
                    <CheckCircle2 size={13} className="ft-perk-check" />
                    <span>15% Off Repairs</span>
                  </li>
                  <li className="ft-member-perk-item">
                    <CheckCircle2 size={13} className="ft-perk-check" />
                    <span>Roadside Assistance</span>
                  </li>
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
                  {['All (12)', 'Waiting (2)', 'In Progress (4)', 'Quality Check (2)', 'Ready (3)'].map(tab => {
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
                  <span>1. Check-In (2)</span>
                  <CheckCircle2 size={13} color="#ffb300" />
                </div>
                {filteredCards.filter(c => c.column === 'check-in').map(item => (
                  <div 
                    key={item.id}
                    className={`ft-kanban-card ${selectedRo.id === item.id ? 'selected' : ''}`}
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
                ))}
              </div>

              {/* 2. In Progress */}
              <div className="ft-kanban-col in-progress">
                <div className="ft-kanban-col-header">
                  <span>2. In Progress (4)</span>
                  <CheckCircle2 size={13} color="#00d2ff" />
                </div>
                {filteredCards.filter(c => c.column === 'in-progress').map(item => (
                  <div 
                    key={item.id}
                    className={`ft-kanban-card ${selectedRo.id === item.id ? 'selected' : ''}`}
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
                ))}
              </div>

              {/* 3. Quality Check */}
              <div className="ft-kanban-col qc">
                <div className="ft-kanban-col-header">
                  <span>3. Quality Check (2)</span>
                  <CheckCircle2 size={13} color="#9d4edd" />
                </div>
                {filteredCards.filter(c => c.column === 'qc').map(item => (
                  <div 
                    key={item.id}
                    className={`ft-kanban-card ${selectedRo.id === item.id ? 'selected' : ''}`}
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
                ))}
              </div>

              {/* 4. Ready for Pickup */}
              <div className="ft-kanban-col ready">
                <div className="ft-kanban-col-header">
                  <span>4. Ready for Pickup (3)</span>
                  <CheckCircle2 size={13} color="#00e676" />
                </div>
                {filteredCards.filter(c => c.column === 'ready').map(item => (
                  <div 
                    key={item.id}
                    className={`ft-kanban-card ${selectedRo.id === item.id ? 'selected' : ''}`}
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
                ))}
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
                  <div className="ft-metric-num">12</div>
                  <div className="ft-metric-label">Vehicles in Shop</div>
                </div>

                {/* Metric 2 */}
                <div className="ft-metric-box">
                  <div className="ft-metric-icon-circle teal">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="ft-metric-num">8</div>
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
                <div className="ft-alert-row" onClick={() => showToast('Toyota Recall #20V-012: Low-pressure fuel pump replacement required.', 'error')}>
                  <div className="ft-alert-icon red">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="ft-alert-content">
                    <span className="ft-alert-title">Recall Alert - 2021 Toyota RAV4</span>
                    <span className="ft-alert-desc">Open recall found. Click to view details.</span>
                  </div>
                  <span className="ft-alert-time">2 min ago</span>
                </div>

                {/* Alert 2 */}
                <div className="ft-alert-row" onClick={() => showToast('AI Water Pump Failure model: Vibration anomaly detected in coolant loop.', 'info')}>
                  <div className="ft-alert-icon gold">
                    <Star size={15} />
                  </div>
                  <div className="ft-alert-content">
                    <span className="ft-alert-title">Predicted Failure - Water Pump</span>
                    <span className="ft-alert-desc">High risk within 5,000 miles (RAV4)</span>
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
                    <span className="ft-alert-desc">Customer vehicle at 42%. Recommend replacement.</span>
                  </div>
                  <span className="ft-alert-time">28 min ago</span>
                </div>
              </div>
            </article>
          </section>
        </main>
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
              Real-time telemetry and deep OBD-II stream for <strong>{selectedRo.vehicle.year} {selectedRo.vehicle.make} {selectedRo.vehicle.model}</strong> (VIN: {selectedRo.vehicle.vin}).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>CAN-BUS Link Status</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00e676', marginTop: '0.2rem' }}>Connected (500 kbps)</div>
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
              {activeModal === 'schedule' && 'Select appointment date & service bay for ' + selectedRo.customer.name}
              {activeModal === 'add-note' && 'Add internal technician or advisor inspection note to ' + selectedRo.roNumber}
              {activeModal === 'send-message' && 'Send instant SMS / WhatsApp update to ' + selectedRo.customer.phone}
              {activeModal === 'payment' && 'Process payment terminal for ' + selectedRo.roNumber + ' - Total: $428.50'}
              {activeModal === 'history' && 'Displaying previous 6 maintenance records for VIN ' + selectedRo.vehicle.vin}
              {activeModal === 'details' && 'Vehicle Specs: 2.5L Dynamic Force 4-Cylinder DOHC, Direct Shift 8-Speed Electronically Controlled Automatic'}
              {activeModal === 'edit-vehicle' && 'Edit vehicle and customer profile for ' + selectedRo.customer.name}
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
