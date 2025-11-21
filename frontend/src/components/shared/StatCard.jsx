// frontend/src/components/shared/StatCard.jsx

import React from 'react';

function StatCard({ title, value, icon, iconColor = 'text-blue-500' }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;