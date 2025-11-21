// frontend/src/types/index.ts

// KYC Types
export interface KYC {
  id: string;
  name: string;
  phone: string;
  email: string;
  creditCard?: string;
  address?: string;
  status: boolean;
  dashboardEnabled: boolean;
  submittedDate: string;
  accounts: TradingAccount[];
  payouts: Payout[];
}

export interface KYCCreate {
  name: string;
  phone: string;
  email: string;
  creditCard?: string;
  address?: string;
  status?: boolean;
  dashboardEnabled?: boolean;
}

// Trading Account Types
export interface TradingAccount {
  id: string;
  kycId: string;
  accountNumber: string;
  propFirm: string;
  accountSize: number;
  cost: number;
  phase: 'fase1' | 'fase2' | 'real' | 'quemada';
  status: 'Pending' | 'Active' | 'Burned';
  cycleId?: string;
  login?: string;
  password?: string;
  server?: string;
}

export interface TradingAccountCreate {
  accountNumber: string;
  propFirm: string;
  accountSize: number;
  cost: number;
  phase?: string;
  status?: string;
  cycleId?: string;
  login?: string;
  password?: string;
  server?: string;
}

// Payout Types
export interface Payout {
  id: string;
  kycId: string;
  amount: number;
  payoutDate: string;
}

export interface PayoutCreate {
  amount: number;
}

// Cycle Types
export interface Cycle {
  id: string;
  name: string;
  status: 'Activo' | 'Completado' | 'Cancelado';
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface CycleCreate {
  name: string;
  status?: string;
  startDate?: string;
  description?: string;
}

// Investor Types
export interface Investment {
  cycleId: string;
  cycleName: string;
  amount: number;
  status: string;
  profitShare: number;
}

export interface Investor {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalInvested: number;
  investments: Investment[];
}

export interface InvestorCreate {
  name: string;
  email: string;
  phone: string;
}

// Tiro Types
export interface TiroLeg {
  accountId: string;
  lots: number;
  direction: 'buy' | 'sell';
}

export interface Tiro {
  id: string;
  cycleId: string;
  symbol: string;
  leg1: TiroLeg;
  leg2: TiroLeg;
  status: 'Pending' | 'Active' | 'Closed';
  profit?: number;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalAUM: number;
  totalAccounts: number;
  totalKycs: number;
  totalCycles: number;
}

// API Response Types
export interface ApiError {
  detail: string;
  status?: number;
}

// Modal Types
export type ModalType = 'kyc' | 'account' | 'payout' | null;

export interface ModalState {
  isOpen: boolean;
  modalType: ModalType;
  editingItem: KYC | TradingAccount | Payout | null;
  parentContext: KYC | null;
}
