// frontend/src/pages/TradesPage.jsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import axios from 'axios';

function TradesPage({ kycs, cycles }) {
  const [tiros, setTiros] = useState([]);
  const [filteredTiros, setFilteredTiros] = useState([]);
  const [loading, setLoading] = useState(true);
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

    // Get account info for each leg
    const leg1Accounts = tiro.leg1.accounts?.map(acc => {
      const account = accounts.find(a => a.id === acc.accountId);
      return {
        ...acc,
        accountNumber: account?.accountNumber || acc.accountId?.slice(-6) || 'N/A'
      };
    }) || [];

    const leg2Accounts = tiro.leg2.accounts?.map(acc => {
      const account = accounts.find(a => a.id === acc.accountId);
      return {
        ...acc,
        accountNumber: account?.accountNumber || acc.accountId?.slice(-6) || 'N/A'
      };
    }) || [];

    // Calculate total operations per leg
    const leg1Ops = leg1Accounts.reduce((sum, acc) => sum + (acc.operations?.length || 0), 0);
    const leg2Ops = leg2Accounts.reduce((sum, acc) => sum + (acc.operations?.length || 0), 0);

    return {
      ...tiro,
      cycleName: cycle?.name || 'N/A',
      cycleStatus: cycle?.status || 'N/A',
      leg1Accounts,
      leg2Accounts,
      leg1Ops,
      leg2Ops
    };
  });

  // Apply cycle filter
  useEffect(() => {
    let filtered = enrichedTiros;

    if (cycleFilter !== 'all') {
      filtered = filtered.filter(tiro => tiro.cycleId === cycleFilter);
    }

    setFilteredTiros(filtered);
  }, [cycleFilter, enrichedTiros.length, tiros]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trades</h1>
          <p className="text-gray-500 mt-1">Detalle de tiros</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Cycle Filter */}
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Todos los ciclos</option>
            {cycles.map(cycle => (
              <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
            ))}
          </select>
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-gray-500 mt-4">Cargando trades...</p>
          </div>
        ) : filteredTiros.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <TrendingUp className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No hay trades registrados
            </h2>
            <p className="text-gray-500">
              {cycleFilter !== 'all'
                ? 'No se encontraron trades para el ciclo seleccionado.'
                : 'Aún no hay trades en el sistema.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Símbolo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ciclo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Leg 1
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Leg 2
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha Apertura
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha Cierre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTiros.map(tiro => (
                  <tr key={tiro.id} className="hover:bg-gray-50 transition-colors">
                    {/* Symbol */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{tiro.symbol}</span>
                    </td>

                    {/* Cycle */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tiro.cycleName}</p>
                        <p className="text-xs text-gray-500">{tiro.cycleStatus}</p>
                      </div>
                    </td>

                    {/* Leg 1 */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded ${tiro.leg1.direction === 'BUY' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tiro.leg1.direction === 'BUY' ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-gray-700">{tiro.leg1.direction}</p>
                          <p className="text-gray-500">{tiro.leg1Accounts.length} cuenta(s)</p>
                          <p className="text-gray-500">{tiro.leg1Ops} ops</p>
                          <div className="mt-1 space-y-0.5">
                            {tiro.leg1Accounts.map((acc, idx) => (
                              <p key={idx} className="text-gray-600">{acc.accountNumber}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Leg 2 */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded ${tiro.leg2.direction === 'BUY' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tiro.leg2.direction === 'BUY' ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-gray-700">{tiro.leg2.direction}</p>
                          <p className="text-gray-500">{tiro.leg2Accounts.length} cuenta(s)</p>
                          <p className="text-gray-500">{tiro.leg2Ops} ops</p>
                          <div className="mt-1 space-y-0.5">
                            {tiro.leg2Accounts.map((acc, idx) => (
                              <p key={idx} className="text-gray-600">{acc.accountNumber}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Open Date */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {new Date(tiro.openDate).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </td>

                    {/* Close Date */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {tiro.closeDate ? (
                        <span className="text-sm text-gray-900">
                          {new Date(tiro.closeDate).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        tiro.status === 'Abierto'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {tiro.status}
                      </span>
                    </td>

                    {/* Result */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {tiro.result !== null && tiro.result !== undefined ? (
                        <span className={`text-sm font-bold ${
                          tiro.result >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tiro.result >= 0 ? '+' : ''}${tiro.result.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
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
