// frontend/src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Activity, TrendingUp, BarChart3, Target, ArrowRight } from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import axios from 'axios';

function Dashboard({ stats, kycs, cycles }) {
  const [cyclesData, setCyclesData] = useState([]);
  const { totalAUM, totalAccounts, totalKycs, totalCycles } = stats;

  // Calcular cuentas activas
  const activeAccounts = kycs.reduce((sum, kyc) => {
    const accountsArray = Array.isArray(kyc.accounts) ? kyc.accounts : [];
    return sum + accountsArray.filter(acc => acc.status === 'Active').length;
  }, 0);

  // Calcular total de payouts
  const totalPayouts = kycs.reduce((total, kyc) => {
    const payoutsArray = Array.isArray(kyc.payouts) ? kyc.payouts : [];
    const kycPayouts = payoutsArray.reduce((sum, p) => sum + (p.amount || 0), 0);
    return total + kycPayouts;
  }, 0);

  // Obtener ciclos activos
  const activeCycles = cycles.filter(c => c.status === 'Activo').length;

  // Fetch enhanced cycle data
  useEffect(() => {
    const fetchCyclesData = async () => {
      try {
        const enhancedData = await Promise.all(
          cycles.slice(0, 5).map(async (cycle) => {
            try {
              const response = await axios.get(`http://127.0.0.1:8000/api/v1/cycles/${cycle.id}/dashboard`);
              return {
                ...cycle,
                dashboard: response.data
              };
            } catch (error) {
              console.error(`Error fetching dashboard for cycle ${cycle.id}:`, error);
              return {
                ...cycle,
                dashboard: null
              };
            }
          })
        );
        setCyclesData(enhancedData);
      } catch (error) {
        console.error('Error fetching cycles data:', error);
        setCyclesData(cycles.slice(0, 5).map(c => ({ ...c, dashboard: null })));
      }
    };

    if (cycles.length > 0) {
      fetchCyclesData();
    }
  }, [cycles]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard General</h1>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total AUM"
          value={`$${(totalAUM / 1000000).toFixed(2)}M`}
          icon={<DollarSign className="w-12 h-12" />}
          iconColor="text-green-500"
        />
        <StatCard
          title="Clientes KYC"
          value={totalKycs}
          icon={<Users className="w-12 h-12" />}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Cuentas Totales"
          value={totalAccounts}
          icon={<Activity className="w-12 h-12" />}
          iconColor="text-purple-500"
        />
        <StatCard
          title="Ciclos Activos"
          value={`${activeCycles}/${totalCycles}`}
          icon={<TrendingUp className="w-12 h-12" />}
          iconColor="text-orange-500"
        />
      </div>

      {/* Segunda fila de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Cuentas Activas"
          value={activeAccounts}
          icon={<Activity className="w-10 h-10" />}
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Payouts"
          value={`$${totalPayouts.toLocaleString()}`}
          icon={<DollarSign className="w-10 h-10" />}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Costo Total"
          value={`$${kycs.reduce((total, kyc) => {
            const accountsArray = Array.isArray(kyc.accounts) ? kyc.accounts : [];
            return total + accountsArray.reduce((sum, acc) => sum + (acc.cost || 0), 0);
          }, 0).toLocaleString()}`}
          icon={<DollarSign className="w-10 h-10" />}
          iconColor="text-red-600"
        />
      </div>

      {/* Sección de Ciclos Recientes - Enhanced */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Ciclos Recientes</h2>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        {cycles.length === 0 ? (
          <p className="text-gray-500">No hay ciclos registrados aún.</p>
        ) : (
          <div className="space-y-4">
            {cyclesData.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : (
              cyclesData.map((cycle) => {
                const dashboard = cycle.dashboard?.resumen;
                const totalCuentas = dashboard?.totalCuentas || 0;
                const cuentasEnReal = dashboard?.cuentasEnReal || 0;
                const tasaConversion = dashboard?.tasaConversion || 0;
                const totalTiros = dashboard?.totalTiros || 0;
                const tirosAbiertos = dashboard?.tirosAbiertos || 0;
                const tirosCerrados = dashboard?.tirosCerrados || 0;
                const cuentasPorFase = dashboard?.cuentasPorFase || { fase1: 0, fase2: 0, real: 0, quemada: 0 };

                return (
                  <div
                    key={cycle.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{cycle.name}</h3>
                          <span
                            className={`badge ${
                              cycle.status === 'Activo' ? 'badge-green' : 'badge-gray'
                            }`}
                          >
                            {cycle.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Iniciado: {new Date(cycle.startDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    {dashboard ? (
                      <div className="space-y-3">
                        {/* Account Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Total Cuentas</p>
                            <p className="text-lg font-bold text-gray-900">{totalCuentas}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-xs text-gray-500 mb-1">En Real</p>
                            <p className="text-lg font-bold text-green-600">{cuentasEnReal}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">Total Trades</p>
                            <p className="text-lg font-bold text-blue-600">{totalTiros}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">Trades Abiertos</p>
                            <p className="text-lg font-bold text-orange-600">{tirosAbiertos}</p>
                          </div>
                        </div>

                        {/* Conversion Rate Progress */}
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-gray-700">Tasa de Conversión</span>
                            </div>
                            <span className="text-sm font-bold text-purple-600">{tasaConversion.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(tasaConversion, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Phase Distribution */}
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Fase 1: {cuentasPorFase.fase1}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Fase 2: {cuentasPorFase.fase2}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Real: {cuentasPorFase.real}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Quemada: {cuentasPorFase.quemada}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Cerrados: {tirosCerrados}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No hay datos detallados disponibles
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sección de KYCs Recientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Clientes KYC Recientes</h2>
        {kycs.length === 0 ? (
          <p className="text-gray-500">No hay clientes KYC registrados aún.</p>
        ) : (
          <div className="space-y-3">
            {kycs.slice(0, 5).map((kyc) => {
              const accountsCount = Array.isArray(kyc.accounts) ? kyc.accounts.length : 0;
              const payoutsCount = Array.isArray(kyc.payouts) ? kyc.payouts.length : 0;

              return (
                <div
                  key={kyc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{kyc.name}</p>
                    <p className="text-sm text-gray-500">
                      {accountsCount} cuentas • {payoutsCount} payouts
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      kyc.status ? 'badge-green' : 'badge-gray'
                    }`}
                  >
                    {kyc.status ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;