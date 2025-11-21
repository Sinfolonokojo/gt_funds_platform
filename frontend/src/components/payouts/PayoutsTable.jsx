// frontend/src/components/payouts/PayoutsTable.jsx

import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

function PayoutsTable({ payouts, onEdit, onDelete, kycId }) {
  if (!payouts || payouts.length === 0) {
    return <p className="text-sm text-gray-500 mt-4">No hay payouts registrados para este KYC.</p>;
  }

  // Calcular totales
  const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const countPayouts = payouts.length;

  return (
    <div className="mt-4">
      {/* Bloque de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Cantidad de Retiros</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{countPayouts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Retirado (USD)</p>
          <p className="mt-1 text-3xl font-semibold text-green-600">${totalPayouts.toLocaleString()}</p>
        </div>
      </div>

      <h4 className="text-md font-semibold text-gray-800 mb-2">Detalle de Retiros</h4>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto (USD)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(payout => (
              <tr key={payout.id}>
                <td>{new Date(payout.payoutDate).toLocaleDateString('es-ES')}</td>
                <td className="font-semibold">${payout.amount.toLocaleString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(payout)}
                      className="btn-icon btn-edit"
                      aria-label="Editar payout"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(payout)}
                      className="btn-icon btn-delete"
                      aria-label="Eliminar payout"
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

export default PayoutsTable;