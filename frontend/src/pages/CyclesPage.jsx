// frontend/src/pages/CyclesPage.jsx

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import SearchBox from '../components/shared/SearchBox';
import CycleDashboard from '../components/cycles/CycleDashboard';
import { cyclesAPI } from '../services/api';
import { useModal } from '../hooks/useModal';

function CyclesPage({ cycles, onReload }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState(null);
  const { isOpen, modalType, editingItem, openModal, closeModal } = useModal();

  const filteredCycles = cycles.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const cycleData = {
      name: formData.get('name'),
      status: formData.get('status'),
    };

    try {
      if (editingItem) {
        await cyclesAPI.update(editingItem.id, cycleData);
      } else {
        await cyclesAPI.create(cycleData);
      }
      await onReload();
      closeModal();
    } catch (error) {
      console.error("Error al guardar el ciclo:", error);
      alert("Error al guardar el ciclo.");
    }
  };

  const handleDelete = async (cycleId) => {
    if (window.confirm('¿Estás seguro de eliminar este ciclo?')) {
      try {
        await cyclesAPI.delete(cycleId);
        await onReload();
      } catch (error) {
        console.error("Error al eliminar el ciclo:", error);
        alert("Error al eliminar el ciclo.");
      }
    }
  };

  // Si hay un ciclo seleccionado, mostrar el dashboard
  if (selectedCycle) {
    return (
      <CycleDashboard
        cycle={selectedCycle}
        onBack={() => setSelectedCycle(null)}
      />
    );
  }

  // Si no, mostrar la lista de ciclos
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Ciclos</h1>
        <button onClick={() => openModal('cycle')} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Nuevo Ciclo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar ciclos..."
          />
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre del Ciclo</th>
                <th>Fecha de Inicio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCycles.map(cycle => (
                <tr
                  key={cycle.id}
                  onClick={() => setSelectedCycle(cycle)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="font-medium text-blue-600">{cycle.name}</td>
                  <td>{new Date(cycle.startDate).toLocaleDateString('es-ES')}</td>
                  <td>
                    <span className={`badge ${cycle.status === 'Activo' ? 'badge-green' : 'badge-gray'}`}>
                      {cycle.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      <button onClick={() => openModal('cycle', cycle)} className="btn-icon btn-edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cycle.id)} className="btn-icon btn-delete">
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

      {/* Modal para crear/editar ciclo */}
      {isOpen && modalType === 'cycle' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingItem ? 'Editar' : 'Crear'} Ciclo</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Ciclo</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingItem?.name}
                  required
                  className="form-input"
                  placeholder="Ej: Ciclo Diciembre 2025"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  name="status"
                  defaultValue={editingItem?.status || 'Activo'}
                  className="form-input"
                >
                  <option value="Activo">Activo</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
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

export default CyclesPage;