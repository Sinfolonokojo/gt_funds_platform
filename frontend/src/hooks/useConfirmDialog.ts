// frontend/src/hooks/useConfirmDialog.ts

import { useState, useCallback } from 'react';

interface ConfirmDialogState<T = any> {
  isOpen: boolean;
  title: string;
  message: string;
  item: T | null;
  onConfirm: (() => Promise<void> | void) | null;
}

interface UseConfirmDialogReturn<T = any> {
  dialogState: ConfirmDialogState<T>;
  openDialog: (options: {
    title: string;
    message: string;
    item?: T;
    onConfirm: () => Promise<void> | void;
  }) => void;
  closeDialog: () => void;
  confirm: () => Promise<void>;
}

export function useConfirmDialog<T = any>(): UseConfirmDialogReturn<T> {
  const [dialogState, setDialogState] = useState<ConfirmDialogState<T>>({
    isOpen: false,
    title: '',
    message: '',
    item: null,
    onConfirm: null
  });

  const openDialog = useCallback((options: {
    title: string;
    message: string;
    item?: T;
    onConfirm: () => Promise<void> | void;
  }) => {
    setDialogState({
      isOpen: true,
      title: options.title,
      message: options.message,
      item: options.item || null,
      onConfirm: options.onConfirm
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false,
      item: null,
      onConfirm: null
    }));
  }, []);

  const confirm = useCallback(async () => {
    if (dialogState.onConfirm) {
      await dialogState.onConfirm();
    }
    closeDialog();
  }, [dialogState.onConfirm, closeDialog]);

  return {
    dialogState,
    openDialog,
    closeDialog,
    confirm
  };
}

export default useConfirmDialog;
