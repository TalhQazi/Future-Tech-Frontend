import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

const ShopContext = createContext(null);

// Local fallback users, also used to start the app directly in a role (#/app/<role>)
const ROLE_USERS = {
  advisor: { id: 'usr_advisor_1', name: 'Sarah Jenkins', role: 'advisor', email: 'advisor@futuretech.com' },
  technician: { id: 'usr_tech_1', name: 'Marcus Vance', role: 'technician', specialty: 'Master Diagnostics', email: 'tech@futuretech.com' },
  manager: { id: 'usr_manager_1', name: 'Dave Reynolds', role: 'manager', email: 'manager@futuretech.com' },
  customer: { id: 'usr_cust_1', name: 'Elena Rostova', role: 'customer', email: 'customer@futuretech.com' }
};

export const ShopProvider = ({ children, initialRole = 'advisor' }) => {
  const [currentUser, setCurrentUser] = useState(() => ROLE_USERS[initialRole] || ROLE_USERS.advisor);
  
  const [repairOrders, setRepairOrders] = useState([]);
  const [selectedRoId, setSelectedRoId] = useState(null);
  const [selectedRO, setSelectedRO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [scanToolStatus, setScanToolStatus] = useState({ connected: true, device: 'AutoMind OBD-Pro Link' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchROs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getRepairOrders();
      if (res.success) {
        setRepairOrders(res.repairOrders);
        if (!selectedRoId && res.repairOrders.length > 0) {
          setSelectedRoId(res.repairOrders[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load ROs:', err);
      setError('Could not connect to backend server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedRoId]);

  const fetchSelectedRO = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await api.getRepairOrderById(id);
      if (res.success) {
        setSelectedRO(res.repairOrder);
      }
    } catch (err) {
      console.error('Failed to fetch detailed RO:', err);
    }
  }, []);

  useEffect(() => {
    fetchROs();
  }, [fetchROs]);

  useEffect(() => {
    if (selectedRoId) {
      fetchSelectedRO(selectedRoId);
    }
  }, [selectedRoId, fetchSelectedRO]);

  // Switch role seamlessly
  const switchRole = async (role) => {
    try {
      const res = await api.login(null, null, role);
      if (res.success) {
        setCurrentUser(res.user);
        showToast(`Switched view to ${res.user.role.toUpperCase()} (${res.user.name})`, 'info');
      }
    } catch (err) {
      // Fallback local switch
      if (ROLE_USERS[role]) {
        setCurrentUser(ROLE_USERS[role]);
        showToast(`Switched view to ${role.toUpperCase()}`, 'info');
      }
    }
  };

  return (
    <ShopContext.Provider
      value={{
        currentUser,
        switchRole,
        repairOrders,
        selectedRoId,
        setSelectedRoId,
        selectedRO,
        fetchROs,
        fetchSelectedRO,
        loading,
        error,
        toast,
        showToast,
        scanToolStatus,
        setScanToolStatus
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
