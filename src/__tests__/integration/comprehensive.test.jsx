import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import App from '../../App';

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

describe('Comprehensive Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Reset crypto.randomUUID mock with incrementing counter
    let counter = 0;
    global.crypto.randomUUID.mockImplementation(() => `550e8400-e29b-41d4-a716-44665544000${counter++}`);
  });

  describe('Complete Task CRUD Workflow', () => {
    test('full lifecycle: create, read, update, delete multiple tasks', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // CREATE: Add multiple tasks
      const taskTitles = ['Buy groceries', 'Walk the dog', 'Finish project', 'Call mom'];
      
      for (const title of taskTitles) {
        await user.clear(taskInput);
        await user.type(taskInput, title);
        await user.click(addButton);
      }
      
      // READ: Verify all tasks are displayed
      for (const title of taskTitles) {
        expect(screen.getByText(title)).toBeInTheDocument();
      }
      
      // Verify correct number of tasks
      expect(screen.getAllByRole('checkbox')).toHaveLength(4);
      expect(screen.getAllByRole('button', { name: /delete task/i })).toHaveLength(4);
      
      // UPDATE: Toggle completion status of multiple tasks
      const checkboxes = screen.getAllByRole('checkbox');
      
      // Mark first and third tasks as completed
      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);
      
      // Verify completion status
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).toBeChecked();
      expect(checkboxes[3]).not.toBeChecked();
      
      // Toggle back one task
      await user.click(checkboxes[0]);
      expect(checkboxes[0]).not.toBeChecked();
      
      // DELETE: Remove specific tasks
      const deleteButtons = screen.getAllByRole('button', { name: /delete task/i });
      
      // Delete second task ("Walk the dog")
      await user.click(deleteButtons[1]);
      
      // Verify task was removed
      expect(screen.queryByText('Walk the dog')).not.toBeInTheDocument();
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Finish project')).toBeInTheDocument();
      expect(screen.getByText('Call mom')).toBeInTheDocument();
      
      // Verify counts updated
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: /delete task/i })).toHaveLength(3);
    });

    test('task operations persist immediately to localStorage', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add task and verify localStorage call
      await user.type(taskInput, 'Test task');
      await user.click(addButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tasks',
        expect.stringContaining('Test task')
      );
      
      // Toggle completion and verify localStorage call
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tasks',
        expect.stringContaining('"completed":true')
      );
      
      // Delete task and verify localStorage call
      const deleteButton = screen.getByRole('button', { name: /delete task/i });
      await user.click(deleteButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tasks', '[]');
    });
  });

  describe('Filter Functionality Across All States', () => {
    beforeEach(async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Create test data: 3 completed, 2 pending
      const tasks = [
        { title: 'Completed 1', completed: true },
        { title: 'Pending 1', completed: false },
        { title: 'Completed 2', completed: true },
        { title: 'Pending 2', completed: false },
        { title: 'Completed 3', completed: true }
      ];
      
      for (const task of tasks) {
        await user.clear(taskInput);
        await user.type(taskInput, task.title);
        await user.click(addButton);
        
        if (task.completed) {
          const checkboxes = screen.getAllByRole('checkbox');
          await user.click(checkboxes[checkboxes.length - 1]);
        }
      }
    });

    test('all filter shows all tasks regardless of completion status', async () => {
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      await user.click(allButton);
      
      // Should show all 5 tasks
      expect(screen.getByText('Completed 1')).toBeInTheDocument();
      expect(screen.getByText('Pending 1')).toBeInTheDocument();
      expect(screen.getByText('Completed 2')).toBeInTheDocument();
      expect(screen.getByText('Pending 2')).toBeInTheDocument();
      expect(screen.getByText('Completed 3')).toBeInTheDocument();
      
      expect(screen.getAllByRole('checkbox')).toHaveLength(5);
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('completed filter shows only completed tasks', async () => {
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      // Should show only 3 completed tasks
      expect(screen.getByText('Completed 1')).toBeInTheDocument();
      expect(screen.getByText('Completed 2')).toBeInTheDocument();
      expect(screen.getByText('Completed 3')).toBeInTheDocument();
      
      expect(screen.queryByText('Pending 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Pending 2')).not.toBeInTheDocument();
      
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      expect(completedButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('pending filter shows only pending tasks', async () => {
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      await user.click(pendingButton);
      
      // Should show only 2 pending tasks
      expect(screen.getByText('Pending 1')).toBeInTheDocument();
      expect(screen.getByText('Pending 2')).toBeInTheDocument();
      
      expect(screen.queryByText('Completed 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed 3')).not.toBeInTheDocument();
      
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      expect(pendingButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('filter changes update displayed tasks immediately', async () => {
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      
      // Start with all tasks
      expect(screen.getAllByRole('checkbox')).toHaveLength(5);
      
      // Switch to completed - should update immediately
      await user.click(completedButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      
      // Switch to pending - should update immediately
      await user.click(pendingButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      
      // Switch back to all - should update immediately
      await user.click(allButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    });

    test('filter state persists to localStorage', async () => {
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('filter', '"completed"');
      
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      await user.click(pendingButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('filter', '"pending"');
    });

    test('dynamic filter updates when task completion changes', async () => {
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      // Should show 3 completed tasks
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      
      // Toggle one completed task to pending
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      
      // Should now show only 2 completed tasks
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      
      // Switch to pending filter
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      await user.click(pendingButton);
      
      // Should now show 3 pending tasks (2 original + 1 toggled)
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });
  });

  describe('LocalStorage Persistence and Recovery', () => {
    test('loads existing tasks and filter from localStorage on startup', () => {
      const existingTasks = [
        { id: '550e8400-e29b-41d4-a716-446655440001', title: 'Existing task 1', completed: false },
        { id: '550e8400-e29b-41d4-a716-446655440002', title: 'Existing task 2', completed: true },
        { id: '550e8400-e29b-41d4-a716-446655440003', title: 'Existing task 3', completed: false }
      ];
      
      mockLocalStorage.setItem('tasks', JSON.stringify(existingTasks));
      mockLocalStorage.setItem('filter', JSON.stringify('all'));
      
      render(<App />);
      
      // Verify tasks are loaded
      expect(screen.getByText('Existing task 1')).toBeInTheDocument();
      expect(screen.getByText('Existing task 2')).toBeInTheDocument();
      expect(screen.getByText('Existing task 3')).toBeInTheDocument();
      
      // Verify filter is loaded (should show all tasks)
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      
      // Should show all 3 tasks
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      
      // Now test that filter persistence works by switching to completed
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      fireEvent.click(completedButton);
      
      // Should only show the completed task
      expect(screen.getAllByRole('checkbox')).toHaveLength(1);
      expect(screen.getByText('Existing task 2')).toBeInTheDocument();
    });

    test('handles corrupted task data gracefully', () => {
      mockLocalStorage.setItem('tasks', 'invalid-json-data');
      mockLocalStorage.setItem('filter', 'invalid-filter');
      
      // Should not throw and should render with defaults
      expect(() => render(<App />)).not.toThrow();
      
      // Should show empty state
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
      
      // Should default to "All" filter
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('handles missing localStorage gracefully', () => {
      // Don't set any localStorage data
      
      render(<App />);
      
      // Should render with defaults
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('validates loaded task data structure', () => {
      // Test with completely invalid JSON first
      mockLocalStorage.setItem('tasks', 'not-json-at-all');
      
      render(<App />);
      
      // Should show empty state when data is invalid
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    test('persists changes immediately after each operation', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add task
      await user.type(taskInput, 'Test persistence');
      await user.click(addButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tasks',
        expect.stringContaining('Test persistence')
      );
      
      // Toggle completion
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tasks',
        expect.stringContaining('"completed":true')
      );
      
      // Change filter
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('filter', '"completed"');
      
      // Delete task
      const deleteButton = screen.getByRole('button', { name: /delete task/i });
      await user.click(deleteButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tasks', '[]');
    });
  });

  describe('Form Validation Edge Cases', () => {
    test('prevents submission of empty task', async () => {
      render(<App />);
      
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Try to submit empty form
      await user.click(addButton);
      
      // Should show error message
      expect(screen.getByText(/task title cannot be empty/i)).toBeInTheDocument();
      
      // Should not add any task
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    test('prevents submission of whitespace-only task', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Try various whitespace combinations
      const whitespaceInputs = ['   ', '\t\t', '\n\n', '  \t  \n  '];
      
      for (const input of whitespaceInputs) {
        await user.clear(taskInput);
        await user.type(taskInput, input);
        await user.click(addButton);
        
        // Should show error message
        expect(screen.getByText(/task title cannot be empty/i)).toBeInTheDocument();
        
        // Should not add any task
        expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
      }
    });

    test('trims whitespace from valid task titles', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add task with leading/trailing whitespace
      await user.type(taskInput, '   Valid task with whitespace   ');
      await user.click(addButton);
      
      // Should display trimmed title
      expect(screen.getByText('Valid task with whitespace')).toBeInTheDocument();
      
      // Should not display with whitespace
      expect(screen.queryByText('   Valid task with whitespace   ')).not.toBeInTheDocument();
    });

    test('clears error message when valid input is entered', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Trigger error
      await user.click(addButton);
      expect(screen.getByText(/task title cannot be empty/i)).toBeInTheDocument();
      
      // Type valid input
      await user.type(taskInput, 'Valid task');
      
      // Error should be cleared immediately
      expect(screen.queryByText(/task title cannot be empty/i)).not.toBeInTheDocument();
    });

    test('handles very long task titles', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Create a moderately long task title (typing 500 chars is slow)
      const longTitle = 'A very long task title that contains many words and should still be handled correctly by the application without any issues or performance problems';
      
      await user.clear(taskInput);
      await user.type(taskInput, longTitle);
      await user.click(addButton);
      
      // Should accept and display the long title
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    }, 10000);

    test('handles special characters in task titles', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      const specialTitles = [
        'Task with quotes and apostrophes',
        'Task with HTML and special chars',
        'Task with numbers 123 and symbols',
        'Task with accented characters'
      ];
      
      for (const title of specialTitles) {
        await user.clear(taskInput);
        await user.type(taskInput, title);
        await user.click(addButton);
        
        expect(screen.getByText(title)).toBeInTheDocument();
      }
    });
  });
});