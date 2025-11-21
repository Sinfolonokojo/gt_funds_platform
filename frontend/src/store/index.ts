// frontend/src/store/index.ts

import { create } from 'zustand';
import { KYC, Cycle, DashboardStats } from '../types';
import { cyclesAPI, loadAllKycsWithRelations } from '../services/api';

interface AppState {
  // Data
  kycs: KYC[];
  cycles: Cycle[];
  loading: boolean;
  error: string | null;

  // Actions
  setKycs: (kycs: KYC[]) => void;
  setCycles: (cycles: Cycle[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchAllData: () => Promise<void>;
  reloadKycs: () => Promise<void>;
  reloadCycles: () => Promise<void>;

  // Computed
  getStats: () => DashboardStats;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  kycs: [],
  cycles: [],
  loading: true,
  error: null,

  // Setters
  setKycs: (kycs) => set({ kycs }),
  setCycles: (cycles) => set({ cycles }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch all data
  fetchAllData: async () => {
    set({ loading: true, error: null });
    try {
      const [kycData, cycleData] = await Promise.all([
        loadAllKycsWithRelations(),
        cyclesAPI.getAll()
      ]);
      set({ kycs: kycData, cycles: cycleData, loading: false });
    } catch (error) {
      console.error('Error al cargar los datos iniciales:', error);
      set({ error: 'Error al cargar los datos', loading: false });
    }
  },

  // Reload KYCs
  reloadKycs: async () => {
    try {
      const kycData = await loadAllKycsWithRelations();
      set({ kycs: kycData });
    } catch (error) {
      console.error('Error al recargar KYCs:', error);
      set({ error: 'Error al recargar KYCs' });
    }
  },

  // Reload Cycles
  reloadCycles: async () => {
    try {
      const cycleData = await cyclesAPI.getAll();
      set({ cycles: cycleData });
    } catch (error) {
      console.error('Error al recargar Cycles:', error);
      set({ error: 'Error al recargar Cycles' });
    }
  },

  // Computed stats
  getStats: () => {
    const { kycs, cycles } = get();

    const totalAUM = kycs.reduce((total, kyc) => {
      const accountsArray = Array.isArray(kyc.accounts) ? kyc.accounts : [];
      const kycAum = accountsArray.reduce((sum, acc) => sum + (acc.accountSize || 0), 0);
      return total + kycAum;
    }, 0);

    const totalAccounts = kycs.reduce((sum, kyc) => {
      const accountsArray = Array.isArray(kyc.accounts) ? kyc.accounts : [];
      return sum + accountsArray.length;
    }, 0);

    return {
      totalAUM,
      totalAccounts,
      totalKycs: kycs.length,
      totalCycles: cycles.length
    };
  }
}));

// Selector hooks for better performance
export const useKycs = () => useStore((state) => state.kycs);
export const useCycles = () => useStore((state) => state.cycles);
export const useLoading = () => useStore((state) => state.loading);
export const useError = () => useStore((state) => state.error);
export const useStats = () => useStore((state) => state.getStats());
