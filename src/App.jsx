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

const APP_TITLE = 'Shop OS | FutureTech 2.0';
const SITE_TITLE = 'FutureTech 2.0 | Shop OS with Built-In Vehicle Diagnostics';

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
    <div className="app-shell">
      <a href="#app-main" className="skip-link">Skip to workspace</a>

      {/* Sticky Shop Navigation Header */}
      <Header onOpenCheckIn={() => setIsCheckInOpen(true)} />

      {/* Main Shop View Area */}
      <main id="app-main" className="app-main" key={currentUser.role} tabIndex={-1}>
        {error && (
          <div className="app-error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {currentUser.role === 'advisor' && (
          <AdvisorView onOpenCheckIn={() => setIsCheckInOpen(true)} />
        )}
        {currentUser.role === 'technician' && (
          <TechnicianView />
        )}
        {currentUser.role === 'manager' && (
          <ManagerView />
        )}
        {currentUser.role === 'customer' && (
          <CustomerView />
        )}
      </main>

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
    document.title = route.name === 'app' ? APP_TITLE : SITE_TITLE;
    if (route.name === 'app') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.name]);

  if (route.name === 'app') {
    return (
      <ShopProvider initialRole={route.role || 'advisor'}>
        <ShopApp />
      </ShopProvider>
    );
  }

  return <LandingPage />;
}
