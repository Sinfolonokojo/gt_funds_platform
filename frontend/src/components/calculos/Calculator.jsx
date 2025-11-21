// frontend/src/components/calculos/Calculator.jsx

import React, { useState } from 'react';
import { Calculator as CalcIcon } from 'lucide-react';

function Calculator({ onCalculate, historicalData }) {
  const [inputs, setInputs] = useState({
    numCuentas: 10,
    costoPorCuenta: 150,
    profitTarget: 5000,
    tasaConversion: historicalData?.promedioTasaConversion || 10
  });

  const [useHistorical, setUseHistorical] = useState(false);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleCalculate = () => {
    const costoTotal = inputs.numCuentas * inputs.costoPorCuenta;
    const cuentasEnReal = inputs.numCuentas * (inputs.tasaConversion / 100);
    const profitPotencial = cuentasEnReal * inputs.profitTarget;
    const roi = ((profitPotencial - costoTotal) / costoTotal) * 100;

    onCalculate({
      costoTotal,
      cuentasEnReal,
      profitPotencial,
      roi,
      inputs
    });
  };

  const toggleHistorical = () => {
    if (!useHistorical && historicalData) {
      setInputs(prev => ({
        ...prev,
        tasaConversion: historicalData.promedioTasaConversion || prev.tasaConversion,
        costoPorCuenta: historicalData.promedioCostoPorCuenta || prev.costoPorCuenta,
        profitTarget: historicalData.promedioProfitPorCuenta || prev.profitTarget
      }));
    }
    setUseHistorical(!useHistorical);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalcIcon className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Calculadora de Ciclo</h2>
        </div>

        {historicalData && (
          <button
            onClick={toggleHistorical}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              useHistorical
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {useHistorical ? '✓ Usando datos históricos' : 'Usar datos históricos'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Número de Cuentas */}
        <div className="form-group">
          <label className="form-label">
            Número de Cuentas
          </label>
          <input
            type="number"
            className="form-input"
            value={inputs.numCuentas}
            onChange={(e) => handleInputChange('numCuentas', e.target.value)}
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">Cantidad de cuentas a comprar</p>
        </div>

        {/* Costo por Cuenta */}
        <div className="form-group">
          <label className="form-label">
            Costo por Cuenta ($)
            {useHistorical && historicalData && (
              <span className="text-xs text-green-600 ml-2">
                (Promedio histórico: ${historicalData.promedioCostoPorCuenta?.toFixed(2)})
              </span>
            )}
          </label>
          <input
            type="number"
            className="form-input"
            value={inputs.costoPorCuenta}
            onChange={(e) => handleInputChange('costoPorCuenta', e.target.value)}
            min="0"
            step="10"
          />
          <p className="text-xs text-gray-500 mt-1">Precio promedio por cuenta</p>
        </div>

        {/* Tasa de Conversión */}
        <div className="form-group">
          <label className="form-label">
            Tasa de Conversión (%)
            {useHistorical && historicalData && (
              <span className="text-xs text-green-600 ml-2">
                (Promedio histórico: {historicalData.promedioTasaConversion?.toFixed(1)}%)
              </span>
            )}
          </label>
          <input
            type="number"
            className="form-input"
            value={inputs.tasaConversion}
            onChange={(e) => handleInputChange('tasaConversion', e.target.value)}
            min="0"
            max="100"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">% de cuentas que pasan a real</p>
        </div>

        {/* Profit Target */}
        <div className="form-group">
          <label className="form-label">
            Profit Target por Cuenta ($)
            {useHistorical && historicalData && (
              <span className="text-xs text-green-600 ml-2">
                (Promedio histórico: ${historicalData.promedioProfitPorCuenta?.toFixed(2)})
              </span>
            )}
          </label>
          <input
            type="number"
            className="form-input"
            value={inputs.profitTarget}
            onChange={(e) => handleInputChange('profitTarget', e.target.value)}
            min="0"
            step="100"
          />
          <p className="text-xs text-gray-500 mt-1">Ganancia esperada por cuenta en real</p>
        </div>
      </div>

      {/* Botón Calcular */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleCalculate}
          className="btn-primary flex items-center"
        >
          <CalcIcon className="w-4 h-4 mr-2" />
          Calcular Estimaciones
        </button>
      </div>

      {/* Info de Datos Históricos */}
      {historicalData && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Datos históricos disponibles:</strong> Basados en {historicalData.totalCiclosCompletados || 0} ciclos completados
          </p>
        </div>
      )}
    </div>
  );
}

export default Calculator;
