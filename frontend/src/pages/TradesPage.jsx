// frontend/src/pages/TradesPage.jsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, Filter, BarChart3 } from 'lucide-react';
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trades (Tiros)</h1>
        <BarChart3 className="w-8 h-8 text-gray-400" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Tiros</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <p className="text-sm font-medium text-gray-500">Abiertos</p>
          <p className="mt-1 text-3xl font-semibold text-blue-600">{stats.abiertos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Cerrados</p>
          <p className="mt-1 text-3xl font-semibold text-gray-600">{stats.cerrados}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-green-100">
          <p className="text-sm font-medium text-gray-500">Win Rate</p>
          <p className="mt-1 text-3xl font-semibold text-green-600">{stats.winRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
          <p className="text-sm font-medium text-gray-500">Resultado Total</p>
          <p className={`mt-1 text-3xl font-semibold ${stats.resultadoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.resultadoTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por símbolo, cuenta, ciclo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Todos los ciclos</option>
              {cycles.map(cycle => (
                <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-gray-500 mt-4">Cargando trades...</p>
          </div>
        ) : filteredTiros.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-4" />
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Símbolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciclo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leg 1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leg 2</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operaciones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Apertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTiros.map(tiro => (
                  <tr key={tiro.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{tiro.symbol}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tiro.cycleName}</p>
                        <p className="text-xs text-gray-500">{tiro.cycleStatus}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {tiro.leg1.direction === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm text-gray-900">{tiro.leg1_summary}</p>
                          <p className="text-xs text-gray-500">{tiro.leg1_accountCount} cuenta(s)</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {tiro.leg2.direction === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm text-gray-900">{tiro.leg2_summary}</p>
                          <p className="text-xs text-gray-500">{tiro.leg2_accountCount} cuenta(s)</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tiro.totalOperations} ops
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(tiro.openDate).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tiro.status === 'Abierto'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tiro.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tiro.result !== null && tiro.result !== undefined ? (
                        <span className={`font-semibold ${tiro.result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${tiro.result.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TradesPage;