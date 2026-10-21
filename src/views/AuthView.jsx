import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useShop } from '../context/ShopContext.jsx';
import { BrandLogo } from '../components/BrandLogo.jsx';
import { 
  UserCheck, 
  Wrench, 
  BarChart3, 
  Car, 
  Package, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const ROLE_DEFINITIONS = [
  {
    id: 'advisor',
    label: 'Service Advisor',
    short: 'Advisor',
    icon: UserCheck,
    color: '#00d2ff',
    desc: 'Customer check-in, repair order intake, estimate authoring, and customer communication.',
    defaultSpecialty: 'Customer Relations & Service Writing'
  },
  {
    id: 'technician',
    label: 'Master Technician',
    short: 'Tech',
    icon: Wrench,
    color: '#a855f7',
    desc: 'OBD-II CAN-FD telemetry, interactive wiring, actuator test bench, and multi-point DVI checklist.',
    defaultSpecialty: 'Master Diagnostics / High Voltage & Powertrain'
  },
  {
    id: 'manager',
    label: 'Shop Manager',
    short: 'Manager',
    icon: BarChart3,
    color: '#00e676',
    desc: 'Shop-wide bay radar, technician workload dispatch, comeback rates, and executive KPIs.',
    defaultSpecialty: 'Shop Operations & Workflow Optimization'
  },
  {
    id: 'customer',
    label: 'Customer User',
    short: 'Customer',
    icon: Car,
    color: '#fbbf24',
    desc: 'Vehicle garage portal, live repair progress, digital estimate approval, and online payment.',
    defaultSpecialty: 'Retail Vehicle Owner'
  },
  {
    id: 'parts',
    label: 'Parts Specialist',
    short: 'Parts',
    icon: Package,
    color: '#f97316',
    desc: 'Inventory catalog, bin stocking, parts requisition queue, and supplier reliability stats.',
    defaultSpecialty: 'OEM / Aftermarket Supply Chain'
  },
  {
    id: 'accounting',
    label: 'Billing Controller',
    short: 'Billing',
    icon: CreditCard,
    color: '#38bdf8',
    desc: 'Commercial invoicing, split card/cash payments, sales tax accounting, and revenue ledger.',
    defaultSpecialty: 'Automotive Accounting & Compliance'
  },
  {
    id: 'admin',
    label: 'Corporate Admin',
    short: 'Admin',
    icon: ShieldCheck,
    color: '#ec4899',
    desc: 'Append-only cryptographic audit logs, multi-location configuration, and security policies.',
    defaultSpecialty: 'Enterprise Fleet & Security Administration'
  }
];

export const AuthView = ({ initialMode = 'login', onAuthSuccess, isModal = false, onClose }) => {
  const { setCurrentUser, showToast, refreshAll } = useShop();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('advisor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: ''
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const currentRoleMeta = ROLE_DEFINITIONS.find(r => r.id === selectedRole) || ROLE_DEFINITIONS[0];

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
        phone: formData.phone.trim(),
        specialty: formData.specialty.trim() || currentRoleMeta.defaultSpecialty
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('ft_user', JSON.stringify(res.user));
        showToast(`Welcome, ${res.user.name}! Registered as ${res.user.role.toUpperCase()}`, 'success');
        if (onAuthSuccess) {
          onAuthSuccess(res.user);
        } else {
          window.location.hash = `#/app/${res.user.role}`;
        }
        refreshAll();
      } else {
        setErrorMsg(res.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not connect to registration server');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(loginEmail.trim(), loginPassword);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('ft_user', JSON.stringify(res.user));
        showToast(`Signed in as ${res.user.name} (${res.user.role.toUpperCase()})`, 'success');
        if (onAuthSuccess) {
          onAuthSuccess(res.user);
        } else {
          window.location.hash = `#/app/${res.user.role}`;
        }
        refreshAll();
      } else {
        setErrorMsg(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleAccess = async (roleId) => {
    try {
      setLoading(true);
      const res = await api.login(null, null, roleId);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('ft_user', JSON.stringify(res.user));
        showToast(`Direct access granted as ${res.user.role.toUpperCase()} (${res.user.name})`, 'success');
        if (onAuthSuccess) {
          onAuthSuccess(res.user);
        } else {
          window.location.hash = `#/app/${res.user.role}`;
        }
        refreshAll();
      }
    } catch (err) {
      setErrorMsg('Quick access error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: isModal ? 'auto' : '100vh',
      width: '100%',
      background: isModal ? 'transparent' : 'radial-gradient(circle at 50% 20%, #0d1527 0%, #070c16 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isModal ? '0' : 'clamp(20px, 4vw, 40px) 16px',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Top Navigation Back Link (for full page view) */}
      {!isModal && (
        <div style={{ width: '100%', maxWidth: '820px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a
            href="#/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#8fa0c0',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={16} /> Return to Home
          </a>

          <a
            href="#/app"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#00d2ff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '700'
            }}
          >
            Launch Shop OS Directly →
          </a>
        </div>
      )}

      {/* Main Glassmorphic Container */}
      <div style={{
        width: '100%',
        maxWidth: '820px',
        background: 'rgba(13, 21, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 210, 255, 0.25)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(0, 210, 255, 0.1)',
        borderRadius: '20px',
        padding: 'clamp(20px, 4vw, 36px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative gradient top bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #00d2ff, #a855f7, #00e676)'
        }} />

        {/* Modal Close button */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#8fa0c0',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        )}

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <BrandLogo style={{ height: '44px', width: 'auto' }} />
          </div>
          <h1 style={{
            margin: '0 0 6px 0',
            fontSize: 'clamp(22px, 3vw, 28px)',
            fontWeight: '900',
            letterSpacing: '-0.02em',
            color: '#fff'
          }}>
            MEMBERSHIP AUTO <span style={{ color: '#00d2ff' }}>+ FUTURETECH 2.0</span>
          </h1>
          <p style={{ margin: 0, color: '#8fa0c0', fontSize: '13px' }}>
            Intelligent Shop OS • CAN-FD Diagnostics • Role-Based Panel Access
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: '#070b14',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              background: mode === 'login' ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(0, 112, 243, 0.3))' : 'transparent',
              color: mode === 'login' ? '#00d2ff' : '#8fa0c0',
              border: mode === 'login' ? '1px solid rgba(0, 210, 255, 0.4)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.18s ease'
            }}
          >
            <Lock size={15} /> Sign In to Panel
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{
              background: mode === 'register' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(0, 210, 255, 0.2))' : 'transparent',
              color: mode === 'register' ? '#a855f7' : '#8fa0c0',
              border: mode === 'register' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.18s ease'
            }}
          >
            <Sparkles size={15} /> Register New Account
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* =========================================================================
            REGISTER MODE
           ========================================================================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Step 1: Select Panel Role */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#00d2ff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                1. Select Shop Role & Panel Permission:
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px'
              }}>
                {ROLE_DEFINITIONS.map(r => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      style={{
                        background: isSelected ? 'rgba(0, 210, 255, 0.12)' : 'rgba(7, 11, 20, 0.6)',
                        border: isSelected ? `2px solid ${r.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSelected ? `0 0 16px ${r.color}33` : 'none',
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${r.color}22`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={16} color={r.color} />
                        </div>
                        {isSelected && <CheckCircle2 size={16} color={r.color} />}
                      </div>

                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8fa0c0', lineHeight: 1.35 }}>
                        {r.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Form Inputs */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#00d2ff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                2. User Credentials & Profile:
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px'
              }}>
                {/* Full Name */}
                <div>
                  <label style={{ fontSize: '11px', color: '#8fa0c0', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ fontSize: '11px', color: '#8fa0c0', display: 'block', marginBottom: '4px' }}>Work or Personal Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="email"
                      required
                      placeholder="user@futuretech.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ fontSize: '11px', color: '#8fa0c0', display: 'block', marginBottom: '4px' }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 4 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 36px 10px 36px',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={{ fontSize: '11px', color: '#8fa0c0', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="tel"
                      placeholder="e.g. (555) 019-2849"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Specialty / Focus */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#8fa0c0', display: 'block', marginBottom: '4px' }}>
                    {selectedRole === 'technician' ? 'Certifications / Technical Specialty' : 'Role Specialty / Responsibilities'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Award size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder={`e.g. ${currentRoleMeta.defaultSpecialty}`}
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        background: '#070b14',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                color: '#fff',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(0, 210, 255, 0.35)',
                transition: 'all 0.18s ease'
              }}
            >
              {loading ? 'Creating Account & Initializing Panel...' : (
                <>
                  <span>Complete Registration & Open {currentRoleMeta.label} Panel</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* =========================================================================
            SIGN IN MODE
           ========================================================================= */}
        {mode === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#8fa0c0', display: 'block', marginBottom: '6px' }}>
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    placeholder="Enter registered email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8fa0c0', display: 'block', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 38px',
                      background: '#070b14',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #0070f3)',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(0, 210, 255, 0.35)',
                  marginTop: '8px'
                }}
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <span>Sign In to Shop OS</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Panel Testing Switcher */}
            <div style={{
              background: '#070b14',
              borderRadius: '12px',
              padding: '18px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#8fa0c0', textTransform: 'uppercase' }}>
                  Quick Demo Access (Select Role Panel)
                </span>
                <span style={{ fontSize: '11px', color: '#00d2ff' }}>Instant Session</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px'
              }}>
                {ROLE_DEFINITIONS.map(r => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickRoleAccess(r.id)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '10px 8px',
                        color: '#d0d8ea',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = r.color;
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#d0d8ea';
                      }}
                    >
                      <Icon size={14} color={r.color} />
                      <span>{r.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthView;
