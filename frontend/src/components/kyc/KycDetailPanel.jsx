// frontend/src/components/kyc/KycDetailPanel.jsx

import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import AccountsTable from '../accounts/AccountsTable';
import PayoutsTable from '../payouts/PayoutsTable';

function KycDetailPanel({ kyc, cycles, openModal, onDeleteKyc, onDeleteAccount, onDeletePayout }) {
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  const [payoutsExpanded, setPayoutsExpanded] = useState(false);

  if (!kyc) {
    return (
      <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center h-full">
        <p className="text-gray-500">Selecciona un KYC de la lista para ver sus detalles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{kyc.name}</h2>
          <p className="text-sm text-gray-500">{kyc.email}</p>
        </div>
        <div className="action-buttons">
          <button
            onClick={() => openModal('kyc', kyc)}
            className="btn-icon btn-edit"
            title="Editar KYC"
            aria-label="Editar KYC"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDeleteKyc(kyc)}
            className="btn-icon btn-delete"
            title="Eliminar KYC"
            aria-label="Eliminar KYC"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm mb-6">
        <div className="kyc-detail-row">
          <span className="kyc-detail-label">Teléfono:</span>
          <span className="kyc-detail-value">{kyc.phone}</span>
        </div>
        <div className="kyc-detail-row">
          <span className="kyc-detail-label">Dirección:</span>
          <span className="kyc-detail-value">{kyc.address || 'No especificada'}</span>
        </div>
        <div className="kyc-detail-row">
          <span className="kyc-detail-label">Tarjeta de Crédito:</span>
          <span className="kyc-detail-value font-mono">{kyc.creditCard || 'No especificada'}</span>
        </div>
        <div className="kyc-detail-row">
          <span className="kyc-detail-label">Fecha de Envío:</span>
          <span className="kyc-detail-value">{new Date(kyc.submittedDate).toLocaleDateString('es-ES')}</span>
        </div>
        <div className="kyc-detail-row">
          <span className="kyc-detail-label">Estado:</span>
          <span className={`badge ${kyc.status ? 'badge-green' : 'badge-gray'}`}>
            {kyc.status ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div className="kyc-detail-row">
          <span className="kyc-detail-label">Dashboard Habilitado:</span>
          <span className={`badge ${kyc.dashboardEnabled ? 'badge-blue' : 'badge-yellow'}`}>
            {kyc.dashboardEnabled ? 'Sí' : 'No'}
          </span>
        </div>
      </div>

      {/* Sección de Cuentas */}
      <div className="border-t pt-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setAccountsExpanded(!accountsExpanded)}
        >
          <h3 className="text-xl font-semibold text-gray-800">Sus Cuentas</h3>
          <svg className={`w-5 h-5 transition-transform ${accountsExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>

        {accountsExpanded && (
          <div className="mt-4">
            <button onClick={() => openModal('account', null, kyc)} className="btn-primary mb-4">
              <Plus className="w-5 h-5 mr-2" /> Agregar Cuenta
            </button>
            <AccountsTable
              accounts={kyc.accounts}
              cycles={cycles}
              onEdit={(account) => openModal('account', account, kyc)}
              onDelete={(account) => onDeleteAccount(account, kyc.id)}
            />
          </div>
        )}
      </div>

      {/* Sección de Payouts */}
      <div className="border-t pt-4 mt-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setPayoutsExpanded(!payoutsExpanded)}
        >
          <h3 className="text-xl font-semibold text-gray-800">Sus Payouts</h3>
          <svg className={`w-5 h-5 transition-transform ${payoutsExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>

        {payoutsExpanded && (
          <div className="mt-4">
            <button onClick={() => openModal('payout', null, kyc)} className="btn-primary mb-4">
              <Plus className="w-5 h-5 mr-2" /> Agregar Payout
            </button>
            <PayoutsTable
              payouts={kyc.payouts}
              onEdit={(payout) => openModal('payout', payout, kyc)}
              onDelete={(payout) => onDeletePayout(payout, kyc.id)}
              kycId={kyc.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default KycDetailPanel;