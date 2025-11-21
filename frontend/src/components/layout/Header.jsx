// frontend/src/components/layout/Header.jsx

import React from 'react';
import { TrendingUp } from 'lucide-react';

function Header({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cycles', label: 'Ciclos' },
    { id: 'calculos', label: 'Cálculos' },
    { id: 'accounts', label: 'Cuentas' },
    { id: 'trades', label: 'Trades' },
    { id: 'investors', label: 'Inversores' },
    { id: 'kyc', label: 'KYC' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">GT FUNDS</span>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;