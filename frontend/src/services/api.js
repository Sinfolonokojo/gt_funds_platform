// frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Helper para convertir documentos de MongoDB
const convertDocument = (doc) => {
  if (doc._id) {
    return { ...doc, id: doc._id };
  }
  return doc;
};

// Helper para convertir arrays de documentos
const convertDocuments = (docs) => {
  return docs.map(convertDocument);
};

// ============================================
// KYC API
// ============================================
export const kycAPI = {
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/kycs/`);
    // Handle paginated response - extract data array
    const docs = response.data.data || response.data;
    return convertDocuments(docs);
  },

  getById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/kycs/${id}`);
    return convertDocument(response.data);
  },

  create: async (kycData) => {
    const response = await axios.post(`${API_BASE_URL}/kycs/`, kycData);
    return convertDocument(response.data);
  },

  update: async (id, kycData) => {
    const response = await axios.put(`${API_BASE_URL}/kycs/${id}`, kycData);
    return convertDocument(response.data);
  },

  delete: async (id) => {
    await axios.delete(`${API_BASE_URL}/kycs/${id}`);
  }
};

// ============================================
// Cycles API
// ============================================
export const cyclesAPI = {
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/cycles/`);
    return convertDocuments(response.data);
  },

  getById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/cycles/${id}`);
    return convertDocument(response.data);
  },

  getDashboard: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/cycles/${id}/dashboard`);
    return response.data;
  },

  create: async (cycleData) => {
    const response = await axios.post(`${API_BASE_URL}/cycles/`, cycleData);
    return convertDocument(response.data);
  },

  update: async (id, cycleData) => {
    const response = await axios.put(`${API_BASE_URL}/cycles/${id}`, cycleData);
    return convertDocument(response.data);
  },

  delete: async (id) => {
    await axios.delete(`${API_BASE_URL}/cycles/${id}`);
  },

  getStatistics: async () => {
    const response = await axios.get(`${API_BASE_URL}/cycles/statistics/historical`);
    return response.data;
  }
};

// ============================================
// Trading Accounts API
// ============================================
export const accountsAPI = {
  // Obtener todas las cuentas de un KYC
  getAllByKyc: async (kycId) => {
    const response = await axios.get(`${API_BASE_URL}/kycs/${kycId}/accounts/`);
    return convertDocuments(response.data);
  },

  // Obtener una cuenta específica
  getById: async (accountId) => {
    const response = await axios.get(`${API_BASE_URL}/accounts/${accountId}`);
    return convertDocument(response.data);
  },

  // Crear cuenta (anidada bajo KYC)
  create: async (kycId, accountData) => {
    const response = await axios.post(`${API_BASE_URL}/kycs/${kycId}/accounts/`, accountData);
    return convertDocument(response.data);
  },

  // Actualizar cuenta
  update: async (accountId, accountData) => {
    const response = await axios.put(`${API_BASE_URL}/accounts/${accountId}`, accountData);
    return convertDocument(response.data);
  },

  // Eliminar cuenta
  delete: async (accountId) => {
    await axios.delete(`${API_BASE_URL}/accounts/${accountId}`);
  }
};

// ============================================
// Payouts API
// ============================================
export const payoutsAPI = {
  // Obtener todos los payouts de un KYC
  getAllByKyc: async (kycId) => {
    const response = await axios.get(`${API_BASE_URL}/kycs/${kycId}/payouts/`);
    return convertDocuments(response.data);
  },

  // Obtener un payout específico
  getById: async (payoutId) => {
    const response = await axios.get(`${API_BASE_URL}/payouts/${payoutId}`);
    return convertDocument(response.data);
  },

  // Crear payout (anidado bajo KYC)
  create: async (kycId, payoutData) => {
    const response = await axios.post(`${API_BASE_URL}/kycs/${kycId}/payouts/`, payoutData);
    return convertDocument(response.data);
  },

  // Actualizar payout
  update: async (payoutId, payoutData) => {
    const response = await axios.put(`${API_BASE_URL}/payouts/${payoutId}`, payoutData);
    return convertDocument(response.data);
  },

  // Eliminar payout
  delete: async (payoutId) => {
    await axios.delete(`${API_BASE_URL}/payouts/${payoutId}`);
  }
};

// ============================================
// Tiros API
// ============================================
export const tirosAPI = {
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/tiros/`);
    return convertDocuments(response.data);
  },

  getByCycle: async (cycleId) => {
    const response = await axios.get(`${API_BASE_URL}/tiros/cycle/${cycleId}`);
    return convertDocuments(response.data);
  },

  getById: async (tiroId) => {
    const response = await axios.get(`${API_BASE_URL}/tiros/${tiroId}`);
    return convertDocument(response.data);
  },

  create: async (tiroData) => {
    const response = await axios.post(`${API_BASE_URL}/tiros/`, tiroData);
    return convertDocument(response.data);
  },

  update: async (tiroId, tiroData) => {
    const response = await axios.put(`${API_BASE_URL}/tiros/${tiroId}`, tiroData);
    return convertDocument(response.data);
  },

  delete: async (tiroId) => {
    await axios.delete(`${API_BASE_URL}/tiros/${tiroId}`);
  }
};

