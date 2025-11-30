import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Helper function to generate large task datasets
const generateTasks = (count) => {
  const tasks = [];
  for (let i = 0; i < count; i++) {
    tasks.push({
      id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
      title: `Task ${i + 1}`,
      completed: i % 3 === 0 // Every third task is completed
    });
  }
  return tasks;
};

describe('Final Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Reset crypto.randomUUID mock
    let counter = 0;
    global.crypto.randomUUID.mockImplementation(() => `550e8400-e29b-41d4-a716-44665544${String(counter++).padStart(4, '0')}`);
  });

  describe('Complete Task CRUD Workflow', () => {
    test('full task lifecycle operations', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // CREATE: Add multiple tasks
      const taskTitles = ['Buy groceries', 'Walk the dog', 'Finish project'];
      
      for (const title of taskTitles) {
        await user.clear(taskInput);
        await user.type(taskInput, title);
        await user.click(addButton);
      }
      
      // READ: Verify all tasks are displayed
      for (const title of taskTitles) {
        expect(screen.getByText(title)).toBeInTheDocument();
      }
      
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: /delete task/i })).toHaveLength(3);
      
      // UPDATE: Toggle completion status
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      // DELETE: Remove a task
      const deleteButtons = screen.getAllByRole('button', { name: /delete task/i });
      fireEvent.click(deleteButtons[1]);
      
      // Verify task was removed
      expect(screen.queryByText('Walk the dog')).not.toBeInTheDocument();
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Finish project')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });

    test('localStorage persistence works correctly', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add task and verify localStorage call
      await user.type(taskInput, 'Test persistence');
      await user.click(addButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tasks',
        expect.stringContaining('Test persistence')
      );
      
      // Toggle completion and verify localStorage call
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tasks',
        expect.stringContaining('"completed":true')
      );
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Create test data: some completed, some pending
      const tasks = [
        { title: 'Completed task 1', shouldComplete: true },
        { title: 'Pending task 1', shouldComplete: false },
        { title: 'Completed task 2', shouldComplete: true },
        { title: 'Pending task 2', shouldComplete: false }
      ];
      
      for (const task of tasks) {
        await user.clear(taskInput);
        await user.type(taskInput, task.title);
        await user.click(addButton);
        
        if (task.shouldComplete) {
          const checkboxes = screen.getAllByRole('checkbox');
          fireEvent.click(checkboxes[checkboxes.length - 1]);
        }
      }
    });

    test('all filter shows all tasks', async () => {
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      await user.click(allButton);
      
      expect(screen.getByText('Completed task 1')).toBeInTheDocument();
      expect(screen.getByText('Pending task 1')).toBeInTheDocument();
      expect(screen.getByText('Completed task 2')).toBeInTheDocument();
      expect(screen.getByText('Pending task 2')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    });

    test('completed filter shows only completed tasks', async () => {
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      expect(screen.getByText('Completed task 1')).toBeInTheDocument();
      expect(screen.getByText('Completed task 2')).toBeInTheDocument();
      expect(screen.queryByText('Pending task 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Pending task 2')).not.toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });

    test('pending filter shows only pending tasks', async () => {
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      await user.click(pendingButton);
      
      expect(screen.queryByText('Completed task 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed task 2')).not.toBeInTheDocument();
      expect(screen.getByText('Pending task 1')).toBeInTheDocument();
      expect(screen.getByText('Pending task 2')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });
  });

  describe('Form Validation', () => {
    test('prevents empty task submission', async () => {
      render(<App />);
      
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Try to submit empty form
      await user.click(addButton);
      
      expect(screen.getByText(/task title cannot be empty/i)).toBeInTheDocument();
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
    });

    test('trims whitespace from task titles', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      await user.type(taskInput, '   Task with whitespace   ');
      await user.click(addButton);
      
      expect(screen.getByText('Task with whitespace')).toBeInTheDocument();
    });

    test('handles special characters correctly', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      const specialTitle = 'Task with "quotes" & symbols @#$%';
      
      await user.type(taskInput, specialTitle);
      await user.click(addButton);
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });

  describe('Performance with Large Datasets', () => {
    test('handles moderate task lists efficiently', async () => {
      const tasks = generateTasks(25);
      mockLocalStorage.setItem('tasks', JSON.stringify(tasks));
      
      render(<App />);
      
      // Verify all tasks are rendered
      expect(screen.getAllByRole('checkbox')).toHaveLength(25);
      
      // Test filter functionality
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      // Should show correct number of completed tasks (every third task)
      expect(screen.getAllByRole('checkbox')).toHaveLength(9); // 25/3 rounded up
      
      // Test adding new task
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      await user.type(taskInput, 'New task');
      await user.click(addButton);
      
      // Switch back to all filter to see new task
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      await user.click(allButton);
      
      expect(screen.getAllByRole('checkbox')).toHaveLength(26);
    });

    test('localStorage operations work with larger datasets', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add multiple tasks rapidly
      for (let i = 0; i < 10; i++) {
        await user.clear(taskInput);
        await user.type(taskInput, `Task ${i + 1}`);
        await user.click(addButton);
      }
      
      // Verify all tasks were added
      expect(screen.getAllByRole('checkbox')).toHaveLength(10);
      
      // Verify localStorage was called for each addition
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Handling', () => {
    test('handles corrupted localStorage gracefully', () => {
      mockLocalStorage.setItem('tasks', 'invalid-json');
      mockLocalStorage.setItem('filter', 'invalid-filter');
      
      expect(() => render(<App />)).not.toThrow();
      
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('loads existing data from localStorage correctly', () => {
      const existingTasks = [
        { id: '550e8400-e29b-41d4-a716-446655440001', title: 'Existing task', completed: false }
      ];
      
      mockLocalStorage.setItem('tasks', JSON.stringify(existingTasks));
      mockLocalStorage.setItem('filter', JSON.stringify('all'));
      
      render(<App />);
      
      expect(screen.getByText('Existing task')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    });
  });
});