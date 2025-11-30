import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskFilters } from '../../components/TaskFilters';
import { useTaskContext } from '../../context/TaskContext';

// Mock the useTaskContext hook
vi.mock('../../context/TaskContext');

const mockSetFilter = vi.fn();

const renderTaskFilters = (filter = 'all') => {
  useTaskContext.mockReturnValue({
    filter,
    setFilter: mockSetFilter,
    tasks: [],
    filteredTasks: [],
    addTask: vi.fn(),
    toggleTaskCompletion: vi.fn(),
    deleteTask: vi.fn()
  });
  
  return render(<TaskFilters />);
};

describe('TaskFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders all filter buttons', () => {
      renderTaskFilters();
      
      expect(screen.getByRole('button', { name: /show all tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show completed tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show pending tasks/i })).toBeInTheDocument();
    });

    test('renders with proper ARIA attributes', () => {
      renderTaskFilters();
      
      const filterGroup = screen.getByRole('group', { name: /task filters/i });
      expect(filterGroup).toBeInTheDocument();
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      expect(allButton).toHaveAttribute('type', 'button');
      
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      expect(completedButton).toHaveAttribute('aria-pressed', 'false');
      
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      expect(pendingButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('applies active class to current filter', () => {
      renderTaskFilters();
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveClass('filter-button', 'active');
      
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      expect(completedButton).toHaveClass('filter-button');
      expect(completedButton).not.toHaveClass('active');
      
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      expect(pendingButton).toHaveClass('filter-button');
      expect(pendingButton).not.toHaveClass('active');
    });
  });

  describe('Filter Interactions', () => {
    test('calls setFilter when filter button is clicked', () => {
      renderTaskFilters('all');
      
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      fireEvent.click(completedButton);
      
      expect(mockSetFilter).toHaveBeenCalledWith('completed');
      expect(mockSetFilter).toHaveBeenCalledTimes(1);
    });

    test('handles all filter button clicks', () => {
      renderTaskFilters('completed');
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      fireEvent.click(allButton);
      
      expect(mockSetFilter).toHaveBeenCalledWith('all');
    });

    test('handles pending filter button clicks', () => {
      renderTaskFilters('all');
      
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      fireEvent.click(pendingButton);
      
      expect(mockSetFilter).toHaveBeenCalledWith('pending');
    });
  });

  describe('Active Filter Highlighting', () => {
    test('highlights completed filter when active', () => {
      renderTaskFilters('completed');
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).not.toHaveClass('active');
      expect(allButton).toHaveAttribute('aria-pressed', 'false');
      
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      expect(completedButton).toHaveClass('active');
      expect(completedButton).toHaveAttribute('aria-pressed', 'true');
      
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      expect(pendingButton).not.toHaveClass('active');
      expect(pendingButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('highlights pending filter when active', () => {
      renderTaskFilters('pending');
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).not.toHaveClass('active');
      
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      expect(completedButton).not.toHaveClass('active');
      
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      expect(pendingButton).toHaveClass('active');
      expect(pendingButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Accessibility', () => {
    test('provides proper keyboard navigation', () => {
      renderTaskFilters();
      
      const buttons = screen.getAllByRole('button');
      
      // All buttons should be focusable
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });

    test('provides proper ARIA labels and roles', () => {
      renderTaskFilters();
      
      // Check group role and label
      const filterGroup = screen.getByRole('group');
      expect(filterGroup).toHaveAttribute('aria-label', 'Task filters');
      
      // Check button labels
      expect(screen.getByLabelText('Show all tasks')).toBeInTheDocument();
      expect(screen.getByLabelText('Show completed tasks')).toBeInTheDocument();
      expect(screen.getByLabelText('Show pending tasks')).toBeInTheDocument();
    });

    test('updates aria-pressed when filter changes', () => {
      renderTaskFilters('all');
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      expect(completedButton).toHaveAttribute('aria-pressed', 'false');
    });
  });
});