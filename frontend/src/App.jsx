// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Importar servicios
import { cyclesAPI, loadAllKycsWithRelations } from './services/api';

// Importar componentes de layout
import Header from './components/layout/header';
import ErrorBoundary from './components/shared/ErrorBoundary';


// Importar páginas
import Dashboard from './pages/Dashboard';
import CyclesPage from './pages/CyclesPage';
import CalculosPage from './pages/CalculosPage';
import KYCPage from './pages/KYCPage';
import AccountsPage from './pages/AccountsPage';
import TradesPage from './pages/TradesPage';
import InvestorsPage from './pages/InvestorsPage';

function App() {
  // Estado global de la aplicación
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kycs, setKycs] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar todos los datos al inicio
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [kycData, cycleData] = await Promise.all([
          loadAllKycsWithRelations(),
          cyclesAPI.getAll()
        ]);

        setKycs(kycData);
        setCycles(cycleData);
      } catch (error) {
        console.error("Error al cargar los datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Función para recargar KYCs (después de CRUD)
  const reloadKycs = async () => {
    try {
      const kycData = await loadAllKycsWithRelations();
      setKycs(kycData);
    } catch (error) {
      console.error("Error al recargar KYCs:", error);
    }
  };

  // Función para recargar Cycles (después de CRUD)
  const reloadCycles = async () => {
    try {
      const cycleData = await cyclesAPI.getAll();
      setCycles(cycleData);
    } catch (error) {
      console.error("Error al recargar Cycles:", error);
    }
  };

  // Calcular estadísticas globales
  const calculateStats = () => {
    // Total AUM (suma de accountSize de todas las cuentas)
    const totalAUM = kycs.reduce((total, kyc) => {
      const accountsArray = Array.isArray(kyc.accounts) ? kyc.accounts : [];
      const kycAum = accountsArray.reduce((sum, acc) => sum + (acc.accountSize || 0), 0);
      return total + kycAum;
    }, 0);

    // Total de cuentas
    const totalAccounts = kycs.reduce((sum, kyc) => {
      const accountsArray = Array.isArray(kyc.accounts) ? kyc.accounts : [];
      return sum + accountsArray.length;
    }, 0);

    // Total de KYCs (clientes verificados)
    const totalKycs = kycs.length;

    // Total de Cycles
    const totalCycles = cycles.length;

    return {
      totalAUM,
      totalAccounts,
      totalKycs,
      totalCycles
    };
  };

  const stats = calculateStats();

  // Mostrar loading mientras cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Cargando GT Funds...</div>
          <div className="text-gray-500">Por favor espera un momento</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          {/* Header con navegación */}
          <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard stats={stats} kycs={kycs} cycles={cycles} />
        )}

        {activeTab === 'cycles' && (
          <CyclesPage
            cycles={cycles}
            onReload={reloadCycles}
          />
        )}

        {activeTab === 'calculos' && (
          <CalculosPage
            cycles={cycles}
          />
        )}

        {activeTab === 'kyc' && (
          <KYCPage
            kycs={kycs}
            cycles={cycles}
            onReload={reloadKycs}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsPage
            kycs={kycs}
            cycles={cycles}
            onReload={reloadKycs}
          />
        )}

        {activeTab === 'trades' && (
          <TradesPage
            kycs={kycs}
            cycles={cycles}
          />
        )}

        {activeTab === 'investors' && (
          <InvestorsPage />
        )}
      </main>

        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;