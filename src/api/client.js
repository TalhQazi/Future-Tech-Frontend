const API_BASE = import.meta.env.VITE_API_URL || 'https://future-tech-backend-blush.vercel.app/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('ft_token') || null;
    this.refreshToken = localStorage.getItem('ft_refresh_token') || null;
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    if (token) {
      localStorage.setItem('ft_token', token);
    } else {
      localStorage.removeItem('ft_token');
    }

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('ft_refresh_token', refreshToken);
    } else if (refreshToken === null && !token) {
      this.refreshToken = null;
      localStorage.removeItem('ft_refresh_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle token expiration: attempt automatic silent refresh
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: this.refreshToken })
          });
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.token) {
            this.setToken(refreshData.token, refreshData.refreshToken);
            headers['Authorization'] = `Bearer ${refreshData.token}`;
            const retryRes = await fetch(url, { ...options, headers });
            return await retryRes.json();
          }
        } catch (e) {
          console.warn('Silent token refresh failed:', e.message);
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[API Client Error on ${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Auth & Identity
  async login(email, password, role, mfaCode) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, mfaCode })
    });
    if (data.token) {
      this.setToken(data.token, data.refreshToken);
    }
    return data;
  }

  async verifyMfa(userId, code) {
    return this.request('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ userId, code })
    });
  }

  async setupMfa() {
    return this.request('/auth/mfa/setup', { method: 'POST' });
  }

  async logout() {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });
      }
    } finally {
      this.setToken(null, null);
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async getUsers() {
    return this.request('/auth/users');
  }

  // Repair Orders (Live Kanban & Dispatch)
  async getRepairOrders(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/repair-orders?${query}`);
  }

  async getRepairOrderById(id) {
    return this.request(`/repair-orders/${id}`);
  }

  async createRepairOrder(payload) {
    return this.request('/repair-orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateROStatus(id, status, bayNumber, assignedTechId) {
    return this.request(`/repair-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, bayNumber, assignedTechId })
    });
  }

  async assignTechnician(id, techId, bayNumber) {
    return this.request(`/repair-orders/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ techId, bayNumber })
    });
  }

  async qcSignOff(id, payload = {}) {
    return this.request(`/repair-orders/${id}/qc-signoff`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async flagSafetyEscalation(id, payload) {
    return this.request(`/repair-orders/${id}/safety-escalation`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Customers & Vehicles
  async searchCustomers(query = '') {
    return this.request(`/customers?q=${encodeURIComponent(query || '')}`);
  }

  async getCustomerById(id) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(payload) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateCustomerMembership(id, tier, status) {
    return this.request(`/customers/${id}/membership`, {
      method: 'PUT',
      body: JSON.stringify({ tier, status })
    });
  }

  async searchVehicles(query = '') {
    return this.request(`/vehicles?q=${encodeURIComponent(query || '')}`);
  }

  async getVehicleByVin(vin) {
    return this.request(`/vehicles/vin/${vin}`);
  }

  async getVehicleById(id) {
    return this.request(`/vehicles/${id}`);
  }

  async getVehicleHistory(id) {
    return this.request(`/vehicles/${id}/history`);
  }

  async decodeVin(vin) {
    return this.request(`/vehicles/decode-vin/${encodeURIComponent(vin)}`);
  }

  async createVehicle(payload) {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Appointments & Capacity
  async getAppointments(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/appointments?${query}`);
  }

  async getBayCapacity(date = '') {
    return this.request(`/appointments/capacity?date=${encodeURIComponent(date || '')}`);
  }

  async createAppointment(payload) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateAppointmentStatus(id, status, roId) {
    return this.request(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, roId })
    });
  }

  // Locations & Bay Management
  async getLocations() {
    return this.request('/locations');
  }

  async getLocationById(id) {
    return this.request(`/locations/${id}`);
  }

  async getLocationBays(id) {
    return this.request(`/locations/${id}/bays`);
  }

  async updateLocation(id, payload) {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  // Digital Vehicle Inspection (DVI)
  async getInspection(roId) {
    return this.request(`/inspections/ro/${roId}`);
  }

  async updateInspectionItem(roId, itemId, payload) {
    return this.request(`/inspections/ro/${roId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async completeInspection(roId) {
    return this.request(`/inspections/ro/${roId}/complete`, {
      method: 'POST'
    });
  }

  // Commercial Versioned Estimates
  async getEstimate(roId) {
    return this.request(`/estimates/ro/${roId}`);
  }

  async saveEstimate(roId, lines, status) {
    return this.request(`/estimates/ro/${roId}`, {
      method: 'POST',
      body: JSON.stringify({ lines, status })
    });
  }

  async updateLineApproval(roId, lineId, approved, signature) {
    return this.request(`/estimates/ro/${roId}/line-approval`, {
      method: 'PUT',
      body: JSON.stringify({ lineId, approved, signature })
    });
  }

  async approveAllEstimate(roId, signature) {
    return this.request(`/estimates/ro/${roId}/approve-all`, {
      method: 'POST',
      body: JSON.stringify({ signature })
    });
  }

  // Parts Warehouse & Inventory
  async getInventory(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/inventory?${query}`);
  }

  async adjustStock(id, payload) {
    return this.request(`/inventory/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getFailureIntelligence() {
    return this.request('/inventory/failure-intelligence');
  }

  async getParts(roId) {
    return this.request(`/parts/ro/${roId}`);
  }

  async requestPart(payload) {
    return this.request('/parts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updatePartStatus(partId, status) {
    return this.request(`/parts/${partId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Invoice & PCI Payments
  async getInvoices(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/invoices?${query}`);
  }

  async getInvoice(roId) {
    return this.request(`/invoices/ro/${roId}`);
  }

  async processPayment(roId, payload) {
    return this.request(`/invoices/ro/${roId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async postInvoiceAdjustment(roId, payload) {
    return this.request(`/invoices/ro/${roId}/adjustment`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // FutureTech Diagnostics & AutoMind Hardware Adapter
  async getAutoMindStatus() {
    return this.request('/futuretech/automind/status');
  }

  async getDiagnostics(roId) {
    return this.request(`/futuretech/ro/${roId}`);
  }

  async updateDiagnostics(roId, payload) {
    return this.request(`/futuretech/ro/${roId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async addDtc(roId, payload) {
    return this.request(`/futuretech/ro/${roId}/dtc`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async clearDtcs(roId) {
    return this.request(`/futuretech/ro/${roId}/dtc/clear`, {
      method: 'POST'
    });
  }

  async runActuatorTest(roId, payload) {
    return this.request(`/futuretech/ro/${roId}/actuator-test`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async evaluateSpec(roId, payload) {
    return this.request(`/futuretech/ro/${roId}/spec-eval`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateGuidedCheck(roId, checkId, payload) {
    return this.request(`/futuretech/ro/${roId}/guided-checks/${checkId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async addGuidedCheck(roId, payload) {
    return this.request(`/futuretech/ro/${roId}/guided-checks`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async simulateScan(roId) {
    return this.request(`/futuretech/ro/${roId}/simulate-scan`, {
      method: 'POST'
    });
  }

  // Interactive Wiring Diagrams
  async getWiringDiagrams(make = '', model = '') {
    return this.request(`/wiring?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
  }

  async getWiringDiagramById(id) {
    return this.request(`/wiring/${id}`);
  }

  // Confirmed Fixes
  async getConfirmedFixes(query = '', dtc = '') {
    return this.request(`/confirmed-fixes?q=${encodeURIComponent(query)}&dtc=${encodeURIComponent(dtc)}`);
  }

  async submitConfirmedFix(payload) {
    return this.request('/confirmed-fixes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Technician Forum
  async getForumThreads(category = '', tag = '') {
    return this.request(`/forum?category=${encodeURIComponent(category)}&tag=${encodeURIComponent(tag)}`);
  }

  async getForumThreadById(id) {
    return this.request(`/forum/${id}`);
  }

  async createForumThread(payload) {
    return this.request('/forum', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async replyForumThread(id, payload) {
    return this.request(`/forum/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async upvoteForumThread(id) {
    return this.request(`/forum/${id}/upvote`, {
      method: 'POST'
    });
  }

  // Fuel Tracking & Anomalies
  async getFuelLogs(vehicleId) {
    return this.request(`/fuel/vehicle/${vehicleId}`);
  }

  async addFuelLog(payload) {
    return this.request('/fuel', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Memberships & Service Riders
  async getMembershipPlans() {
    return this.request('/memberships/plans');
  }

  async getMembershipRiders() {
    return this.request('/memberships/riders');
  }

  async getCustomerEntitlements(customerId) {
    return this.request(`/memberships/customer/${customerId}/entitlements`);
  }

  async upgradeMembership(customerId, tier, riderIds) {
    return this.request(`/memberships/customer/${customerId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ tier, riderIds })
    });
  }

  // Communication & 2-Way Messages
  async getMessages(customerId, roId) {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (roId) params.append('roId', roId);
    return this.request(`/messages?${params.toString()}`);
  }

  async sendMessage(payload) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Governed AI Intelligence
  async getAiLogs() {
    return this.request('/ai/logs');
  }

  async invokeServiceWriter(roId) {
    return this.request('/ai/service-writer', {
      method: 'POST',
      body: JSON.stringify({ roId })
    });
  }

  async reviewAiOutput(executionId, approved, overrideNotes, reviewedBy) {
    return this.request('/ai/review-override', {
      method: 'POST',
      body: JSON.stringify({ executionId, approved, overrideNotes, reviewedBy })
    });
  }

  async getPredictiveAnalysis(vehicleId) {
    return this.request('/ai/predictive-analysis', {
      method: 'POST',
      body: JSON.stringify({ vehicleId })
    });
  }

  // Reports & Analytics
  async getAnalyticsDashboard() {
    return this.request('/analytics/dashboard');
  }

  // System Audit Logs
  async getAuditLogs(limit = 100, eventType = '') {
    return this.request(`/audit?limit=${limit}&eventType=${encodeURIComponent(eventType)}`);
  }
}

export const api = new ApiClient();
