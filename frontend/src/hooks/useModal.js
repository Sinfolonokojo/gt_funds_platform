// frontend/src/hooks/useModal.js

import { useState } from 'react';

/**
 * Custom hook para gestionar el estado del modal
 * @returns {Object} Estado y funciones del modal
 */
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [parentContext, setParentContext] = useState(null); // Para KYC o Cycle padre

  /**
   * Abre el modal con los parámetros especificados
   * @param {string} type - Tipo de modal (kyc, account, cycle, etc.)
   * @param {Object|null} item - Item a editar (null para crear nuevo)
   * @param {Object|null} parent - Contexto padre (ej: KYC para crear una cuenta)
   */
  const openModal = (type, item = null, parent = null) => {
    setModalType(type);
    setEditingItem(item);
    setParentContext(parent);
    setIsOpen(true);
  };

  /**
   * Cierra el modal y limpia el estado
   */
  const closeModal = () => {
    setIsOpen(false);
    setModalType('');
    setEditingItem(null);
    setParentContext(null);
  };

  return {
    isOpen,
    modalType,
    editingItem,
    parentContext,
    openModal,
    closeModal
  };
};

export default useModal;