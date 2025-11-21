// frontend/src/components/tiros/TirosTable.jsx

import React, { useState } from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';

function TirosTable({ tiros, onEdit, onDelete, onClose }) {
  const [expandedTiros, setExpandedTiros] = useState({});

  const toggleExpand = (tiroId) => {
    setExpandedTiros(prev => ({
      ...prev,
      [tiroId]: !prev[tiroId]
    }));
  };

  if (!tiros || tiros.length === 0) {
    return (
      <p className="text-sm text-gray-500 mt-4 text-center py-8">
        No hay tiros registrados para este ciclo.
      </p>
    );
  }

  // Calcular estadísticas
  const tirosAbiertos = tiros.filter(t => t.status === 'Abierto').length;
  const tirosCerrados = tiros.filter(t => t.status === 'Cerrado').length;
  const resultadoTotal = tiros
    .filter(t => t.result !== null && t.result !== undefined)
    .reduce((sum, t) => sum + t.result, 0);

  return (
    <div className="mt-4">
      {/* Bloque de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Tiros Abiertos</p>
          <p className="mt-1 text-3xl font-semibold text-blue-600">{tirosAbiertos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Tiros Cerrados</p>
          <p className="mt-1 text-3xl font-semibold text-gray-600">{tirosCerrados}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Resultado Total (USD)</p>
          <p className={`mt-1 text-3xl font-semibold ${resultadoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${resultadoTotal.toLocaleString()}
          </p>
        </div>
      </div>

      <h4 className="text-md font-semibold text-gray-800 mb-2">Detalle de Tiros</h4>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>Símbolo</th>
              <th>Dirección Leg1/Leg2</th>
              <th>Total Operaciones</th>
              <th>Fecha Apertura</th>
              <th>Estado</th>
              <th>Resultado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tiros.map(tiro => (
              <React.Fragment key={tiro.id}>
                {/* Fila principal */}
                <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(tiro.id)}>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(tiro.id);
                      }}
                      className="p-1"
                    >
                      {expandedTiros[tiro.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="font-medium">{tiro.symbol}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {tiro.leg1.direction === 'BUY' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">{tiro.leg1.direction}</span>
                      <span className="text-gray-400">/</span>
                      {tiro.leg2.direction === 'BUY' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">{tiro.leg2.direction}</span>
                    </div>
                  </td>
                  <td>
                    {tiro.leg1.accounts.reduce((sum, acc) => sum + acc.operations.length, 0) +
                      tiro.leg2.accounts.reduce((sum, acc) => sum + acc.operations.length, 0)} ops
                  </td>
                  <td>{new Date(tiro.openDate).toLocaleDateString('es-ES')}</td>
                  <td>
                    <span className={`badge ${
                      tiro.status === 'Abierto' ? 'badge-blue' : 'badge-gray'
                    }`}>
                      {tiro.status}
                    </span>
                  </td>
                  <td>
                    {tiro.result !== null && tiro.result !== undefined ? (
                      <span className={`font-semibold ${tiro.result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${tiro.result.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      {tiro.status === 'Abierto' && (
                        <button
                          onClick={() => onClose(tiro)}
                          className="btn-icon text-green-600 hover:bg-green-50"
                          title="Cerrar Tiro"
                        >
                          <span className="text-xs font-semibold">Cerrar</span>
                        </button>
                      )}
                      <button onClick={() => onEdit(tiro)} className="btn-icon btn-edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(tiro.id)} className="btn-icon btn-delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Fila expandida con detalles */}
                {expandedTiros[tiro.id] && (
                  <tr>
                    <td colSpan="8" className="bg-gray-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Leg 1 Details */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            {tiro.leg1.direction === 'BUY' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            Leg 1 - {tiro.leg1.direction}
                          </h5>
                          {tiro.leg1.accounts.map((account, accIdx) => (
                            <div key={accIdx} className="mb-3 bg-white p-2 rounded border">
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                Cuenta {accIdx + 1}: {account.accountId}
                              </p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-1">Vol</th>
                                    <th className="text-left py-1">Entry</th>
                                    <th className="text-left py-1">Exit</th>
                                    <th className="text-left py-1">Result</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {account.operations.map((op, opIdx) => (
                                    <tr key={opIdx}>
                                      <td className="py-1">{op.volume}</td>
                                      <td className="py-1">{op.entryPrice}</td>
                                      <td className="py-1">{op.exitPrice || '-'}</td>
                                      <td className={`py-1 ${op.result ? (op.result >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                                        {op.result ? `$${op.result}` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>

                        {/* Leg 2 Details */}
                        <div className="bg-red-50 p-3 rounded-lg">
                          <h5 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                            {tiro.leg2.direction === 'BUY' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            Leg 2 - {tiro.leg2.direction}
                          </h5>
                          {tiro.leg2.accounts.map((account, accIdx) => (
                            <div key={accIdx} className="mb-3 bg-white p-2 rounded border">
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                Cuenta {accIdx + 1}: {account.accountId}
                              </p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-1">Vol</th>
                                    <th className="text-left py-1">Entry</th>
                                    <th className="text-left py-1">Exit</th>
                                    <th className="text-left py-1">Result</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {account.operations.map((op, opIdx) => (
                                    <tr key={opIdx}>
                                      <td className="py-1">{op.volume}</td>
                                      <td className="py-1">{op.entryPrice}</td>
                                      <td className="py-1">{op.exitPrice || '-'}</td>
                                      <td className={`py-1 ${op.result ? (op.result >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                                        {op.result ? `$${op.result}` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {tiro.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs text-gray-700">
                            <strong>Notas:</strong> {tiro.notes}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TirosTable;