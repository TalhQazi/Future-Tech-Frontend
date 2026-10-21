import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Wrench } from 'lucide-react';
import { api, session, refreshSession } from '../api/client.js';
import { navigate } from '../router.js';
import { Button, Field, Input, Alert, Spinner, ToastProvider, useAction } from './ui.jsx';
import './app.css';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => session.onChange(setUser), []);
  useEffect(() => {
    if (!session.hasRefresh()) { setChecking(false); return; }
    refreshSession().then(r => setUser(r.user)).catch(() => setUser(null)).finally(() => setChecking(false));
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    session.clear();
    navigate('#/login');
  }, []);

  const can = useCallback((perm) => Boolean(user?.permissions?.includes(perm)), [user]);
  const reloadMe = useCallback(async () => setUser((await api.get('/auth/me')).user), []);
  return <AuthCtx.Provider value={{ user, checking, logout, can, reloadMe }}>{children}</AuthCtx.Provider>;
};

const homeFor = (user) => (user.role === 'customer' ? '#/portal' : '#/app');

const Brand = () => (
  <div className="row" style={{ gap: 10 }}>
    <img src="/brand/futuretech-logo-sm.webp" alt="" width="34" height="34" style={{ borderRadius: 8 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    <div><strong style={{ fontSize: 16 }}>FutureTech Shop OS</strong><div className="muted small">Membership Auto</div></div>
  </div>
);

const MfaEnroll = ({ enrollmentToken, onDone }) => {
  const [setup, setSetup] = useState(null);
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState(null);
  const [run, busy] = useAction();
  useEffect(() => {
    run(async () => {
      const s = await api.post('/auth/mfa/enroll/start', { enrollmentToken });
      setSetup(s);
      setQr(await QRCode.toDataURL(s.otpauthUri, { margin: 1, width: 200 }));
    });
  }, [enrollmentToken, run]);
  const confirm = () => run(async () => {
    const res = await api.post('/auth/mfa/enroll/confirm', { enrollmentToken, code });
    setCodes({ list: res.recoveryCodes, res });
  });
  if (codes) {
    return (
      <div className="stack">
        <Alert tone="ok">Authenticator enabled. Save these one-time recovery codes now; they will not be shown again.</Alert>
        <div className="grid-2 mono" style={{ background: '#0a1120', padding: 12, borderRadius: 8 }}>{codes.list.map(c => <span key={c}>{c}</span>)}</div>
        <Button variant="primary" block onClick={() => onDone(codes.res)}>I saved my recovery codes</Button>
      </div>
    );
  }
  if (!setup) return <Spinner />;
  return (
    <div className="stack">
      <Alert tone="info"><strong>Set up multi-factor authentication.</strong> Scan the code with an authenticator app (Microsoft Authenticator, Google Authenticator, 1Password).</Alert>
      {qr && <img src={qr} alt="Authenticator QR code" style={{ width: 200, height: 200, margin: '0 auto', borderRadius: 8, background: '#fff', padding: 6 }} />}
      <div className="small muted">Or enter this key manually: <span className="mono" style={{ wordBreak: 'break-all', color: '#fff' }}>{setup.secret}</span></div>
      <Field label="6-digit code"><Input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} /></Field>
      <Button variant="primary" block loading={busy} disabled={code.length !== 6} onClick={confirm}>Verify and enable</Button>
    </div>
  );
};

export const AuthScreen = ({ mode, query }) => {
  const { user } = useAuth();
  const [step, setStep] = useState({ kind: 'form' });
  const [form, setForm] = useState({ name: '', email: query?.email || '', password: '', phone: '', code: '' });
  const [message, setMessage] = useState(null);
  const [run, busy] = useAction();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (user && mode === 'login' && step.kind === 'form') navigate(homeFor(user)); }, [user, mode, step.kind]);

  const finish = (res) => {
    session.set(res);
    navigate(homeFor(res.user));
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email: form.email, password: form.password });
        if (res.requiresMfa) return setStep({ kind: 'mfa', mfaToken: res.mfaToken });
        if (res.requiresMfaEnrollment) return setStep({ kind: 'enroll', enrollmentToken: res.enrollmentToken });
        return finish(res);
      }
      if (mode === 'register') return finish(await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, phone: form.phone }));
      if (mode === 'forgot') return setMessage((await api.post('/auth/password/forgot', { email: form.email })).message);
      if (mode === 'reset') {
        setMessage((await api.post('/auth/password/reset', { email: query.email, token: query.token, newPassword: form.password })).message);
        return setTimeout(() => navigate('#/login'), 1500);
      }
      if (mode === 'invite') {
        setMessage((await api.post('/auth/invite/accept', { email: query.email, token: query.token, password: form.password })).message);
        return setTimeout(() => navigate('#/login'), 1500);
      }
      return null;
    });
  };

  const verifyMfa = (e) => {
    e.preventDefault();
    run(async () => finish(await api.post('/auth/mfa/verify', { mfaToken: step.mfaToken, code: form.code })));
  };

  const titles = { login: 'Sign in', register: 'Create your customer account', forgot: 'Reset your password', reset: 'Choose a new password', invite: 'Activate your account' };

  return (
    <ToastProvider>
      <div className="ft">
        <main className="ft-auth">
          <div className="ft-auth-card">
            <Brand />
            {step.kind === 'enroll' && <MfaEnroll enrollmentToken={step.enrollmentToken} onDone={finish} />}
            {step.kind === 'mfa' && (
              <form className="stack" onSubmit={verifyMfa}>
                <div className="row"><ShieldCheck size={18} /><h2 style={{ fontSize: 18 }}>Two-step verification</h2></div>
                <p className="muted">Enter the code from your authenticator app, or a recovery code.</p>
                <Field label="Verification code"><Input autoFocus autoComplete="one-time-code" value={form.code} onChange={set('code')} /></Field>
                <Button type="submit" variant="primary" block loading={busy}>Verify</Button>
                <Button variant="ghost" onClick={() => setStep({ kind: 'form' })}>Back</Button>
              </form>
            )}
            {step.kind === 'form' && (
              <form className="stack" onSubmit={submit}>
                <h2 style={{ fontSize: 20 }}>{titles[mode]}</h2>
                {message && <Alert tone="ok">{message}</Alert>}
                {mode === 'register' && <Alert tone="info">Customer accounts only. Staff accounts are created by your shop manager.</Alert>}
                {mode === 'register' && <Field label="Full name"><Input required value={form.name} onChange={set('name')} autoComplete="name" /></Field>}
                {!['reset', 'invite'].includes(mode) && <Field label="Email"><Input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>}
                {mode === 'register' && <Field label="Mobile phone (optional)"><Input value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>}
                {mode !== 'forgot' && (
                  <Field label={mode === 'login' ? 'Password' : 'New password'} hint={mode === 'login' ? undefined : 'At least 10 characters with letters and numbers'}>
                    <Input required type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  </Field>
                )}
                <Button type="submit" variant="primary" block loading={busy}>{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Save password'}</Button>
                <div className="row between small">
                  {mode === 'login' ? <a href="#/forgot-password">Forgot password?</a> : <a href="#/login">Back to sign in</a>}
                  {mode === 'login' && <a href="#/register">New customer? Register</a>}
                </div>
                <a href="#/" className="small muted row"><Wrench size={13} /> Back to website</a>
              </form>
            )}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
};

export { MfaEnroll };
