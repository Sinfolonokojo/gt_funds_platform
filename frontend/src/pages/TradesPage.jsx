// frontend/src/pages/TradesPage.jsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, Filter, BarChart3, Calendar, Activity, Target, DollarSign, PieChart } from 'lucide-react';
import axios from 'axios';

function TradesPage({ kycs, cycles }) {
  const [tiros, setTiros] = useState([]);
  const [filteredTiros, setFilteredTiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');

  // Extract all accounts from kycs
  const accounts = kycs.flatMap(kyc =>
    Array.isArray(kyc.accounts) ? kyc.accounts : []
  );

  // Fetch tiros data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tirosRes = await axios.get('http://127.0.0.1:8000/api/v1/tiros/');
        setTiros(tirosRes.data);
      } catch (error) {
        console.error('Error fetching tiros:', error);
        setTiros([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Enrich tiros with additional data
  const enrichedTiros = tiros.map(tiro => {
    const cycle = cycles.find(c => c.id === tiro.cycleId);

    // Get account info for first accounts in each leg (for summary display)
    const leg1FirstAccountId = tiro.leg1.accounts?.[0]?.accountId;
    const leg2FirstAccountId = tiro.leg2.accounts?.[0]?.accountId;

    const leg1Account = leg1FirstAccountId ? accounts.find(a => a.id === leg1FirstAccountId) : null;
    const leg2Account = leg2FirstAccountId ? accounts.find(a => a.id === leg2FirstAccountId) : null;

    // Calculate total operations
    const totalOps = (tiro.leg1.accounts?.reduce((sum, acc) => sum + (acc.operations?.length || 0), 0) || 0) +
                     (tiro.leg2.accounts?.reduce((sum, acc) => sum + (acc.operations?.length || 0), 0) || 0);

    return {
      ...tiro,
      cycleName: cycle?.name || 'N/A',
      cycleStatus: cycle?.status || 'N/A',
      leg1_summary: leg1Account?.accountNumber || (leg1FirstAccountId ? leg1FirstAccountId.slice(-6) : 'N/A'),
      leg2_summary: leg2Account?.accountNumber || (leg2FirstAccountId ? leg2FirstAccountId.slice(-6) : 'N/A'),
      leg1_accountCount: tiro.leg1.accounts?.length || 0,
      leg2_accountCount: tiro.leg2.accounts?.length || 0,
      totalOperations: totalOps
    };
  });

  // Apply filters
  useEffect(() => {
    let filtered = enrichedTiros;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tiro =>
        tiro.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tiro.leg1_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tiro.leg2_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tiro.cycleName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tiro => tiro.status === statusFilter);
    }

    // Cycle filter
    if (cycleFilter !== 'all') {
      filtered = filtered.filter(tiro => tiro.cycleId === cycleFilter);
    }

    setFilteredTiros(filtered);
  }, [searchTerm, statusFilter, cycleFilter, enrichedTiros.length, tiros]);

  // Calculate statistics
  const stats = {
    total: filteredTiros.length,
    abiertos: filteredTiros.filter(t => t.status === 'Abierto').length,
    cerrados: filteredTiros.filter(t => t.status === 'Cerrado').length,
    resultadoTotal: filteredTiros
      .filter(t => t.result !== null && t.result !== undefined)
      .reduce((sum, t) => sum + t.result, 0),
    winRate: (() => {
      const closedWithResult = filteredTiros.filter(t => t.status === 'Cerrado' && t.result !== null);
      if (closedWithResult.length === 0) return 0;
      const wins = closedWithResult.filter(t => t.result > 0).length;
      return ((wins / closedWithResult.length) * 100).toFixed(1);
    })()
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trades</h1>
          <p className="text-gray-500 mt-1">Gestión y seguimiento de tiros</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tiros */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tiros</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Abiertos */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Abiertos</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.abiertos}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Cerrados */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cerrados</p>
              <p className="mt-2 text-3xl font-bold text-gray-700">{stats.cerrados}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Target className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Win Rate</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.winRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <PieChart className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Resultado Total */}
        <div className={`bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
          stats.resultadoTotal >= 0 ? 'border-green-100' : 'border-red-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resultado</p>
              <p className={`mt-2 text-3xl font-bold ${
                stats.resultadoTotal >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${stats.resultadoTotal.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              stats.resultadoTotal >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                stats.resultadoTotal >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por símbolo, cuenta, ciclo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="Abierto">Abiertos</option>
              <option value="Cerrado">Cerrados</option>
            </select>
          </div>

          {/* Cycle Filter */}
          <div>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todos los ciclos</option>
              {cycles.map(cycle => (
                <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trades Cards */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-500 mt-4">Cargando trades...</p>
        </div>
      ) : filteredTiros.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
            <TrendingUp className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No hay trades registrados
          </h2>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || cycleFilter !== 'all'
              ? 'No se encontraron resultados con los filtros aplicados.'
              : 'Aún no hay trades en el sistema.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTiros.map(tiro => (
            <div
              key={tiro.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{tiro.symbol}</span>
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      tiro.status === 'Abierto'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tiro.status}
                    </span>
                  </div>
                  {tiro.result !== null && tiro.result !== undefined && (
                    <span className={`text-lg font-bold ${
                      tiro.result >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tiro.result >= 0 ? '+' : ''}${tiro.result.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body - Legs */}
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Leg 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${
                        tiro.leg1.direction === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tiro.leg1.direction === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Leg 1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tiro.leg1_summary}</p>
                      <p className="text-xs text-gray-500">{tiro.leg1_accountCount} cuenta(s)</p>
                    </div>
                  </div>

                  {/* Leg 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${
                        tiro.leg2.direction === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tiro.leg2.direction === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Leg 2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tiro.leg2_summary}</p>
                      <p className="text-xs text-gray-500">{tiro.leg2_accountCount} cuenta(s)</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">{new Date(tiro.openDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs">{tiro.totalOperations} ops</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{tiro.cycleName}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TradesPage;
