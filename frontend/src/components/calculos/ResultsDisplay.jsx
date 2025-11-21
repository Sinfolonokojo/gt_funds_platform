// frontend/src/components/calculos/ResultsDisplay.jsx

import React from 'react';
import { DollarSign, TrendingUp, Target, Clock } from 'lucide-react';
import StatCard from '../shared/StatCard';

function ResultsDisplay({ results, historicalData }) {
  if (!results) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500 text-lg">
          Configura los parámetros y presiona "Calcular Estimaciones" para ver los resultados
        </p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = value >= 0 ? '+' : '';
    return (
      <span className={color}>
        {sign}{value.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Resultados de la Estimación</h2>
        <span className="text-sm text-gray-500">
          Basado en {results.inputs.numCuentas} cuentas
        </span>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Costo Total"
          value={formatCurrency(results.costoTotal)}
          icon={<DollarSign className="w-8 h-8" />}
          iconColor="text-red-500"
        />

        <StatCard
          title="Profit Potencial"
          value={formatCurrency(results.profitPotencial)}
          icon={<TrendingUp className="w-8 h-8" />}
          iconColor="text-green-500"
        />

        <StatCard
          title="ROI Estimado"
          value={formatPercentage(results.roi)}
          icon={<Target className="w-8 h-8" />}
          iconColor={results.roi >= 0 ? 'text-green-500' : 'text-red-500'}
        />

        <StatCard
          title="Cuentas en Real"
          value={`${results.cuentasEnReal.toFixed(1)} cuentas`}
          icon={<Clock className="w-8 h-8" />}
          iconColor="text-blue-500"
        />
      </div>

      {/* Detalles Adicionales */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Cálculo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Inversión Inicial</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(results.costoTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {results.inputs.numCuentas} cuentas × {formatCurrency(results.inputs.costoPorCuenta)}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Tasa de Conversión</p>
            <p className="text-xl font-semibold text-gray-900">{results.inputs.tasaConversion}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {results.cuentasEnReal.toFixed(1)} de {results.inputs.numCuentas} cuentas pasan a real
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Profit por Cuenta</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(results.inputs.profitTarget)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Target por cada cuenta en fase real
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Ganancia Neta</p>
            <p className={`text-xl font-semibold ${results.profitPotencial - results.costoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(results.profitPotencial - results.costoTotal)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Profit potencial - Inversión inicial
            </p>
          </div>
        </div>
      </div>

      {/* Comparación con Históricos */}
      {historicalData && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Comparación con Datos Históricos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Tasa de Conversión</p>
              <p className="text-lg font-semibold text-blue-900">
                Tu estimación: {results.inputs.tasaConversion}%
              </p>
              <p className="text-sm text-blue-600">
                Promedio histórico: {historicalData.promedioTasaConversion?.toFixed(1)}%
              </p>
            </div>

            <div>
              <p className="text-sm text-blue-700">Costo por Cuenta</p>
              <p className="text-lg font-semibold text-blue-900">
                Tu estimación: {formatCurrency(results.inputs.costoPorCuenta)}
              </p>
              <p className="text-sm text-blue-600">
                Promedio histórico: {formatCurrency(historicalData.promedioCostoPorCuenta)}
              </p>
            </div>

            <div>
              <p className="text-sm text-blue-700">Profit por Cuenta</p>
              <p className="text-lg font-semibold text-blue-900">
                Tu estimación: {formatCurrency(results.inputs.profitTarget)}
              </p>
              <p className="text-sm text-blue-600">
                Promedio histórico: {formatCurrency(historicalData.promedioProfitPorCuenta)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsDisplay;
