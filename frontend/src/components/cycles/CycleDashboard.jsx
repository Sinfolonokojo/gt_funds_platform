// frontend/src/components/cycles/CycleDashboard.jsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { cyclesAPI, tirosAPI } from '../../services/api';
import StatCard from '../shared/StatCard';
import TirosTable from '../tiros/TirosTable';
import { Activity, TrendingUp, DollarSign, Target } from 'lucide-react';

function CycleDashboard({ cycle, onBack }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTiroModal, setShowTiroModal] = useState(false);
  const [editingTiro, setEditingTiro] = useState(null);
  const [tirosExpanded, setTirosExpanded] = useState(true);
  
  // Estados para controlar el formulario de tiro
  const [tiroFormData, setTiroFormData] = useState({
    symbol: '',
    leg1: {
      direction: 'BUY',
      accounts: [
        { accountId: '', operations: [{ volume: 1.0, entryPrice: 0 }] }
      ]
    },
    leg2: {
      direction: 'SELL',
      accounts: [
        { accountId: '', operations: [{ volume: 1.0, entryPrice: 0 }] }
      ]
    },
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, [cycle]);

  const fetchDashboardData = async () => {
    if (!cycle) return;
    setLoading(true);
    setError('');
    try {
      const response = await cyclesAPI.getDashboard(cycle.id);
      setDashboardData(response);
    } catch (err) {
      setError('No se pudieron cargar los datos del dashboard.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTiro = async (tiroId) => {
    if (window.confirm('¿Estás seguro de eliminar este tiro?')) {
      try {
        await tirosAPI.delete(tiroId);
        await fetchDashboardData();
      } catch (error) {
        console.error("Error al eliminar el tiro:", error);
        alert("Error al eliminar el tiro.");
      }
    }
  };

  const handleCloseTiro = (tiro) => {
    setEditingTiro(tiro);
    setShowTiroModal(true);
  };

  const resetTiroForm = () => {
    setTiroFormData({
      symbol: '',
      leg1: {
        direction: 'BUY',
        accounts: [
          { accountId: '', operations: [{ volume: 1.0, entryPrice: 0 }] }
        ]
      },
      leg2: {
        direction: 'SELL',
        accounts: [
          { accountId: '', operations: [{ volume: 1.0, entryPrice: 0 }] }
        ]
      },
      notes: ''
    });
  };

  // Helper functions para manejar operaciones
  const addOperation = (legName, accountIndex) => {
    setTiroFormData(prev => ({
      ...prev,
      [legName]: {
        ...prev[legName],
        accounts: prev[legName].accounts.map((acc, idx) =>
          idx === accountIndex
            ? { ...acc, operations: [...acc.operations, { volume: 1.0, entryPrice: 0 }] }
            : acc
        )
      }
    }));
  };

  const removeOperation = (legName, accountIndex, opIndex) => {
    setTiroFormData(prev => ({
      ...prev,
      [legName]: {
        ...prev[legName],
        accounts: prev[legName].accounts.map((acc, idx) =>
          idx === accountIndex
            ? { ...acc, operations: acc.operations.filter((_, i) => i !== opIndex) }
            : acc
        )
      }
    }));
  };

  const updateAccountId = (legName, accountIndex, accountId) => {
    setTiroFormData(prev => ({
      ...prev,
      [legName]: {
        ...prev[legName],
        accounts: prev[legName].accounts.map((acc, idx) =>
          idx === accountIndex ? { ...acc, accountId } : acc
        )
      }
    }));
  };

  const updateOperation = (legName, accountIndex, opIndex, field, value) => {
    setTiroFormData(prev => ({
      ...prev,
      [legName]: {
        ...prev[legName],
        accounts: prev[legName].accounts.map((acc, accIdx) =>
          accIdx === accountIndex
            ? {
                ...acc,
                operations: acc.operations.map((op, opIdx) =>
                  opIdx === opIndex ? { ...op, [field]: value } : op
                )
              }
            : acc
        )
      }
    }));
  };

  const updateLegDirection = (legName, direction) => {
    setTiroFormData(prev => ({
      ...prev,
      [legName]: {
        ...prev[legName],
        direction
      }
    }));
  };

  const addAccount = (legName) => {
    setTiroFormData(prev => {
      const currentAccounts = prev[legName].accounts;
      if (currentAccounts.length >= 2) return prev; // Max 2 accounts per leg

      return {
        ...prev,
        [legName]: {
          ...prev[legName],
          accounts: [...currentAccounts, { accountId: '', operations: [{ volume: 1.0, entryPrice: 0 }] }]
        }
      };
    });
  };

  const removeAccount = (legName, accountIndex) => {
    setTiroFormData(prev => {
      const currentAccounts = prev[legName].accounts;
      if (currentAccounts.length <= 1) return prev; // Min 1 account per leg

      return {
        ...prev,
        [legName]: {
          ...prev[legName],
          accounts: currentAccounts.filter((_, idx) => idx !== accountIndex)
        }
      };
    });
  };

  const handleSubmitTiro = async (e) => {
    e.preventDefault();

    try {
      if (editingTiro) {
        // Cerrar tiro
        const formData = new FormData(e.target);
        const updateData = {
          status: "Cerrado",
          result: parseFloat(formData.get('result'))
        };
        await tirosAPI.update(editingTiro.id, updateData);
      } else {
        // Crear tiro con nueva estructura de múltiples operaciones
        const tiroData = {
          cycleId: cycle.id,
          symbol: tiroFormData.symbol,
          status: "Abierto",
          leg1: {
            direction: tiroFormData.leg1.direction,
            accounts: tiroFormData.leg1.accounts.map(acc => ({
              accountId: acc.accountId,
              operations: acc.operations.map(op => ({
                volume: parseFloat(op.volume),
                entryPrice: parseFloat(op.entryPrice),
                exitPrice: null,
                ticketId: null,
                result: null
              }))
            }))
          },
          leg2: {
            direction: tiroFormData.leg2.direction,
            accounts: tiroFormData.leg2.accounts.map(acc => ({
              accountId: acc.accountId,
              operations: acc.operations.map(op => ({
                volume: parseFloat(op.volume),
                entryPrice: parseFloat(op.entryPrice),
                exitPrice: null,
                ticketId: null,
                result: null
              }))
            }))
          },
          notes: tiroFormData.notes || null
        };

        console.log("=== TIRO DATA A ENVIAR ===");
        console.log(JSON.stringify(tiroData, null, 2));

        await tirosAPI.create(tiroData);
      }
      
      setShowTiroModal(false);
      setEditingTiro(null);
      resetTiroForm();
      await fetchDashboardData();
    } catch (error) {
      console.error("Error al guardar el tiro:", error);
      console.error("Detalle del error:", error.response?.data);
      const errorDetail = error.response?.data?.detail || error.message;
      alert("Error al guardar el tiro: " + JSON.stringify(errorDetail));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-lg text-gray-600">Cargando datos del ciclo...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No hay datos disponibles.</div>;
  }

  return (
    <div>
      {/* Botón de regreso */}
      <button onClick={onBack} className="btn-secondary mb-6 flex items-center">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a la Lista de Ciclos
      </button>

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {dashboardData.metadata.name}
        </h1>
        <p className="text-gray-500">
          Iniciado el: {new Date(dashboardData.metadata.startDate).toLocaleDateString('es-ES')} • 
          <span className={`ml-2 badge ${dashboardData.metadata.status === 'Activo' ? 'badge-green' : 'badge-gray'}`}>
            {dashboardData.metadata.status}
          </span>
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Cuentas"
          value={dashboardData.resumen.totalCuentas}
          icon={<Activity className="w-10 h-10" />}
          iconColor="text-blue-500"
        />
        <StatCard
          title="En Real"
          value={dashboardData.resumen.cuentasEnReal}
          icon={<Target className="w-10 h-10" />}
          iconColor="text-green-500"
        />
        <StatCard
          title="Tasa de Conversión"
          value={`${dashboardData.resumen.tasaConversion}%`}
          icon={<TrendingUp className="w-10 h-10" />}
          iconColor="text-purple-500"
        />
        <StatCard
          title="Quemadas"
          value={dashboardData.resumen.cuentasPorFase.quemada}
          icon={<DollarSign className="w-10 h-10" />}
          iconColor="text-red-500"
        />
      </div>

      {/* Distribución por Fases */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Distribución por Fases</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">
              {dashboardData.resumen.cuentasPorFase.fase1}
            </p>
            <p className="text-sm text-gray-600 mt-1">Fase 1</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {dashboardData.resumen.cuentasPorFase.fase2}
            </p>
            <p className="text-sm text-gray-600 mt-1">Fase 2</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {dashboardData.resumen.cuentasPorFase.real}
            </p>
            <p className="text-sm text-gray-600 mt-1">Real</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">
              {dashboardData.resumen.cuentasPorFase.quemada}
            </p>
            <p className="text-sm text-gray-600 mt-1">Quemadas</p>
          </div>
        </div>
      </div>

      {/* Tabla de Cuentas */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Cuentas del Ciclo ({dashboardData.cuentas.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Cliente</th>
                <th>Prop Firm</th>
                <th>Monto</th>
                <th>Fase</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.cuentas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No hay cuentas asociadas a este ciclo
                  </td>
                </tr>
              ) : (
                dashboardData.cuentas.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td className="font-medium">{cuenta.accountNumber}</td>
                    <td>{cuenta.nombre_kyc}</td>
                    <td>{cuenta.propFirm}</td>
                    <td className="font-semibold">${cuenta.accountSize.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        cuenta.phase === 'real' ? 'badge-green' :
                        cuenta.phase === 'fase2' ? 'badge-blue' :
                        cuenta.phase === 'fase1' ? 'badge-yellow' :
                        'badge-red'
                      }`}>
                        {cuenta.phase}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        cuenta.status === 'Active' ? 'badge-green' :
                        cuenta.status === 'Pending' ? 'badge-yellow' :
                        'badge-red'
                      }`}>
                        {cuenta.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de Tiros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-4"
          onClick={() => setTirosExpanded(!tirosExpanded)}
        >
          <h2 className="text-xl font-semibold text-gray-800">
            Tiros del Ciclo ({dashboardData.tiros?.length || 0})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingTiro(null);
                resetTiroForm();
                setShowTiroModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" /> Nuevo Tiro
            </button>
            <svg
              className={`w-5 h-5 transition-transform ${tirosExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        {tirosExpanded && (
          <TirosTable
            tiros={dashboardData.tiros}
            onEdit={(tiro) => {
              setEditingTiro(tiro);
              setShowTiroModal(true);
            }}
            onDelete={handleDeleteTiro}
            onClose={handleCloseTiro}
          />
        )}
      </div>

      {/* Modal para Crear/Cerrar Tiro */}
      {showTiroModal && (
        <div className="modal-overlay" onClick={() => { setShowTiroModal(false); setEditingTiro(null); resetTiroForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingTiro ? 'Cerrar Tiro' : 'Crear Nuevo Tiro'}
            </h2>

            <form onSubmit={handleSubmitTiro} autoComplete="off">
              {editingTiro ? (
                // Formulario para cerrar tiro
                <>
                  <div className="form-group">
                    <label className="form-label">Símbolo</label>
                    <input
                      type="text"
                      value={editingTiro.symbol}
                      disabled
                      className="form-input bg-gray-100"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Resultado Final (USD)</label>
                    <input
                      type="number"
                      name="result"
                      step="0.01"
                      required
                      className="form-input"
                      placeholder="150.50"
                    />
                    <small className="form-hint">
                      Ingresa el resultado neto del tiro (puede ser positivo o negativo)
                    </small>
                  </div>
                </>
              ) : (
                // Formulario para crear tiro
                <>
                  <div className="form-group">
                    <label className="form-label">Símbolo</label>
                    <input
                      type="text"
                      value={tiroFormData.symbol}
                      onChange={(e) => setTiroFormData({...tiroFormData, symbol: e.target.value})}
                      required
                      className="form-input"
                      placeholder="EURUSD"
                    />
                  </div>

                  {/* Leg 1 - Nueva estructura */}
                  <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-700">Pata 1 (Leg 1)</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Dirección:</label>
                        <select
                          value={tiroFormData.leg1.direction}
                          onChange={(e) => updateLegDirection('leg1', e.target.value)}
                          required
                          className="form-input text-sm py-1"
                        >
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </div>
                    </div>

                    {/* Leg 1 - Accounts */}
                    {tiroFormData.leg1.accounts.map((account, accIdx) => (
                      <div key={accIdx} className="mb-4 p-3 bg-white border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <label className="form-label text-sm">Cuenta {accIdx + 1}</label>
                          {tiroFormData.leg1.accounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAccount('leg1', accIdx)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              ✕ Eliminar cuenta
                            </button>
                          )}
                        </div>
                        <div className="form-group">
                          <select
                            value={account.accountId}
                            onChange={(e) => updateAccountId('leg1', accIdx, e.target.value)}
                            required
                            className="form-input"
                          >
                            <option value="">Seleccionar cuenta</option>
                            {dashboardData.cuentas.map(cuenta => (
                              <option key={cuenta.id} value={cuenta.id}>
                                {cuenta.accountNumber} - {cuenta.nombre_kyc} ({cuenta.propFirm})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operations for this account */}
                        <div className="mt-2">
                          <label className="form-label text-xs text-gray-600">Operaciones:</label>
                          {account.operations.map((op, opIdx) => (
                            <div key={opIdx} className="flex gap-2 items-end mb-2">
                              <div className="flex-1">
                                <label className="text-xs text-gray-500">Volumen</label>
                                <input
                                  type="number"
                                  value={op.volume}
                                  onChange={(e) => updateOperation('leg1', accIdx, opIdx, 'volume', e.target.value)}
                                  step="0.01"
                                  min="0.01"
                                  required
                                  className="form-input text-sm"
                                  placeholder="1.0"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-500">Precio Entrada</label>
                                <input
                                  type="number"
                                  value={op.entryPrice}
                                  onChange={(e) => updateOperation('leg1', accIdx, opIdx, 'entryPrice', e.target.value)}
                                  step="0.00001"
                                  min="0"
                                  required
                                  className="form-input text-sm"
                                  placeholder="1.08500"
                                />
                              </div>
                              {account.operations.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOperation('leg1', accIdx, opIdx)}
                                  className="btn-icon btn-delete text-xs px-2 py-1"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOperation('leg1', accIdx)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            + Agregar Operación
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Account Button for Leg 1 */}
                    {tiroFormData.leg1.accounts.length < 2 && (
                      <button
                        type="button"
                        onClick={() => addAccount('leg1')}
                        className="text-sm text-blue-700 hover:text-blue-900 font-medium mt-2"
                      >
                        + Agregar segunda cuenta
                      </button>
                    )}
                  </div>

                  {/* Leg 2 - Nueva estructura */}
                  <div className="border-t pt-4 mt-4 bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-700">Pata 2 (Leg 2)</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Dirección:</label>
                        <select
                          value={tiroFormData.leg2.direction}
                          onChange={(e) => updateLegDirection('leg2', e.target.value)}
                          required
                          className="form-input text-sm py-1"
                        >
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </div>
                    </div>

                    {/* Leg 2 - Accounts */}
                    {tiroFormData.leg2.accounts.map((account, accIdx) => (
                      <div key={accIdx} className="mb-4 p-3 bg-white border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <label className="form-label text-sm">Cuenta {accIdx + 1}</label>
                          {tiroFormData.leg2.accounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAccount('leg2', accIdx)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              ✕ Eliminar cuenta
                            </button>
                          )}
                        </div>
                        <div className="form-group">
                          <select
                            value={account.accountId}
                            onChange={(e) => updateAccountId('leg2', accIdx, e.target.value)}
                            required
                            className="form-input"
                          >
                            <option value="">Seleccionar cuenta</option>
                            {dashboardData.cuentas.map(cuenta => (
                              <option key={cuenta.id} value={cuenta.id}>
                                {cuenta.accountNumber} - {cuenta.nombre_kyc} ({cuenta.propFirm})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operations for this account */}
                        <div className="mt-2">
                          <label className="form-label text-xs text-gray-600">Operaciones:</label>
                          {account.operations.map((op, opIdx) => (
                            <div key={opIdx} className="flex gap-2 items-end mb-2">
                              <div className="flex-1">
                                <label className="text-xs text-gray-500">Volumen</label>
                                <input
                                  type="number"
                                  value={op.volume}
                                  onChange={(e) => updateOperation('leg2', accIdx, opIdx, 'volume', e.target.value)}
                                  step="0.01"
                                  min="0.01"
                                  required
                                  className="form-input text-sm"
                                  placeholder="1.0"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-500">Precio Entrada</label>
                                <input
                                  type="number"
                                  value={op.entryPrice}
                                  onChange={(e) => updateOperation('leg2', accIdx, opIdx, 'entryPrice', e.target.value)}
                                  step="0.00001"
                                  min="0"
                                  required
                                  className="form-input text-sm"
                                  placeholder="1.08500"
                                />
                              </div>
                              {account.operations.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOperation('leg2', accIdx, opIdx)}
                                  className="btn-icon btn-delete text-xs px-2 py-1"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOperation('leg2', accIdx)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            + Agregar Operación
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Account Button for Leg 2 */}
                    {tiroFormData.leg2.accounts.length < 2 && (
                      <button
                        type="button"
                        onClick={() => addAccount('leg2')}
                        className="text-sm text-blue-700 hover:text-blue-900 font-medium mt-2"
                      >
                        + Agregar segunda cuenta
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notas (Opcional)</label>
                    <textarea
                      value={tiroFormData.notes}
                      onChange={(e) => setTiroFormData({...tiroFormData, notes: e.target.value})}
                      className="form-input"
                      rows="3"
                      placeholder="Notas sobre este tiro..."
                    />
                  </div>
                </>
              )}

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => { 
                    setShowTiroModal(false); 
                    setEditingTiro(null); 
                    resetTiroForm();
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingTiro ? 'Cerrar Tiro' : 'Crear Tiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CycleDashboard;