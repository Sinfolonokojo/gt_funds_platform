// frontend/src/components/kyc/KycList.jsx

import React from 'react';

function KycList({ kycs, onKycSelect, selectedKycId }) {
  if (kycs.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No se encontraron resultados.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
      {kycs.map(kyc => (
        <li
          key={kyc.id}
          onClick={() => {
            // Toggle: si ya está seleccionado, deseleccionar
            if (selectedKycId === kyc.id) {
              onKycSelect(null);
            } else {
              onKycSelect(kyc);
            }
          }}
          className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
            selectedKycId === kyc.id ? 'bg-blue-100' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800">{kyc.name}</p>
            <span className={`badge ${kyc.status ? 'badge-green' : 'badge-gray'}`}>
              {kyc.status ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <p className="text-sm text-gray-500">{kyc.email}</p>
        </li>
      ))}
    </ul>
  );
}

export default KycList;