import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import App from '../App';
import ErrorBoundary from '../components/ErrorBoundary';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000')
  }
});

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Reset crypto.randomUUID mock
    let counter = 0;
    global.crypto.randomUUID.mockImplementation(() => `550e8400-e29b-41d4-a716-44665544000${counter++}`);
  });

  describe('Complete App Functionality', () => {
    test('renders main application layout with all components', () => {
      render(<App />);
      
      // Check header
      expect(screen.getByRole('heading', { name: /react task manager/i })).toBeInTheDocument();
      
      // Check TaskForm
      expect(screen.getByPlaceholderText(/enter a new task/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
      
      // Check TaskFilters
      expect(screen.getByRole('button', { name: /show all tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show completed tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show pending tasks/i })).toBeInTheDocument();
      
      // Check empty state message
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
    });

    test('complete task CRUD workflow', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add first task
      fireEvent.change(taskInput, { target: { value: 'First task' } });
      fireEvent.click(addButton);
      
      // Verify task was added
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
      
      // Add second task
      fireEvent.change(taskInput, { target: { value: 'Second task' } });
      fireEvent.click(addButton);
      
      // Verify both tasks are present
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      
      // Toggle completion of first task
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      // Verify task is marked as completed (checkbox should be checked)
      expect(checkboxes[0]).toBeChecked();
      
      // Delete second task
      const deleteButtons = screen.getAllByRole('button', { name: /delete task/i });
      fireEvent.click(deleteButtons[1]);
      
      // Verify only first task remains
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.queryByText('Second task')).not.toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    });

    test('filter functionality across all states', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add multiple tasks
      fireEvent.change(taskInput, { target: { value: 'Completed task' } });
      fireEvent.click(addButton);
      
      fireEvent.change(taskInput, { target: { value: 'Pending task' } });
      fireEvent.click(addButton);
      
      // Mark first task as completed
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      // Test "All" filter (default)
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Completed task')).toBeInTheDocument();
      expect(screen.getByText('Pending task')).toBeInTheDocument();
      
      // Test "Completed" filter
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      fireEvent.click(completedButton);
      
      expect(completedButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Completed task')).toBeInTheDocument();
      expect(screen.queryByText('Pending task')).not.toBeInTheDocument();
      
      // Test "Pending" filter
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      fireEvent.click(pendingButton);
      
      expect(pendingButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('Completed task')).not.toBeInTheDocument();
      expect(screen.getByText('Pending task')).toBeInTheDocument();
      
      // Return to "All" filter
      fireEvent.click(allButton);
      expect(screen.getByText('Completed task')).toBeInTheDocument();
      expect(screen.getByText('Pending task')).toBeInTheDocument();
    });

    test('localStorage persistence and recovery', async () => {
      // Mock localStorage with existing data using proper UUID format
      mockLocalStorage.setItem('tasks', JSON.stringify([
        { id: '550e8400-e29b-41d4-a716-446655440000', title: 'Existing task', completed: false }
      ]));
      mockLocalStorage.setItem('filter', JSON.stringify('all'));
      
      render(<App />);
      
      // Verify existing task is loaded
      expect(screen.getByText('Existing task')).toBeInTheDocument();
      
      // Verify filter is loaded (should show all tasks)
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      
      // Add a new task
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      fireEvent.change(taskInput, { target: { value: 'New task' } });
      fireEvent.click(addButton);
      
      // Verify localStorage was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tasks',
        expect.stringContaining('New task')
      );
    });

    test('form validation edge cases', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Test empty input
      fireEvent.click(addButton);
      expect(screen.getByText(/task title cannot be empty/i)).toBeInTheDocument();
      
      // Test whitespace-only input
      fireEvent.change(taskInput, { target: { value: '   ' } });
      fireEvent.click(addButton);
      expect(screen.getByText(/task title cannot be empty/i)).toBeInTheDocument();
      
      // Test valid input clears error
      fireEvent.change(taskInput, { target: { value: 'Valid task' } });
      expect(screen.queryByText(/task title cannot be empty/i)).not.toBeInTheDocument();
      
      fireEvent.click(addButton);
      expect(screen.getByText('Valid task')).toBeInTheDocument();
      expect(screen.queryByText(/task title cannot be empty/i)).not.toBeInTheDocument();
    });

    test('handles corrupted localStorage gracefully', () => {
      // Mock corrupted localStorage data
      mockLocalStorage.setItem('tasks', 'invalid-json');
      mockLocalStorage.setItem('filter', 'invalid-filter');
      
      // Should not throw error and should render with defaults
      render(<App />);
      
      expect(screen.getByRole('heading', { name: /react task manager/i })).toBeInTheDocument();
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
      
      // Should default to "All" filter
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Error Boundary', () => {
    // Mock console.error to avoid noise in test output
    const originalError = console.error;
    beforeAll(() => {
      console.error = vi.fn();
    });
    
    afterAll(() => {
      console.error = originalError;
    });

    test('catches and displays error boundary when component throws', () => {
      // Create a component that throws an error
      const ThrowError = ({ shouldThrow }) => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>No error</div>;
      };

      // Create a test wrapper with ErrorBoundary
      const TestWrapper = ({ shouldThrow }) => (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestWrapper shouldThrow={false} />);
      expect(screen.getByText('No error')).toBeInTheDocument();

      // Trigger error
      rerender(<TestWrapper shouldThrow={true} />);
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });
  });
});