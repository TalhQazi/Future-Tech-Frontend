import React, { useEffect } from 'react';
import { LandingPage } from './site/LandingPage.jsx';
import { useHashRoute, navigate } from './router.js';
import { AuthProvider, AuthScreen, useAuth } from './app/auth.jsx';
import { ToastProvider, ConfirmProvider, Spinner } from './app/ui.jsx';
import { StaffApp } from './app/StaffApp.jsx';
import { Portal } from './app/Portal.jsx';
import './app/app.css';

const TITLES = { site: 'FutureTech 2.0 | Shop OS with Built-In Vehicle Diagnostics', auth: 'Sign in | FutureTech 2.0', app: 'Shop OS | FutureTech 2.0', portal: 'My Garage | FutureTech 2.0' };

const Routed = () => {
  const route = useHashRoute();
  const { user, checking } = useAuth();

  useEffect(() => { document.title = TITLES[route.name] || TITLES.site; }, [route.name]);
  useEffect(() => {
    if (checking) return;
    if ((route.name === 'app' || route.name === 'portal') && !user) navigate('#/login');
    else if (route.name === 'app' && user?.role === 'customer') navigate('#/portal');
    else if (route.name === 'portal' && user && user.role !== 'customer') navigate('#/app');
  }, [route.name, user, checking]);

  if (route.name === 'site') return <LandingPage />;
  if (route.name === 'auth') return <AuthScreen key={route.mode} mode={route.mode} query={route.query} />;
  if (checking || !user) return <div className="ft"><Spinner /></div>;
  if (route.name === 'portal' && user.role === 'customer') return <Portal route={route} />;
  if (route.name === 'app' && user.role !== 'customer') return <StaffApp route={route} />;
  return <div className="ft"><Spinner /></div>;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routed />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
