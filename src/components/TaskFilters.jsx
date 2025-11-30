import React from 'react';
import { useTaskContext } from '../context/TaskContext';

/**
 * TaskFilters component that provides filter buttons for task visibility
 * Allows users to filter tasks by completion status
 */
export function TaskFilters() {
  const { filter, setFilter } = useTaskContext();

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' }
  ];

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <div className="task-filters" role="group" aria-label="Task filters">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`filter-button ${filter === key ? 'active' : ''}`}
          onClick={() => handleFilterChange(key)}
          aria-pressed={filter === key}
          aria-label={`Show ${label.toLowerCase()} tasks`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}