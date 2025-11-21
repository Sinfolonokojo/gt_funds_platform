// frontend/src/pages/AccountsPage.jsx

import React, { useState } from 'react';
import SearchBox from '../components/shared/SearchBox';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import EmptyState, { NoSearchResultsEmptyState } from '../components/shared/EmptyState';
import { Edit2, Trash2, Eye, EyeOff, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

function AccountsPage({ kycs, cycles, onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  // Aplanar todas las cuentas de todos los KYCs
  const allAccounts = kycs.flatMap(kyc => {
    const accountsArray = Array.isArray(kyc.accounts) ? kyc.accounts : [];
    return accountsArray.map(acc => ({
      ...acc,
      kycName: kyc.name,
      kycEmail: kyc.email
    }));
  });

  // Filtrar cuentas
  const filteredAccounts = allAccounts.filter(acc =>
    acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.propFirm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.kycName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estadísticas
  const totalAccountSize = filteredAccounts.reduce((sum, acc) => sum + (acc.accountSize || 0), 0);
  const totalCost = filteredAccounts.reduce((sum, acc) => sum + (acc.cost || 0), 0);
  const activeAccounts = filteredAccounts.filter(acc => acc.status === 'Active').length;
  const realAccounts = filteredAccounts.filter(acc => acc.phase === 'real').length;

  // Handlers
  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowEditModal(true);
    setShowPassword(false);
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/accounts/${accountToDelete.id}`);
      toast.success('Cuenta eliminada exitosamente');
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      toast.error('Error al eliminar la cuenta');
    } finally {
      setAccountToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const accountData = {
      accountNumber: formData.get('accountNumber'),
      propFirm: formData.get('propFirm'),
      accountSize: parseFloat(formData.get('accountSize')),
      cost: parseFloat(formData.get('cost')),
      phase: formData.get('phase'),
      status: formData.get('status'),
      cycleId: formData.get('cycleId') || null,
      login: formData.get('login') || null,
      password: formData.get('password') || null,
      server: formData.get('server') || null,
    };

    try {
      await axios.put(`http://127.0.0.1:8000/api/v1/accounts/${editingAccount.id}`, accountData);
      toast.success('Cuenta actualizada exitosamente');
      setShowEditModal(false);
      setEditingAccount(null);
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error al actualizar cuenta:', error);
      toast.error('Error al actualizar la cuenta');
    }
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditingAccount(null);
    setShowPassword(false);
  };

  const togglePasswordVisibility = (accountId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Todas las Cuentas</h1>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Cuentas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredAccounts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Cuentas Activas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeAccounts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Account Size</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">${(totalAccountSize / 1000).toFixed(0)}K</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Costo Total</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">${totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabla de cuentas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por cuenta, prop firm o cliente..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nº Cuenta</th>
                <th>Cliente</th>
                <th>Prop Firm</th>
                <th>Ciclo</th>
                <th>Account Size</th>
                <th>Costo</th>
                <th>Fase</th>
                <th>Estado</th>
                <th>Login</th>
                <th>Password</th>
                <th>Server</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="12">
                    {searchTerm ? (
                      <NoSearchResultsEmptyState
                        searchTerm={searchTerm}
                        onClear={() => setSearchTerm('')}
                      />
                    ) : (
                      <EmptyState
                        icon={CreditCard}
                        title="No hay cuentas"
                        description="Aún no hay cuentas registradas. Las cuentas se crean desde la sección de KYC."
                      />
                    )}
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(account => {
                  const cycle = cycles.find(c => c.id === account.cycleId);
                  return (
                    <tr key={account.id}>
                      <td className="font-medium">{account.accountNumber}</td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{account.kycName}</p>
                          <p className="text-xs text-gray-500">{account.kycEmail}</p>
                        </div>
                      </td>
                      <td>{account.propFirm}</td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {cycle?.name || 'Sin ciclo'}
                        </span>
                      </td>
                      <td className="font-semibold">${account.accountSize.toLocaleString()}</td>
                      <td>${account.cost.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          account.phase === 'real' ? 'badge-green' :
                          account.phase === 'fase2' ? 'badge-blue' :
                          account.phase === 'fase1' ? 'badge-yellow' : 'badge-red'
                        }`}>
                          {account.phase}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          account.status === 'Active' ? 'badge-green' :
                          account.status === 'Burned' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {account.login || '-'}
                      </td>
                      <td className="text-sm text-gray-600">
                        {account.password ? (
                          <div className="flex items-center gap-1">
                            <span>{visiblePasswords[account.id] ? account.password : '••••••••'}</span>
                            <button
                              onClick={() => togglePasswordVisibility(account.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {visiblePasswords[account.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="text-sm text-gray-600">
                        {account.server || '-'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(account)}
                            className="btn-icon btn-edit"
                            aria-label="Editar cuenta"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(account)}
                            className="btn-icon btn-delete"
                            aria-label="Eliminar cuenta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && editingAccount && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Editar Cuenta</h2>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label className="form-label">Número de Cuenta</label>
                <input
                  type="text"
                  name="accountNumber"
                  defaultValue={editingAccount.accountNumber}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prop Firm</label>
                <input
                  type="text"
                  name="propFirm"
                  defaultValue={editingAccount.propFirm}
                  required
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Monto de la Cuenta (USD)</label>
                  <input
                    type="number"
                    name="accountSize"
                    step="0.01"
                    defaultValue={editingAccount.accountSize}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo (USD)</label>
                  <input
                    type="number"
                    name="cost"
                    step="0.01"
                    defaultValue={editingAccount.cost}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Fase</label>
                  <select
                    name="phase"
                    defaultValue={editingAccount.phase || 'fase1'}
                    className="form-input"
                  >
                    <option value="fase1">Fase 1</option>
                    <option value="fase2">Fase 2</option>
                    <option value="real">Real</option>
                    <option value="quemada">Quemada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    name="status"
                    defaultValue={editingAccount.status || 'Pending'}
                    className="form-input"
                  >
                    <option value="Pending">Pendiente</option>
                    <option value="Active">Activa</option>
                    <option value="Burned">Quemada</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Asignar a Ciclo</label>
                <select
                  name="cycleId"
                  defaultValue={editingAccount.cycleId || ''}
                  className="form-input"
                >
                  <option value="">Sin ciclo</option>
                  {cycles.map(cycle => (
                    <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                  ))}
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
                    defaultValue={editingAccount.login || ''}
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
                      defaultValue={editingAccount.password || ''}
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
                    defaultValue={editingAccount.server || ''}
                    className="form-input"
                    placeholder="Servidor MT5 (ej: FTMO-Server-01)"
                  />
                </div>
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setAccountToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar cuenta?"
        message={`¿Estás seguro de que deseas eliminar la cuenta ${accountToDelete?.accountNumber}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
      />
    </div>
  );
}

export default AccountsPage;
