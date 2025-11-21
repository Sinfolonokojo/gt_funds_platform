// frontend/src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,

      // Retry failed requests 3 times
      retry: 3,

      // Don't refetch on window focus in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys for type-safe cache invalidation
export const queryKeys = {
  kycs: {
    all: ['kycs'] as const,
    list: (params?: { skip?: number; limit?: number; search?: string }) =>
      ['kycs', 'list', params] as const,
    detail: (id: string) => ['kycs', 'detail', id] as const,
  },
  cycles: {
    all: ['cycles'] as const,
    list: () => ['cycles', 'list'] as const,
    detail: (id: string) => ['cycles', 'detail', id] as const,
    dashboard: (id: string) => ['cycles', 'dashboard', id] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    byKyc: (kycId: string) => ['accounts', 'byKyc', kycId] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
  },
  payouts: {
    all: ['payouts'] as const,
    byKyc: (kycId: string) => ['payouts', 'byKyc', kycId] as const,
    detail: (id: string) => ['payouts', 'detail', id] as const,
  },
  investors: {
    all: ['investors'] as const,
    list: () => ['investors', 'list'] as const,
    detail: (id: string) => ['investors', 'detail', id] as const,
  },
  tiros: {
    all: ['tiros'] as const,
    list: () => ['tiros', 'list'] as const,
    byCycle: (cycleId: string) => ['tiros', 'byCycle', cycleId] as const,
  },
};

export default queryClient;
