// frontend/src/hooks/useApi.ts

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ApiError } from '../types';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      setData(result);

      if (options.successMessage) {
        toast.success(options.successMessage);
      }

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (err: any) {
      const apiError: ApiError = {
        detail: err.response?.data?.detail || err.message || 'An error occurred',
        status: err.response?.status
      };

      setError(apiError);

      const errorMsg = options.errorMessage || apiError.detail;
      toast.error(errorMsg);

      if (options.onError) {
        options.onError(apiError);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Simplified hook for mutations (create, update, delete)
export function useMutation<T = any>(
  mutationFn: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  return useApi(mutationFn, options);
}

// Hook for queries with automatic execution
export function useQuery<T = any>(
  queryFn: () => Promise<T>,
  options: UseApiOptions & { enabled?: boolean } = {}
) {
  const api = useApi(queryFn, options);

  // Auto-execute on mount if enabled
  // Note: For auto-execution, use useEffect in the component

  return api;
}

export default useApi;
