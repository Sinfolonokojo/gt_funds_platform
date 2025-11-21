// frontend/src/components/shared/EmptyState.jsx

import React from 'react';
import { Inbox, Search, FileX, Database } from 'lucide-react';

function EmptyState({
  icon: CustomIcon,
  title = 'No hay datos',
  description = 'No se encontraron elementos para mostrar.',
  action,
  actionText = 'Crear nuevo',
  type = 'default' // 'default', 'search', 'error', 'filter'
}) {
  // Default icons based on type
  const getIcon = () => {
    if (CustomIcon) return CustomIcon;

    switch (type) {
      case 'search':
        return Search;
      case 'error':
        return FileX;
      case 'filter':
        return Database;
      default:
        return Inbox;
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {title}
      </h3>

      <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
        {description}
      </p>

      {action && (
        <button
          onClick={action}
          className="btn-primary"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoDataEmptyState({ onAction, actionText }) {
  return (
    <EmptyState
      type="default"
      title="No hay datos"
      description="Aún no hay elementos registrados. Comienza creando uno nuevo."
      action={onAction}
      actionText={actionText}
    />
  );
}

export function NoSearchResultsEmptyState({ searchTerm, onClear }) {
  return (
    <EmptyState
      type="search"
      title="Sin resultados"
      description={`No se encontraron resultados para "${searchTerm}". Intenta con otros términos de búsqueda.`}
      action={onClear}
      actionText="Limpiar búsqueda"
    />
  );
}

export function NoFilterResultsEmptyState({ onClear }) {
  return (
    <EmptyState
      type="filter"
      title="Sin resultados"
      description="No hay elementos que coincidan con los filtros seleccionados."
      action={onClear}
      actionText="Limpiar filtros"
    />
  );
}

export function ErrorEmptyState({ onRetry }) {
  return (
    <EmptyState
      type="error"
      title="Error al cargar"
      description="Ocurrió un error al cargar los datos. Por favor intenta de nuevo."
      action={onRetry}
      actionText="Reintentar"
    />
  );
}

export default EmptyState;
