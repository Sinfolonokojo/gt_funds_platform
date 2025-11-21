// frontend/src/pages/KYCPage.jsx

import React, { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import SearchBox from '../components/shared/SearchBox';
import KycList from '../components/kyc/KycList';
import KycDetailPanel from '../components/kyc/KycDetailPanel';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { kycAPI, accountsAPI, payoutsAPI } from '../services/api';
import { useModal } from '../hooks/useModal';
import { toast } from 'react-toastify';

function KYCPage({ kycs, cycles, onReload }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { isOpen, modalType, editingItem, parentContext, openModal, closeModal } = useModal();

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'kyc', 'account', 'payout'
    item: null,
    kycId: null
  });

  const filteredKycs = kycs.filter(k =>
    k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Wrapper para cerrar modal y resetear estado de password
  const handleCloseModal = () => {
    setShowPassword(false);
    closeModal();
  };

  // Manejar submit de formularios (KYC, Account, Payout)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      if (modalType === 'kyc') {
        const kycData = {
          name: formData.get('name'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          creditCard: formData.get('creditCard'),
          address: formData.get('address'),
          status: formData.get('status') === 'true',
          dashboardEnabled: formData.get('dashboardEnabled') === 'true'
        };

        if (editingItem) {
          await kycAPI.update(editingItem.id, kycData);
        } else {
          await kycAPI.create(kycData);
        }
      } else if (modalType === 'account') {
        const accountData = {
          accountNumber: formData.get('accountNumber'),
          propFirm: formData.get('propFirm'),
          accountSize: parseFloat(formData.get('accountSize')) || 0,
          cost: parseFloat(formData.get('cost')) || 0,
          phase: formData.get('phase'),
          status: formData.get('status'),
          cycleId: formData.get('cycleId'),
          login: formData.get('login') || null,
          password: formData.get('password') || null,
          server: formData.get('server') || null
        };

        if (editingItem) {
          await accountsAPI.update(editingItem.id, accountData);
        } else {
          await accountsAPI.create(parentContext.id, accountData);
        }
      } else if (modalType === 'payout') {
        const payoutData = {
          amount: parseFloat(formData.get('amount'))
        };

        if (editingItem) {
          await payoutsAPI.update(editingItem.id, payoutData);
        } else {
          await payoutsAPI.create(parentContext.id, payoutData);
        }
      }

      await onReload();

      // Si estamos editando/creando para un KYC específico, mantenerlo seleccionado
      if (parentContext || (modalType === 'kyc' && editingItem)) {
        const kycId = parentContext?.id || editingItem?.id;
        const updatedKyc = kycs.find(k => k.id === kycId);
        setSelectedKyc(updatedKyc);
      }

      toast.success(`${modalType === 'kyc' ? 'KYC' : modalType === 'account' ? 'Cuenta' : 'Payout'} ${editingItem ? 'actualizado' : 'creado'} exitosamente`);
      handleCloseModal();
    } catch (error) {
      console.error(`Error al guardar ${modalType}:`, error);
      toast.error(`Error al guardar el registro`);
    }
  };

  // Funciones para abrir diálogo de confirmación
  const handleDeleteKyc = (kyc) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'kyc',
      item: kyc,
      kycId: kyc.id
    });
  };

  const handleDeleteAccount = (account, kycId) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'account',
      item: account,
      kycId
    });
  };

  const handleDeletePayout = (payout, kycId) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'payout',
      item: payout,
      kycId
    });
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    const { type, item, kycId } = deleteConfirm;

    try {
      if (type === 'kyc') {
        await kycAPI.delete(item.id);
        setSelectedKyc(null);
        toast.success('KYC eliminado exitosamente');
      } else if (type === 'account') {
        await accountsAPI.delete(item.id);
        toast.success('Cuenta eliminada exitosamente');
      } else if (type === 'payout') {
        await payoutsAPI.delete(item.id);
        toast.success('Payout eliminado exitosamente');
      }

      await onReload();

      // Mantener el KYC seleccionado si no fue el eliminado
      if (type !== 'kyc' && kycId) {
        const updatedKyc = kycs.find(k => k.id === kycId);
        setSelectedKyc(updatedKyc);
      }
    } catch (error) {
      console.error(`Error al eliminar ${type}:`, error);
      toast.error(`Error al eliminar el ${type === 'kyc' ? 'KYC' : type === 'account' ? 'cuenta' : 'payout'}`);
    }
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({
      isOpen: false,
      type: null,
      item: null,
      kycId: null
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de KYC</h1>
        <button onClick={() => openModal('kyc')} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Nuevo KYC
        </button>
      </div>

      {/* Layout dividido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Lista de KYC */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <SearchBox
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre o email..."
              />
            </div>
            <KycList
              kycs={filteredKycs}
              onKycSelect={setSelectedKyc}
              selectedKycId={selectedKyc?.id}
            />
          </div>
        </div>

        {/* Columna Derecha: Panel de Detalles */}
        <div className="md:col-span-2">
          <KycDetailPanel
            kyc={selectedKyc}
            cycles={cycles}
            openModal={openModal}
            onDeleteKyc={handleDeleteKyc}
            onDeleteAccount={handleDeleteAccount}
            onDeletePayout={handleDeletePayout}
          />
        </div>
      </div>

      {/* Modal Universal */}
      {isOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingItem ? 'Editar' : 'Agregar'}{' '}
              {modalType === 'kyc' ? 'KYC' : modalType === 'account' ? 'Cuenta' : 'Payout'}
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Formulario KYC */}
              {modalType === 'kyc' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input type="text" name="name" defaultValue={editingItem?.name} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input type="tel" name="phone" defaultValue={editingItem?.phone} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" defaultValue={editingItem?.email} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tarjeta de Crédito</label>
                    <input type="text" name="creditCard" defaultValue={editingItem?.creditCard} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dirección</label>
                    <textarea name="address" defaultValue={editingItem?.address} className="form-input" rows="3" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select name="status" defaultValue={editingItem?.status ? 'true' : 'false'} className="form-input">
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dashboard Habilitado</label>
                    <select name="dashboardEnabled" defaultValue={editingItem?.dashboardEnabled ? 'true' : 'false'} className="form-input">
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </>
              )}

              {/* Formulario Account */}
              {modalType === 'account' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Asignar a Ciclo</label>
                    <select name="cycleId" defaultValue={editingItem?.cycleId || ''} className="form-input" required>
                      <option value="" disabled>Selecciona un ciclo</option>
                      {cycles.map(cycle => (
                        <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número de Cuenta</label>
                    <input type="text" name="accountNumber" defaultValue={editingItem?.accountNumber} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prop Firm</label>
                    <input type="text" name="propFirm" defaultValue={editingItem?.propFirm} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto de la Cuenta (USD)</label>
                    <input type="number" name="accountSize" step="0.01" defaultValue={editingItem?.accountSize} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo (USD)</label>
                    <input type="number" name="cost" step="0.01" defaultValue={editingItem?.cost} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fase</label>
                    <select name="phase" defaultValue={editingItem?.phase || 'fase1'} className="form-input">
                      <option value="fase1">Fase 1</option>
                      <option value="fase2">Fase 2</option>
                      <option value="real">Real</option>
                      <option value="quemada">Quemada</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select name="status" defaultValue={editingItem?.status || 'Pending'} className="form-input">
                      <option value="Pending">Pendiente</option>
                      <option value="Active">Activa</option>
                      <option value="Burned">Quemada</option>
                    </select>
                  </div>

                  {/* Información de Login MT5 */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Información de Login MT5</h3>

                    <div className="form-group">
                      <label className="form-label">Login</label>
                      <input
                        type="text"
                        name="login"
                        defaultValue={editingItem?.login || ''}
                        className="form-input"
                        placeholder="Número de cuenta MT5"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          defaultValue={editingItem?.password || ''}
                          className="form-input pr-10"
                          placeholder="Contraseña de la cuenta"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Server</label>
                      <input
                        type="text"
                        name="server"
                        defaultValue={editingItem?.server || ''}
                        className="form-input"
                        placeholder="Servidor MT5 (ej: FTMO-Server-01)"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Formulario Payout */}
              {modalType === 'payout' && (
                <div className="form-group">
                  <label className="form-label">Monto del Payout (USD)</label>
                  <input type="number" name="amount" step="0.01" defaultValue={editingItem?.amount} required className="form-input" />
                </div>
              )}

              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">{editingItem ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title={`¿Eliminar ${deleteConfirm.type === 'kyc' ? 'KYC' : deleteConfirm.type === 'account' ? 'cuenta' : 'payout'}?`}
        message={
          deleteConfirm.type === 'kyc'
            ? `¿Estás seguro de eliminar el KYC de ${deleteConfirm.item?.name}? Se eliminarán también sus cuentas y payouts.`
            : deleteConfirm.type === 'account'
            ? `¿Estás seguro de eliminar la cuenta ${deleteConfirm.item?.accountNumber}?`
            : `¿Estás seguro de eliminar el payout de $${deleteConfirm.item?.amount?.toLocaleString()}?`
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
      />
    </div>
  );
}

export default KYCPage;