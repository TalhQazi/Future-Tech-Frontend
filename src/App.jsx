import React, { useEffect, useState } from 'react';
import { ShopProvider, useShop } from './context/ShopContext.jsx';
import { Header } from './components/Header.jsx';
import { AdvisorView } from './views/AdvisorView.jsx';
import { TechnicianView } from './views/TechnicianView.jsx';
import { ManagerView } from './views/ManagerView.jsx';
import { CustomerView } from './views/CustomerView.jsx';
import { CheckInModal } from './components/CheckInModal.jsx';
import { LandingPage } from './site/LandingPage.jsx';
import { useHashRoute, appHref } from './router.js';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

import { FutureTechOS } from './views/FutureTechOS.jsx';
import { AuthView } from './views/AuthView.jsx';

const APP_TITLE = 'Shop OS | FutureTech 2.0 AI';
const SITE_TITLE = 'FutureTech 2.0 | Shop OS with Built-In Vehicle Diagnostics';
const AUTH_TITLE = 'Authentication & Registration | FutureTech 2.0';

const ShopApp = () => {
  const { currentUser, toast, error } = useShop();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Keep the URL in sync with the active workspace so refresh/deep links work
  useEffect(() => {
    const target = appHref(currentUser.role);
    if (window.location.hash !== target) {
      window.history.replaceState(null, '', target);
    }
  }, [currentUser.role]);

  return (
    <div className="app-shell" style={{ padding: 0, margin: 0, maxWidth: '100vw', background: '#070c16' }}>
      <a href="#app-main" className="skip-link">Skip to workspace</a>

      {/* Main Shop OS matching the photo */}
      <FutureTechOS onOpenCheckIn={() => setIsCheckInOpen(true)} />

      {/* Check In Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />

      {/* Floating Shop Toast Notifications */}
      <div aria-live="polite" role="status">
        {toast && (
          <div className={`ft-toast ft-toast--${toast.type || 'success'}`}>
            <span className="ft-toast__icon" aria-hidden="true">
              {toast.type === 'error' ? <AlertCircle size={16} /> : toast.type === 'info' ? <Info size={16} /> : <CheckCircle2 size={16} />}
            </span>
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    document.title = route.name === 'app' ? APP_TITLE : route.name === 'auth' ? AUTH_TITLE : SITE_TITLE;
    if (route.name === 'app' || route.name === 'auth') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.name]);

  if (route.name === 'auth') {
    return (
      <ShopProvider>
        <AuthView initialMode={route.mode || 'login'} />
      </ShopProvider>
    );
  }

  if (route.name === 'app') {
    return (
      <ShopProvider initialRole={route.role || 'advisor'}>
        <ShopApp />
      </ShopProvider>
    );
  }

  return <LandingPage />;
}
