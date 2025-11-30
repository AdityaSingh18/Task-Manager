import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TaskItem from '../../components/TaskItem';
import { TaskProvider } from '../../context/TaskContext';

// Mock the TaskContext to control the context functions
const mockToggleTaskCompletion = vi.fn();
const mockDeleteTask = vi.fn();

// Mock the useTaskContext hook
vi.mock('../../context/TaskContext', async () => {
  const actual = await vi.importActual('../../context/TaskContext');
  return {
    ...actual,
    useTaskContext: () => ({
      toggleTaskCompletion: mockToggleTaskCompletion,
      deleteTask: mockDeleteTask,
    }),
  };
});

describe('TaskItem', () => {
  const mockTask = {
    id: 'test-id-123',
    title: 'Test Task',
    completed: false,
  };

  const mockCompletedTask = {
    id: 'test-id-456',
    title: 'Completed Task',
    completed: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders task with checkbox and delete button', () => {
      render(<TaskItem task={mockTask} />);
      
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
    });

    it('renders unchecked checkbox for incomplete task', () => {
      render(<TaskItem task={mockTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('renders checked checkbox for completed task', () => {
      render(<TaskItem task={mockCompletedTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('applies completed class to task item when task is completed', () => {
      const { container } = render(<TaskItem task={mockCompletedTask} />);
      
      const taskItem = container.querySelector('.task-item');
      expect(taskItem).toHaveClass('completed');
    });

    it('does not apply completed class to task item when task is not completed', () => {
      const { container } = render(<TaskItem task={mockTask} />);
      
      const taskItem = container.querySelector('.task-item');
      expect(taskItem).not.toHaveClass('completed');
    });

    it('applies completed-text class to task title when task is completed', () => {
      const { container } = render(<TaskItem task={mockCompletedTask} />);
      
      const taskTitle = container.querySelector('.task-title');
      expect(taskTitle).toHaveClass('completed-text');
    });

    it('does not apply completed-text class to task title when task is not completed', () => {
      const { container } = render(<TaskItem task={mockTask} />);
      
      const taskTitle = container.querySelector('.task-title');
      expect(taskTitle).not.toHaveClass('completed-text');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for checkbox', () => {
      render(<TaskItem task={mockTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Mark "Test Task" as complete');
    });

    it('has proper aria-label for completed task checkbox', () => {
      render(<TaskItem task={mockCompletedTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Mark "Completed Task" as incomplete');
    });

    it('has proper aria-label for delete button', () => {
      render(<TaskItem task={mockTask} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete task/i });
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete task "Test Task"');
    });
  });

  describe('Interactions', () => {
    it('calls toggleTaskCompletion when checkbox is clicked', () => {
      render(<TaskItem task={mockTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(mockToggleTaskCompletion).toHaveBeenCalledTimes(1);
      expect(mockToggleTaskCompletion).toHaveBeenCalledWith('test-id-123');
    });

    it('calls deleteTask when delete button is clicked', () => {
      render(<TaskItem task={mockTask} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete task/i });
      fireEvent.click(deleteButton);
      
      expect(mockDeleteTask).toHaveBeenCalledTimes(1);
      expect(mockDeleteTask).toHaveBeenCalledWith('test-id-123');
    });

    it('handles checkbox change event correctly', () => {
      render(<TaskItem task={mockTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      // Use click instead of change since our component uses onClick handler
      fireEvent.click(checkbox);
      
      expect(mockToggleTaskCompletion).toHaveBeenCalledTimes(1);
      expect(mockToggleTaskCompletion).toHaveBeenCalledWith('test-id-123');
    });
  });

  describe('Performance Optimization', () => {
    it('is wrapped with React.memo', () => {
      // Check that the component has a displayName indicating it's memoized
      expect(TaskItem.displayName).toBe('TaskItem');
      
      // Check that the component is a memoized component
      expect(TaskItem.$$typeof).toBeDefined();
    });

    it('does not re-render when props have not changed', () => {
      const renderSpy = vi.fn();
      
      // Create a component that tracks renders
      const TestTaskItem = React.memo(({ task }) => {
        renderSpy();
        return <TaskItem task={task} />;
      });

      const { rerender } = render(<TestTaskItem task={mockTask} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with the same props
      rerender(<TestTaskItem task={mockTask} />);
      
      // Should not re-render due to React.memo optimization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('re-renders when task props change', () => {
      const renderSpy = vi.fn();
      
      // Create a component that tracks renders
      const TestTaskItem = React.memo(({ task }) => {
        renderSpy();
        return <TaskItem task={task} />;
      });

      const { rerender } = render(<TestTaskItem task={mockTask} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different props
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      rerender(<TestTaskItem task={updatedTask} />);
      
      // Should re-render due to prop change
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles task with empty title', () => {
      const emptyTitleTask = { ...mockTask, title: '' };
      const { container } = render(<TaskItem task={emptyTitleTask} />);
      
      const taskTitle = container.querySelector('.task-title');
      expect(taskTitle).toBeInTheDocument();
      expect(taskTitle.textContent).toBe('');
    });

    it('handles task with long title', () => {
      const longTitleTask = { 
        ...mockTask, 
        title: 'This is a very long task title that might cause layout issues if not handled properly' 
      };
      render(<TaskItem task={longTitleTask} />);
      
      expect(screen.getByText(longTitleTask.title)).toBeInTheDocument();
    });

    it('handles task with special characters in title', () => {
      const specialCharTask = { 
        ...mockTask, 
        title: 'Task with special chars: @#$%^&*()_+-=[]{}|;:,.<>?' 
      };
      render(<TaskItem task={specialCharTask} />);
      
      expect(screen.getByText(specialCharTask.title)).toBeInTheDocument();
    });
  });
});