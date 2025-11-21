// frontend/src/pages/CalculosPage.jsx

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import Calculator from '../components/calculos/Calculator';
import ResultsDisplay from '../components/calculos/ResultsDisplay';
import { cyclesAPI } from '../services/api';

function CalculosPage({ cycles }) {
  const [results, setResults] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [cycleAnalysis, setCycleAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calcular datos históricos al cargar la página
  useEffect(() => {
    calculateHistoricalData();
  }, [cycles]);

  const calculateHistoricalData = async () => {
    if (!cycles || cycles.length === 0) return;

    try {
      // Intentar usar el endpoint del backend primero
      try {
        const stats = await cyclesAPI.getStatistics();
        if (stats && stats.totalCiclosCompletados > 0) {
          setHistoricalData(stats);
          return;
        }
      } catch (backendError) {
        console.log('Backend statistics not available, calculating manually...');
      }

      // Fallback: Calcular manualmente si el backend no está disponible
      const completedCycles = cycles.filter(c => c.status === 'Completado');

      if (completedCycles.length === 0) {
        setHistoricalData(null);
        return;
      }

      let totalConversion = 0;
      let totalCost = 0;
      let totalProfit = 0;
      let totalAccounts = 0;
      let cyclesWithData = 0;

      for (const cycle of completedCycles) {
        try {
          const dashboard = await cyclesAPI.getDashboard(cycle.id);

          if (dashboard.resumen.totalCuentas > 0) {
            totalConversion += dashboard.resumen.tasaConversion;
            totalAccounts += dashboard.resumen.totalCuentas;

            // Calcular costos y profits de las cuentas
            if (dashboard.cuentas && dashboard.cuentas.length > 0) {
              const cycleCost = dashboard.cuentas.reduce((sum, acc) => sum + (acc.cost || 0), 0);
              totalCost += cycleCost;
            }

            cyclesWithData++;
          }
        } catch (error) {
          console.error(`Error loading cycle ${cycle.id}:`, error);
        }
      }

      if (cyclesWithData > 0) {
        setHistoricalData({
          promedioTasaConversion: totalConversion / cyclesWithData,
          promedioCostoPorCuenta: totalAccounts > 0 ? totalCost / totalAccounts : 150,
          promedioProfitPorCuenta: 5000,
          totalCiclosCompletados: cyclesWithData
        });
      }
    } catch (error) {
      console.error('Error calculating historical data:', error);
    }
  };

  const handleCalculate = (calculatedResults) => {
    setResults(calculatedResults);
  };

  const handleCycleSelect = async (cycleId) => {
    if (!cycleId) {
      setCycleAnalysis(null);
      setSelectedCycle('');
      return;
    }

    setSelectedCycle(cycleId);
    setLoading(true);

    try {
      const dashboard = await cyclesAPI.getDashboard(cycleId);

      // Calcular análisis basado en datos reales del ciclo
      const totalCost = dashboard.cuentas.reduce((sum, acc) => sum + (acc.cost || 0), 0);
      const avgCostPerAccount = dashboard.resumen.totalCuentas > 0
        ? totalCost / dashboard.resumen.totalCuentas
        : 0;

      // Proyección basada en los datos actuales
      const profitPotencial = dashboard.resumen.cuentasEnReal * 5000; // Asumir $5000 por cuenta en real
      const roi = totalCost > 0 ? ((profitPotencial - totalCost) / totalCost) * 100 : 0;

      setCycleAnalysis({
        metadata: dashboard.metadata,
        resumen: dashboard.resumen,
        totalCost,
        avgCostPerAccount,
        profitPotencial,
        roi
      });
    } catch (error) {
      console.error('Error loading cycle analysis:', error);
      alert('Error al cargar el análisis del ciclo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Cálculos y Estimaciones</h1>
          </div>
          <p className="text-gray-600">
            Calcula estimaciones para nuevos ciclos o analiza el rendimiento de ciclos existentes
          </p>
        </div>

        {/* Calculadora de Estimaciones */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
            Calculadora de Nuevo Ciclo
          </h2>

          <Calculator
            onCalculate={handleCalculate}
            historicalData={historicalData}
          />
        </div>

        {/* Resultados */}
        <div className="mb-8">
          <ResultsDisplay
            results={results}
            historicalData={historicalData}
          />
        </div>

        {/* Análisis de Ciclo Existente */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-6 h-6 text-green-600 mr-2" />
            Análisis de Ciclo Existente
          </h2>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-6">
              <label className="form-label">Seleccionar Ciclo</label>
              <select
                className="form-input"
                value={selectedCycle}
                onChange={(e) => handleCycleSelect(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Selecciona un ciclo --</option>
                {cycles && cycles.map(cycle => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} ({cycle.status})
                  </option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando análisis...</p>
              </div>
            )}

            {!loading && cycleAnalysis && (
              <div className="space-y-6">
                {/* Info del Ciclo */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{cycleAnalysis.metadata.name}</h3>
                  <p className="text-sm text-gray-600">
                    Inicio: {new Date(cycleAnalysis.metadata.startDate).toLocaleDateString()} |
                    Estado: <span className={`badge ${cycleAnalysis.metadata.status === 'Activo' ? 'badge-green' : 'badge-gray'}`}>
                      {cycleAnalysis.metadata.status}
                    </span>
                  </p>
                </div>

                {/* Métricas del Ciclo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Total Cuentas</p>
                    <p className="text-2xl font-bold text-gray-900">{cycleAnalysis.resumen.totalCuentas}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Costo Total</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${cycleAnalysis.totalCost.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Tasa de Conversión</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {cycleAnalysis.resumen.tasaConversion.toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Cuentas en Real</p>
                    <p className="text-2xl font-bold text-green-600">
                      {cycleAnalysis.resumen.cuentasEnReal}
                    </p>
                  </div>
                </div>

                {/* Distribución por Fase */}
                <div className="p-4 bg-blue-50 rounded-md">
                  <h4 className="font-semibold text-gray-900 mb-3">Distribución por Fase</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Fase 1</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {cycleAnalysis.resumen.cuentasPorFase.fase1}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fase 2</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {cycleAnalysis.resumen.cuentasPorFase.fase2}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Real</p>
                      <p className="text-lg font-semibold text-green-600">
                        {cycleAnalysis.resumen.cuentasPorFase.real}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quemadas</p>
                      <p className="text-lg font-semibold text-red-600">
                        {cycleAnalysis.resumen.cuentasPorFase.quemada}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proyección */}
                <div className="p-4 bg-green-50 rounded-md">
                  <h4 className="font-semibold text-gray-900 mb-3">Proyección de Rendimiento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-green-700">Profit Potencial</p>
                      <p className="text-xl font-bold text-green-900">
                        ${cycleAnalysis.profitPotencial.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600">
                        Basado en {cycleAnalysis.resumen.cuentasEnReal} cuentas × $5,000
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Ganancia Neta</p>
                      <p className={`text-xl font-bold ${cycleAnalysis.profitPotencial - cycleAnalysis.totalCost >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        ${(cycleAnalysis.profitPotencial - cycleAnalysis.totalCost).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">ROI Estimado</p>
                      <p className={`text-xl font-bold ${cycleAnalysis.roi >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {cycleAnalysis.roi >= 0 ? '+' : ''}{cycleAnalysis.roi.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !cycleAnalysis && selectedCycle === '' && (
              <div className="text-center py-8 text-gray-500">
                Selecciona un ciclo para ver su análisis detallado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculosPage;
