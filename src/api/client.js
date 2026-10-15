const API_BASE = 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('ft_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('ft_token', token);
    } else {
      localStorage.removeItem('ft_token');
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

  // Auth
  async login(email, password, role) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async getUsers() {
    return this.request('/auth/users');
  }

  // Repair Orders
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

  async assignTechnician(id, techId) {
    return this.request(`/repair-orders/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ techId })
    });
  }

  // Customers & Vehicles
  async searchCustomers(query) {
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

  async searchVehicles(query) {
    return this.request(`/vehicles?q=${encodeURIComponent(query || '')}`);
  }

  async getVehicleByVin(vin) {
    return this.request(`/vehicles/vin/${vin}`);
  }

  async createVehicle(payload) {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Inspection
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

  // FutureTech Diagnostics
  async getDiagnostics(roId) {
    return this.request(`/futuretech/ro/${roId}`);
  }

  async updateDiagnostics(roId, payload) {
    return this.request(`/futuretech/ro/${roId}`, {
      method: 'PUT',
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

  // Estimates
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

  // Parts
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

  // Invoice & Payment
  async getInvoice(roId) {
    return this.request(`/invoices/ro/${roId}`);
  }

  async processPayment(roId, payload) {
    return this.request(`/invoices/ro/${roId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

export const api = new ApiClient();
