// frontend/src/pages/InvestorsPage.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import SearchBox from '../components/shared/SearchBox';
import StatCard from '../components/shared/StatCard';
import { investorsAPI, cyclesAPI } from '../services/api';
import { useModal } from '../hooks/useModal';

function InvestorsPage() {
  const [investors, setInvestors] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, modalType, editingItem, parentContext, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [investorsData, cyclesData] = await Promise.all([
        investorsAPI.getAll(),
        cyclesAPI.getAll()
      ]);
      setInvestors(investorsData);
      setCycles(cyclesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvestor = async (investor) => {
    if (selectedInvestor?.id === investor.id) {
      setSelectedInvestor(null);
      setInvestments([]);
    } else {
      setSelectedInvestor(investor);
      try {
        const investmentsData = await investorsAPI.getInvestments(investor.id);
        setInvestments(investmentsData);
      } catch (error) {
        console.error("Error al cargar inversiones:", error);
        setInvestments([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      if (modalType === 'investor') {
        const investorData = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone') || null,
          identification: formData.get('identification') || null,
          country: formData.get('country') || null,
          notes: formData.get('notes') || null
        };

        if (editingItem) {
          await investorsAPI.update(editingItem.id, investorData);
        } else {
          await investorsAPI.create(investorData);
        }
      } else if (modalType === 'investment') {
        const investmentData = {
          cycleId: formData.get('cycleId'),
          amount: parseFloat(formData.get('amount')),
          profitPercentage: parseFloat(formData.get('profitPercentage'))
        };

        await investorsAPI.addInvestment(parentContext.id, investmentData);
        
        // Recargar inversiones del inversor
        const investmentsData = await investorsAPI.getInvestments(parentContext.id);
        setInvestments(investmentsData);
      }

      await fetchData();
      if (selectedInvestor) {
        const updatedInvestor = investors.find(i => i.id === selectedInvestor.id);
        setSelectedInvestor(updatedInvestor);
      }
      closeModal();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (investorId) => {
    if (window.confirm('¿Estás seguro de eliminar este inversor?')) {
      try {
        await investorsAPI.delete(investorId);
        setSelectedInvestor(null);
        setInvestments([]);
        await fetchData();
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar el inversor.");
      }
    }
  };

  const filteredInvestors = investors.filter(inv =>
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estadísticas
  const totalInvestors = investors.length;
  const totalCapital = investors.reduce((sum, inv) => sum + (inv.totalInvested || 0), 0);
  const activeInvestments = investors.reduce((sum, inv) => {
    return sum + (inv.investments?.filter(i => i.status === 'Active').length || 0);
  }, 0);

  if (loading) {
    return <div className="text-center py-12">Cargando inversores...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Inversores</h1>
        <button onClick={() => openModal('investor')} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Nuevo Inversor
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Inversores"
          value={totalInvestors}
          icon={<TrendingUp className="w-10 h-10" />}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Capital Total"
          value={`$${(totalCapital / 1000).toFixed(0)}K`}
          icon={<DollarSign className="w-10 h-10" />}
          iconColor="text-green-500"
        />
        <StatCard
          title="Inversiones Activas"
          value={activeInvestments}
          icon={<TrendingUp className="w-10 h-10" />}
          iconColor="text-purple-500"
        />
      </div>

      {/* Layout dividido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Inversores */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <SearchBox
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar inversores..."
              />
            </div>
            <ul className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
              {filteredInvestors.map(investor => (
                <li
                  key={investor.id}
                  onClick={() => handleSelectInvestor(investor)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedInvestor?.id === investor.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{investor.name}</p>
                      <p className="text-sm text-gray-500">{investor.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {investor.investments?.length || 0} inversiones
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        ${(investor.totalInvested || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {filteredInvestors.length === 0 && (
                <li className="p-4 text-center text-gray-500">No se encontraron inversores.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Panel de Detalles */}
        <div className="md:col-span-2">
          {selectedInvestor ? (
            <div className="bg-white rounded-lg shadow p-6">
              {/* Cabecera */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedInvestor.name}</h2>
                  <p className="text-sm text-gray-500">{selectedInvestor.email}</p>
                </div>
                <div className="action-buttons">
                  <button onClick={() => openModal('investor', selectedInvestor)} className="btn-icon btn-edit">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(selectedInvestor.id)} className="btn-icon btn-delete">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{selectedInvestor.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Identificación</p>
                  <p className="font-medium">{selectedInvestor.identification || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">País</p>
                  <p className="font-medium">{selectedInvestor.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Invertido</p>
                  <p className="font-semibold text-green-600">
                    ${(selectedInvestor.totalInvested || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedInvestor.notes && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Notas</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedInvestor.notes}</p>
                </div>
              )}

              {/* Inversiones - SECCIÓN MEJORADA */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Inversiones ({investments.length})
                  </h3>
                  <button
                    onClick={() => openModal('investment', null, selectedInvestor)}
                    className="btn-primary"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Nueva Inversión
                  </button>
                </div>

                {investments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      No hay inversiones registradas
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Agrega la primera inversión de este inversor
                    </p>
                    <button
                      onClick={() => openModal('investment', null, selectedInvestor)}
                      className="btn-primary"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Agregar Inversión
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {investments.map((inv, idx) => {
                      const expectedReturn = inv.amount * (inv.profitPercentage / 100);
                      const totalExpected = inv.amount + expectedReturn;
                      const monthsElapsed = Math.floor(
                        (new Date() - new Date(inv.investmentDate)) / (1000 * 60 * 60 * 24 * 30)
                      );

                      return (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                        >
                          {/* Header compacto con mejor jerarquía */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3 pb-3 border-b border-gray-100">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 text-base">{inv.cycleName}</h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    inv.status === 'Active'
                                      ? 'bg-green-100 text-green-700'
                                      : inv.status === 'Completed'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {inv.status === 'Active' ? '● Activo' :
                                   inv.status === 'Completed' ? '✓ Completado' :
                                   '○ Cancelado'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(inv.investmentDate).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })} • Hace {monthsElapsed} {monthsElapsed === 1 ? 'mes' : 'meses'}
                              </p>
                            </div>

                            {/* Acciones más compactas */}
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => openModal('investment', inv, selectedInvestor)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Editar inversión"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('¿Eliminar esta inversión?')) {
                                    console.log('Eliminar inversión', inv);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Eliminar inversión"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Grid de métricas más compacto y responsive */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg">
                              <p className="text-xs text-gray-600 mb-0.5">Monto Invertido</p>
                              <p className="font-bold text-xl text-gray-900">
                                ${(inv.amount / 1000).toFixed(0)}K
                              </p>
                              <p className="text-xs text-gray-500">${inv.amount.toLocaleString()}</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
                              <p className="text-xs text-green-700 mb-0.5">Ganancia</p>
                              <p className="font-bold text-xl text-green-600">
                                {inv.profitPercentage}%
                              </p>
                              <p className="text-xs text-green-600">+${(expectedReturn / 1000).toFixed(0)}K</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg col-span-2 sm:col-span-1">
                              <p className="text-xs text-blue-700 mb-0.5">Total Esperado</p>
                              <p className="font-bold text-xl text-blue-600">
                                ${(totalExpected / 1000).toFixed(0)}K
                              </p>
                              <p className="text-xs text-blue-600">${totalExpected.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Barra de progreso mejorada y más visual */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-gray-600">
                                Progreso de inversión
                              </span>
                              <span className="text-xs font-semibold text-green-600">
                                +${expectedReturn.toLocaleString()} ({inv.profitPercentage}%)
                              </span>
                            </div>
                            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="absolute h-full bg-gradient-to-r from-blue-500 via-blue-400 to-green-500 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${Math.min((inv.amount / totalExpected) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Principal
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Retorno
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center h-full">
              <p className="text-gray-500">Selecciona un inversor de la lista para ver sus detalles.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingItem ? 'Editar' : 'Agregar'}{' '}
              {modalType === 'investor' ? 'Inversor' : 'Inversión'}
            </h2>

            <form onSubmit={handleSubmit}>
              {modalType === 'investor' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingItem?.name}
                      required
                      className="form-input"
                      placeholder="Nombre completo o empresa"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingItem?.email}
                      required
                      className="form-input"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingItem?.phone}
                      className="form-input"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Identificación</label>
                    <input
                      type="text"
                      name="identification"
                      defaultValue={editingItem?.identification}
                      className="form-input"
                      placeholder="DNI, Pasaporte, CIF..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">País</label>
                    <input
                      type="text"
                      name="country"
                      defaultValue={editingItem?.country}
                      className="form-input"
                      placeholder="España"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <textarea
                      name="notes"
                      defaultValue={editingItem?.notes}
                      className="form-input"
                      rows="3"
                      placeholder="Información adicional..."
                    />
                  </div>
                </>
              )}

              {modalType === 'investment' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Ciclo *</label>
                    <select name="cycleId" required className="form-input">
                      <option value="">Seleccionar ciclo</option>
                      {cycles.map(cycle => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto (USD) *</label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0"
                      required
                      className="form-input"
                      placeholder="50000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Porcentaje de Ganancia (%) *</label>
                    <input
                      type="number"
                      name="profitPercentage"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      className="form-input"
                      placeholder="10.5"
                    />
                  </div>
                </>
              )}

              <div className="modal-buttons">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestorsPage;
