// frontend/src/components/accounts/AccountsTable.jsx

import React, { useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

function AccountsTable({ accounts, cycles, onEdit, onDelete }) {
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (accountId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };
  if (!accounts || accounts.length === 0) {
    return <p className="text-sm text-gray-500 mt-4">No hay cuentas asociadas a este KYC.</p>;
  }

  // --- Cálculos de Totales CORREGIDOS ---
  const totalCost = accounts.reduce((sum, acc) => sum + (acc.cost || 0), 0);
  const totalAccountSize = accounts.reduce((sum, acc) => sum + (acc.accountSize || 0), 0);

  return (
    <div className="mt-4">
      
      {/* Bloque de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Tarjeta 1: Cantidad de Cuentas */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Cantidad de Cuentas</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{accounts.length}</p>
        </div>

        {/* Tarjeta 2: Costo Total */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Costo Total (USD)</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">${totalCost.toLocaleString()}</p>
        </div>
        
        {/* Tarjeta 3: Total Account Size */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Tamaño Total de Cuentas (USD)</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">${totalAccountSize.toLocaleString()}</p>
        </div>

      </div>
      
      {/* Título para la Tabla */}
      <h4 className="text-md font-semibold text-gray-800 mb-2 mt-6">Detalle de Cuentas</h4>

      {/* Contenedor de la Tabla */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nº de Cuenta</th>
              <th>Prop Firm</th>
              <th>Monto (USD)</th>
              <th>Costo (USD)</th>
              <th>Fase</th>
              <th>Estado</th>
              <th>Login</th>
              <th>Password</th>
              <th>Server</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id}>
                <td className="font-medium">{account.accountNumber}</td>
                <td>{account.propFirm}</td>
                <td className="font-semibold">
                  ${(typeof account.accountSize === 'number' ? account.accountSize : 0).toLocaleString()}
                </td>
                <td>
                  ${(typeof account.cost === 'number' ? account.cost : 0).toLocaleString()}
                </td>
                <td>
                  <span className={`badge ${
                    account.phase === 'real' ? 'badge-green' : 
                    account.phase === 'fase2' ? 'badge-blue' :
                    account.phase === 'fase1' ? 'badge-yellow' : 'badge-red'}`
                  }>
                    {account.phase}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    account.status === 'Active' ? 'badge-green' :
                    account.status === 'Burned' ? 'badge-red' : 'badge-yellow'}`
                  }>
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
                      onClick={() => onEdit(account)}
                      className="btn-icon btn-edit"
                      aria-label="Editar cuenta"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(account)}
                      className="btn-icon btn-delete"
                      aria-label="Eliminar cuenta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountsTable;