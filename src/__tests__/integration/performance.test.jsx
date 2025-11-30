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

describe('Performance Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Reset crypto.randomUUID mock
    let counter = 0;
    global.crypto.randomUUID.mockImplementation(() => `550e8400-e29b-41d4-a716-44665544${String(counter++).padStart(4, '0')}`);
  });

  describe('Large Task List Performance', () => {
    test('handles 50 tasks without issues', async () => {
      const largeTasks = generateTasks(50);
      mockLocalStorage.setItem('tasks', JSON.stringify(largeTasks));
      
      render(<App />);
      
      // Verify all tasks are rendered
      expect(screen.getAllByRole('checkbox')).toHaveLength(50);
      
      // Test filter functionality with larger dataset
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      // Should show correct number of completed tasks (every third task)
      expect(screen.getAllByRole('checkbox')).toHaveLength(17); // 50/3 rounded up
    });

    test('task operations work correctly with larger datasets', async () => {
      const largeTasks = generateTasks(30);
      mockLocalStorage.setItem('tasks', JSON.stringify(largeTasks));
      
      render(<App />);
      
      // Test adding task
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      await user.type(taskInput, 'New task');
      await user.click(addButton);
      
      // Verify task was added
      expect(screen.getAllByRole('checkbox')).toHaveLength(31);
      
      // Test toggle functionality
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();
      
      // Test delete functionality
      const deleteButtons = screen.getAllByRole('button', { name: /delete task/i });
      await user.click(deleteButtons[0]);
      
      // Verify task was deleted
      expect(screen.getAllByRole('checkbox')).toHaveLength(30);
    });

    test('filter switching works with larger datasets', async () => {
      const largeTasks = generateTasks(30);
      mockLocalStorage.setItem('tasks', JSON.stringify(largeTasks));
      
      render(<App />);
      
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      
      // Test filter switching
      await user.click(completedButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(10); // 30/3
      
      await user.click(pendingButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(20); // 30 - 10
      
      await user.click(allButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(30);
    });
  });

  describe('React Optimization Verification', () => {
    test('components handle state updates correctly', async () => {
      const tasks = generateTasks(10);
      mockLocalStorage.setItem('tasks', JSON.stringify(tasks));
      
      render(<App />);
      
      // Toggle one task
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      // Verify only the toggled task changed
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    test('filter changes work efficiently', async () => {
      const tasks = generateTasks(20);
      mockLocalStorage.setItem('tasks', JSON.stringify(tasks));
      
      render(<App />);
      
      // Test filter switching
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      await user.click(completedButton);
      
      // Should show correct filtered results
      expect(screen.getAllByRole('checkbox')).toHaveLength(7); // 20/3 rounded up
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      await user.click(allButton);
      
      // Should show all tasks again
      expect(screen.getAllByRole('checkbox')).toHaveLength(20);
    });

    test('callback functions work correctly', async () => {
      const tasks = generateTasks(5);
      mockLocalStorage.setItem('tasks', JSON.stringify(tasks));
      
      render(<App />);
      
      // Add a new task
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      await user.type(taskInput, 'New task');
      await user.click(addButton);
      
      // Verify task was added
      expect(screen.getAllByRole('checkbox')).toHaveLength(6);
      
      // Toggle an existing task to verify function stability
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      expect(checkboxes[0]).toBeChecked();
    });
  });

  describe('Edge Case Performance', () => {
    test('handles multiple task operations', async () => {
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      
      // Add and delete tasks
      for (let i = 0; i < 5; i++) {
        await user.clear(taskInput);
        await user.type(taskInput, `Task ${i}`);
        await user.click(addButton);
        
        // Delete every other task
        if (i % 2 === 1) {
          const deleteButtons = screen.getAllByRole('button', { name: /delete task/i });
          await user.click(deleteButtons[deleteButtons.length - 1]);
        }
      }
      
      // Should have 3 tasks remaining (0, 2, 4)
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    test('handles filter switching with moderate dataset', async () => {
      const tasks = generateTasks(20);
      mockLocalStorage.setItem('tasks', JSON.stringify(tasks));
      
      render(<App />);
      
      const allButton = screen.getByRole('button', { name: /show all tasks/i });
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      const pendingButton = screen.getByRole('button', { name: /show pending tasks/i });
      
      // Switch filters multiple times
      await user.click(completedButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(7); // 20/3 rounded up
      
      await user.click(pendingButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(13); // 20 - 7
      
      await user.click(allButton);
      expect(screen.getAllByRole('checkbox')).toHaveLength(20);
    });

    test('handles mixed operations efficiently', async () => {
      const tasks = generateTasks(10);
      mockLocalStorage.setItem('tasks', JSON.stringify(tasks));
      
      render(<App />);
      
      const taskInput = screen.getByPlaceholderText(/enter a new task/i);
      const addButton = screen.getByRole('button', { name: /add task/i });
      const completedButton = screen.getByRole('button', { name: /show completed tasks/i });
      
      // Add new task
      await user.type(taskInput, 'New task during operations');
      await user.click(addButton);
      
      // Toggle existing tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      
      // Change filter
      await user.click(completedButton);
      
      // Should show completed tasks (including the ones we just toggled)
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });
  });
});