// ============================================
// Helper para cargar datos completos de KYC
// ============================================
export const loadKycWithRelations = async (kycId) => {
  try {
    const [kyc, accounts, payouts] = await Promise.all([
      kycAPI.getById(kycId),
      accountsAPI.getAllByKyc(kycId),
      payoutsAPI.getAllByKyc(kycId)
    ]);

    return {
      ...kyc,
      accounts,
      payouts
    };
  } catch (error) {
    console.error(`Error loading KYC ${kycId} with relations:`, error);
    throw error;
  }
};

// ============================================
// Helper para cargar todos los KYCs con sus relaciones
// ============================================
export const loadAllKycsWithRelations = async () => {
  try {
    const kycs = await kycAPI.getAll();
    
    const kycsWithRelations = await Promise.all(
      kycs.map(async (kyc) => {
        try {
          const [accounts, payouts] = await Promise.all([
            accountsAPI.getAllByKyc(kyc.id),
            payoutsAPI.getAllByKyc(kyc.id)
          ]);
          return { ...kyc, accounts, payouts };
        } catch (error) {
          console.error(`Error loading relations for KYC ${kyc.id}:`, error);
          return { ...kyc, accounts: [], payouts: [] };
        }
      })
    );

    return kycsWithRelations;
  } catch (error) {
    console.error('Error loading KYCs with relations:', error);
    throw error;
  }
};

// ============================================
// Investors API
// ============================================
export const investorsAPI = {
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/investors/`);
    return convertDocuments(response.data);
  },

  getById: async (investorId) => {
    const response = await axios.get(`${API_BASE_URL}/investors/${investorId}`);
    return convertDocument(response.data);
  },

  create: async (investorData) => {
    const response = await axios.post(`${API_BASE_URL}/investors/`, investorData);
    return convertDocument(response.data);
  },

  update: async (investorId, investorData) => {
    const response = await axios.put(`${API_BASE_URL}/investors/${investorId}`, investorData);
    return convertDocument(response.data);
  },

  delete: async (investorId) => {
    await axios.delete(`${API_BASE_URL}/investors/${investorId}`);
  },

  // Gestión de inversiones
  addInvestment: async (investorId, investmentData) => {
    const response = await axios.post(`${API_BASE_URL}/investors/${investorId}/investments`, investmentData);
    return convertDocument(response.data);
  },

  getInvestments: async (investorId) => {
    const response = await axios.get(`${API_BASE_URL}/investors/${investorId}/investments`);
    return response.data;
  }
};

export default {
  kycAPI,
  cyclesAPI,
  accountsAPI,
  payoutsAPI,
  tirosAPI,
  investorsAPI,
  loadKycWithRelations,
  loadAllKycsWithRelations
};