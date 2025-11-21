// frontend/src/hooks/useQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { kycAPI, cyclesAPI, accountsAPI, payoutsAPI, loadAllKycsWithRelations } from '../services/api';
import { toast } from 'react-toastify';

// KYC Queries
export function useKycsQuery() {
  return useQuery({
    queryKey: queryKeys.kycs.all,
    queryFn: loadAllKycsWithRelations,
  });
}

export function useKycQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.kycs.detail(id),
    queryFn: () => kycAPI.getById(id),
    enabled: !!id,
  });
}

// KYC Mutations
export function useCreateKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kycAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      toast.success('KYC creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear KYC');
    },
  });
}

export function useUpdateKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => kycAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      toast.success('KYC actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar KYC');
    },
  });
}

export function useDeleteKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kycAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      toast.success('KYC eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar KYC');
    },
  });
}

// Cycles Queries
export function useCyclesQuery() {
  return useQuery({
    queryKey: queryKeys.cycles.all,
    queryFn: cyclesAPI.getAll,
  });
}

export function useCycleQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.cycles.detail(id),
    queryFn: () => cyclesAPI.getById(id),
    enabled: !!id,
  });
}

// Cycles Mutations
export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cyclesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
      toast.success('Ciclo creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear ciclo');
    },
  });
}

export function useUpdateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cyclesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
      toast.success('Ciclo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar ciclo');
    },
  });
}

export function useDeleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cyclesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
      toast.success('Ciclo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar ciclo');
    },
  });
}

// Accounts Mutations
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kycId, data }: { kycId: string; data: any }) => accountsAPI.create(kycId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Cuenta creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear cuenta');
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => accountsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Cuenta actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar cuenta');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Cuenta eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar cuenta');
    },
  });
}

// Payouts Mutations
export function useCreatePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kycId, data }: { kycId: string; data: any }) => payoutsAPI.create(kycId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all });
      toast.success('Payout creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear payout');
    },
  });
}

export function useUpdatePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => payoutsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all });
      toast.success('Payout actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar payout');
    },
  });
}

export function useDeletePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payoutsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all });
      toast.success('Payout eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar payout');
    },
  });
}
