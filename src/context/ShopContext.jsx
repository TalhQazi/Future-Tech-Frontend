import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

const ShopContext = createContext(null);

const ROLE_USERS = {
  advisor: { id: 'usr_advisor_1', name: 'Service Advisor', role: 'advisor', email: 'advisor@futuretech.com' },
  technician: { id: 'usr_tech_1', name: 'Master Technician', role: 'technician', specialty: 'Master Diagnostics / High Voltage', email: 'tech@futuretech.com' },
  manager: { id: 'usr_manager_1', name: 'Shop Manager', role: 'manager', email: 'manager@futuretech.com' },
  parts: { id: 'usr_parts_1', name: 'Parts Specialist', role: 'parts', specialty: 'Parts Specialist & Catalog Manager', email: 'parts@futuretech.com' },
  accounting: { id: 'usr_acct_1', name: 'Billing Controller', role: 'accounting', specialty: 'Shop Controller & Billing', email: 'accounting@futuretech.com' },
  admin: { id: 'usr_admin_1', name: 'Corporate Admin', role: 'admin', email: 'admin@futuretech.com' },
  customer: { id: 'usr_cust_1', name: 'Customer User', role: 'customer', email: 'customer@futuretech.com' }
};

export const ShopProvider = ({ children, initialRole = 'advisor' }) => {
  const [currentUser, setCurrentUser] = useState(() => ROLE_USERS[initialRole] || ROLE_USERS.advisor);
  
  const [repairOrders, setRepairOrders] = useState([]);
  const [selectedRoId, setSelectedRoId] = useState(null);
  const [selectedRO, setSelectedRO] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [scanToolStatus, setScanToolStatus] = useState({ 
    connected: true, 
    device: 'AutoMind OBD-Pro Link (CAN-FD)',
    protocol: 'CAN Bus ISO 11898-1',
    voltage: 14.1
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchROs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getRepairOrders();
      if (res.success && res.repairOrders) {
        setRepairOrders(res.repairOrders);
        if (!selectedRoId && res.repairOrders.length > 0) {
          setSelectedRoId(res.repairOrders[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load ROs:', err.message);
      setError('Could not connect to backend server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedRoId]);

  const fetchSelectedRO = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await api.getRepairOrderById(id);
      if (res.success && res.repairOrder) {
        setSelectedRO(res.repairOrder);
      }
    } catch (err) {
      console.warn('Failed to fetch detailed RO:', err.message);
    }
  }, []);

  const fetchGlobalData = useCallback(async () => {
    try {
      const [custRes, vehRes, aptRes, invRes, locRes, usersRes] = await Promise.all([
        api.searchCustomers('').catch(() => ({ customers: [] })),
        api.searchVehicles('').catch(() => ({ vehicles: [] })),
        api.getAppointments().catch(() => ({ appointments: [] })),
        api.getInventory().catch(() => ({ inventory: [] })),
        api.getLocations().catch(() => ({ locations: [] })),
        api.getUsers().catch(() => ({ users: [] }))
      ]);

      if (custRes.customers) setCustomers(custRes.customers);
      if (vehRes.vehicles) setVehicles(vehRes.vehicles);
      if (aptRes.appointments) setAppointments(aptRes.appointments);
      if (invRes.inventory) setInventory(invRes.inventory);
      if (locRes.locations) {
        setLocations(locRes.locations);
        if (locRes.locations.length > 0) setActiveLocation(locRes.locations[0]);
      }
      if (usersRes.users && usersRes.users.length > 0) {
        const matchingUser = usersRes.users.find(u => u.role === initialRole) || usersRes.users.find(u => u.role === 'advisor') || usersRes.users[0];
        if (matchingUser) setCurrentUser(matchingUser);
      }
    } catch (err) {
      console.warn('Failed loading auxiliary shop data:', err.message);
    }
  }, [initialRole]);

  useEffect(() => {
    fetchROs();
    fetchGlobalData();
  }, [fetchROs, fetchGlobalData]);

  useEffect(() => {
    if (selectedRoId) {
      fetchSelectedRO(selectedRoId);
    }
  }, [selectedRoId, fetchSelectedRO]);

  // Switch role seamlessly
  const switchRole = async (role) => {
    try {
      const res = await api.login(null, null, role);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        showToast(`Switched view to ${res.user.role.toUpperCase()} (${res.user.name})`, 'info');
      }
    } catch (err) {
      if (ROLE_USERS[role]) {
        setCurrentUser(ROLE_USERS[role]);
        showToast(`Switched view to ${role.toUpperCase()} (${ROLE_USERS[role].name})`, 'info');
      }
    }
  };

  const selectRO = useCallback((ro) => {
    if (!ro) return;
    const id = typeof ro === 'string' ? ro : ro.id;
    setSelectedRoId(id);
    if (typeof ro === 'object' && ro.id) {
      setSelectedRO(ro);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchROs();
    if (selectedRoId) fetchSelectedRO(selectedRoId);
    fetchGlobalData();
  }, [fetchROs, fetchSelectedRO, fetchGlobalData, selectedRoId]);

  return (
    <ShopContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        repairOrders,
        setRepairOrders,
        selectedRoId,
        setSelectedRoId,
        selectedRO,
        setSelectedRO,
        selectRO,
        customers,
        vehicles,
        appointments,
        inventory,
        locations,
        activeLocation,
        setActiveLocation,
        fetchROs,
        fetchSelectedRO,
        refreshAll,
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
