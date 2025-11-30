import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TaskForm from '../../components/TaskForm';
import { useTaskContext } from '../../context/TaskContext';

// Mock the useTaskContext hook
vi.mock('../../context/TaskContext');

const mockAddTask = vi.fn();

const renderTaskForm = () => {
  useTaskContext.mockReturnValue({
    addTask: mockAddTask,
    tasks: [],
    filter: 'all',
    filteredTasks: [],
    toggleTaskCompletion: vi.fn(),
    deleteTask: vi.fn(),
    setFilter: vi.fn()
  });

  return render(<TaskForm />);
};

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddTask.mockClear();
  });

  describe('Rendering', () => {
    it('renders input field with placeholder', () => {
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders submit button', () => {
      renderTaskForm();
      
      const button = screen.getByRole('button', { name: /add task/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('has proper accessibility attributes', () => {
      renderTaskForm();
      
      const input = screen.getByLabelText('New task title');
      expect(input).toBeInTheDocument();
      
      const button = screen.getByLabelText('Add task');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Input handling', () => {
    it('updates input value when user types', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      
      await user.type(input, 'New task');
      
      expect(input).toHaveValue('New task');
    });

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      // Submit empty form to trigger error
      await user.click(button);
      expect(screen.getByText('Task title cannot be empty')).toBeInTheDocument();
      
      // Start typing to clear error
      await user.type(input, 'a');
      expect(screen.queryByText('Task title cannot be empty')).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('calls addTask with trimmed value on valid submission', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.type(input, '  Valid task  ');
      await user.click(button);
      
      expect(mockAddTask).toHaveBeenCalledWith('Valid task');
    });

    it('clears input after successful submission', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.type(input, 'Valid task');
      await user.click(button);
      
      expect(input).toHaveValue('');
    });

    it('can be submitted by pressing Enter', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      
      await user.type(input, 'Valid task');
      await user.keyboard('{Enter}');
      
      expect(mockAddTask).toHaveBeenCalledWith('Valid task');
    });
  });

  describe('Validation', () => {
    it('shows error for empty input', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.click(button);
      
      expect(screen.getByText('Task title cannot be empty')).toBeInTheDocument();
      expect(mockAddTask).not.toHaveBeenCalled();
    });

    it('shows error for whitespace-only input', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.type(input, '   ');
      await user.click(button);
      
      expect(screen.getByText('Task title cannot be empty')).toBeInTheDocument();
      expect(mockAddTask).not.toHaveBeenCalled();
    });

    it('adds error class to input when validation fails', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.click(button);
      
      expect(input).toHaveClass('error');
    });

    it('removes error class when validation passes', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      // Trigger error
      await user.click(button);
      expect(input).toHaveClass('error');
      
      // Fix error
      await user.type(input, 'Valid task');
      await user.click(button);
      
      expect(input).not.toHaveClass('error');
    });
  });

  describe('Error display', () => {
    it('displays error message with proper accessibility attributes', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.click(button);
      
      const errorMessage = screen.getByText('Task title cannot be empty');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      expect(errorMessage).toHaveAttribute('id', 'task-error');
      
      expect(input).toHaveAttribute('aria-describedby', 'task-error');
    });

    it('removes error message after successful submission', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      // Trigger error
      await user.click(button);
      expect(screen.getByText('Task title cannot be empty')).toBeInTheDocument();
      
      // Fix and submit
      await user.type(input, 'Valid task');
      await user.click(button);
      
      expect(screen.queryByText('Task title cannot be empty')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles form submission when addTask throws error', async () => {
      const user = userEvent.setup();
      mockAddTask.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.type(input, 'Valid task');
      await user.click(button);
      
      // The error should be handled gracefully and displayed
      expect(mockAddTask).toHaveBeenCalledWith('Valid task');
      expect(screen.getByText('Test error')).toBeInTheDocument();
      
      // Input should not be cleared when there's an error
      expect(input).toHaveValue('Valid task');
    });

    it('trims whitespace correctly', async () => {
      const user = userEvent.setup();
      renderTaskForm();
      
      const input = screen.getByPlaceholderText('Enter a new task...');
      const button = screen.getByRole('button', { name: /add task/i });
      
      await user.type(input, '  \t\n  Task with whitespace  \t\n  ');
      await user.click(button);
      
      expect(mockAddTask).toHaveBeenCalledWith('Task with whitespace');
    });
  });
});