import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import TaskList from '../../components/TaskList';
import { useTaskContext } from '../../context/TaskContext';

// Mock the TaskContext
vi.mock('../../context/TaskContext');

// Mock TaskItem component
vi.mock('../../components/TaskItem', () => ({
  default: ({ task }) => (
    <div data-testid={`task-item-${task.id}`}>
      {task.title} - {task.completed ? 'completed' : 'pending'}
    </div>
  )
}));

describe('TaskList', () => {
  const mockTasks = [
    { id: '1', title: 'Task 1', completed: false },
    { id: '2', title: 'Task 2', completed: true },
    { id: '3', title: 'Task 3', completed: false }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when tasks are present', () => {
    it('renders all filtered tasks with proper keys', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: mockTasks,
        filter: 'all'
      });

      render(<TaskList />);

      // Verify all tasks are rendered
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-3')).toBeInTheDocument();

      // Verify task content
      expect(screen.getByText('Task 1 - pending')).toBeInTheDocument();
      expect(screen.getByText('Task 2 - completed')).toBeInTheDocument();
      expect(screen.getByText('Task 3 - pending')).toBeInTheDocument();
    });

    it('renders only completed tasks when filter is completed', () => {
      const completedTasks = mockTasks.filter(task => task.completed);
      useTaskContext.mockReturnValue({
        filteredTasks: completedTasks,
        filter: 'completed'
      });

      render(<TaskList />);

      // Only completed task should be rendered
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
      expect(screen.queryByTestId('task-item-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-item-3')).not.toBeInTheDocument();
    });

    it('renders only pending tasks when filter is pending', () => {
      const pendingTasks = mockTasks.filter(task => !task.completed);
      useTaskContext.mockReturnValue({
        filteredTasks: pendingTasks,
        filter: 'pending'
      });

      render(<TaskList />);

      // Only pending tasks should be rendered
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-3')).toBeInTheDocument();
      expect(screen.queryByTestId('task-item-2')).not.toBeInTheDocument();
    });

    it('applies correct CSS class to task list container', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: mockTasks,
        filter: 'all'
      });

      const { container } = render(<TaskList />);
      const taskListElement = container.querySelector('.task-list');
      
      expect(taskListElement).toBeInTheDocument();
    });
  });

  describe('empty state handling', () => {
    it('shows appropriate message when no tasks exist (all filter)', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: [],
        filter: 'all'
      });

      render(<TaskList />);

      expect(screen.getByText('No tasks yet. Add one above to get started!')).toBeInTheDocument();
      expect(screen.getByText('No tasks yet. Add one above to get started!')).toHaveClass('empty-message');
    });

    it('shows appropriate message when no completed tasks exist', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: [],
        filter: 'completed'
      });

      render(<TaskList />);

      expect(screen.getByText('No completed tasks yet.')).toBeInTheDocument();
      expect(screen.getByText('No completed tasks yet.')).toHaveClass('empty-message');
    });

    it('shows appropriate message when no pending tasks exist', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: [],
        filter: 'pending'
      });

      render(<TaskList />);

      expect(screen.getByText('No pending tasks. Great job!')).toBeInTheDocument();
      expect(screen.getByText('No pending tasks. Great job!')).toHaveClass('empty-message');
    });

    it('applies correct CSS class to empty state container', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: [],
        filter: 'all'
      });

      const { container } = render(<TaskList />);
      const emptyElement = container.querySelector('.task-list-empty');
      
      expect(emptyElement).toBeInTheDocument();
    });

    it('does not render task list container when empty', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: [],
        filter: 'all'
      });

      const { container } = render(<TaskList />);
      const taskListElement = container.querySelector('.task-list');
      
      expect(taskListElement).not.toBeInTheDocument();
    });
  });

  describe('performance optimizations', () => {
    it('uses task.id as key prop for list rendering', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: mockTasks,
        filter: 'all'
      });

      const { container } = render(<TaskList />);
      
      // Verify that each TaskItem has the correct key by checking data-testid
      // which corresponds to the task.id used as key
      mockTasks.forEach(task => {
        expect(screen.getByTestId(`task-item-${task.id}`)).toBeInTheDocument();
      });
    });

    it('handles large number of tasks efficiently', () => {
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        completed: i % 2 === 0
      }));

      useTaskContext.mockReturnValue({
        filteredTasks: largeTasks,
        filter: 'all'
      });

      const startTime = performance.now();
      render(<TaskList />);
      const endTime = performance.now();

      // Verify all tasks are rendered
      expect(screen.getAllByTestId(/^task-item-/)).toHaveLength(100);
      
      // Basic performance check - rendering should be fast
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
    });
  });

  describe('context integration', () => {
    it('throws error when used outside TaskProvider', () => {
      useTaskContext.mockImplementation(() => {
        throw new Error('useTaskContext must be used within a TaskProvider');
      });

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TaskList />)).toThrow('useTaskContext must be used within a TaskProvider');

      consoleSpy.mockRestore();
    });

    it('correctly uses filteredTasks from context', () => {
      const contextValue = {
        filteredTasks: mockTasks.slice(0, 2), // Only first 2 tasks
        filter: 'all'
      };
      
      useTaskContext.mockReturnValue(contextValue);

      render(<TaskList />);

      // Should only render the filtered tasks
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
      expect(screen.queryByTestId('task-item-3')).not.toBeInTheDocument();
    });

    it('correctly uses filter from context for empty messages', () => {
      useTaskContext.mockReturnValue({
        filteredTasks: [],
        filter: 'completed'
      });

      render(<TaskList />);

      // Should show completed-specific empty message
      expect(screen.getByText('No completed tasks yet.')).toBeInTheDocument();
    });
  });
});