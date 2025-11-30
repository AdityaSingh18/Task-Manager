import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskProvider, useTaskContext } from '../../context/TaskContext';

// Mock the useLocalStorage hook
vi.mock('../../hooks/useLocalStorage');
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Mock the Task model functions
vi.mock('../../models/Task');
import { createTask, validateTasksArray, validateFilter } from '../../models/Task';

// Test component to access context
function TestComponent({ onError }) {
  const {
    tasks,
    filter,
    filteredTasks,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    setFilter
  } = useTaskContext();

  const handleAddTask = () => {
    try {
      addTask('Test Task');
    } catch (error) {
      if (onError) onError(error);
    }
  };

  const handleSetFilter = () => {
    try {
      setFilter('completed');
    } catch (error) {
      if (onError) onError(error);
    }
  };

  return (
    <div>
      <div data-testid="tasks-count">{tasks.length}</div>
      <div data-testid="filter">{filter}</div>
      <div data-testid="filtered-count">{filteredTasks.length}</div>
      <button onClick={handleAddTask} data-testid="add-task">
        Add Task
      </button>
      <button onClick={() => toggleTaskCompletion('test-id')} data-testid="toggle-task">
        Toggle Task
      </button>
      <button onClick={() => deleteTask('test-id')} data-testid="delete-task">
        Delete Task
      </button>
      <button onClick={handleSetFilter} data-testid="set-filter">
        Set Filter
      </button>
    </div>
  );
}

describe('TaskContext', () => {
  let mockSetTasks;
  let mockSetFilter;

  beforeEach(() => {
    mockSetTasks = vi.fn();
    mockSetFilter = vi.fn();
    
    // Reset mocks
    useLocalStorage.mockClear();
    createTask.mockClear();
    validateTasksArray.mockClear();
    validateFilter.mockClear();
  });

  describe('TaskProvider', () => {
    it('should provide initial empty state', () => {
      useLocalStorage
        .mockReturnValueOnce([[], mockSetTasks]) // tasks
        .mockReturnValueOnce(['all', mockSetFilter]); // filter
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');
      expect(screen.getByTestId('filter')).toHaveTextContent('all');
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('0');
    });

    it('should provide tasks from localStorage', () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', completed: false },
        { id: '2', title: 'Task 2', completed: true }
      ];

      useLocalStorage
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      expect(screen.getByTestId('tasks-count')).toHaveTextContent('2');
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('2');
    });

    it('should handle corrupted tasks data gracefully', () => {
      const corruptedTasks = [{ invalid: 'task' }];

      useLocalStorage
        .mockReturnValueOnce([corruptedTasks, mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockImplementation(() => {
        throw new Error('Invalid tasks data');
      });
      validateFilter.mockReturnValue(true);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid tasks data in localStorage, resetting to empty array:',
        expect.any(Error)
      );
      expect(mockSetTasks).toHaveBeenCalledWith([]);
      expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');

      consoleSpy.mockRestore();
    });

    it('should handle corrupted filter data gracefully', () => {
      useLocalStorage
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce(['invalid-filter', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockImplementation(() => {
        throw new Error('Invalid filter');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid filter in localStorage, resetting to "all":',
        expect.any(Error)
      );
      expect(mockSetFilter).toHaveBeenCalledWith('all');
      expect(screen.getByTestId('filter')).toHaveTextContent('all');

      consoleSpy.mockRestore();
    });
  });

  describe('addTask function', () => {
    it('should add a new task successfully', () => {
      const mockTask = { id: 'new-id', title: 'New Task', completed: false };
      
      useLocalStorage
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);
      createTask.mockReturnValue(mockTask);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      act(() => {
        screen.getByTestId('add-task').click();
      });

      expect(createTask).toHaveBeenCalledWith('Test Task');
      expect(mockSetTasks).toHaveBeenCalledWith(expect.any(Function));
      
      // Test the function passed to setTasks
      const setTasksCallback = mockSetTasks.mock.calls[0][0];
      const result = setTasksCallback([]);
      expect(result).toEqual([mockTask]);
    });

    it('should handle validation errors when adding task', () => {
      useLocalStorage
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);
      createTask.mockImplementation(() => {
        throw new Error('Task title cannot be empty');
      });

      let caughtError = null;
      const handleError = (error) => {
        caughtError = error;
      };

      render(
        <TaskProvider>
          <TestComponent onError={handleError} />
        </TaskProvider>
      );

      act(() => {
        screen.getByTestId('add-task').click();
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.message).toBe('Task title cannot be empty');
    });
  });

  describe('toggleTaskCompletion function', () => {
    it('should toggle task completion status', () => {
      const mockTasks = [
        { id: 'test-id', title: 'Task 1', completed: false },
        { id: 'other-id', title: 'Task 2', completed: true }
      ];

      useLocalStorage
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      act(() => {
        screen.getByTestId('toggle-task').click();
      });

      expect(mockSetTasks).toHaveBeenCalledWith(expect.any(Function));
      
      // Test the function passed to setTasks
      const setTasksCallback = mockSetTasks.mock.calls[0][0];
      const result = setTasksCallback(mockTasks);
      
      expect(result).toEqual([
        { id: 'test-id', title: 'Task 1', completed: true }, // toggled
        { id: 'other-id', title: 'Task 2', completed: true } // unchanged
      ]);
    });
  });

  describe('deleteTask function', () => {
    it('should delete task by id', () => {
      const mockTasks = [
        { id: 'test-id', title: 'Task 1', completed: false },
        { id: 'other-id', title: 'Task 2', completed: true }
      ];

      useLocalStorage
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      act(() => {
        screen.getByTestId('delete-task').click();
      });

      expect(mockSetTasks).toHaveBeenCalledWith(expect.any(Function));
      
      // Test the function passed to setTasks
      const setTasksCallback = mockSetTasks.mock.calls[0][0];
      const result = setTasksCallback(mockTasks);
      
      expect(result).toEqual([
        { id: 'other-id', title: 'Task 2', completed: true } // test-id removed
      ]);
    });
  });

  describe('setFilter function', () => {
    it('should set filter successfully', () => {
      useLocalStorage
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      act(() => {
        screen.getByTestId('set-filter').click();
      });

      expect(validateFilter).toHaveBeenCalledWith('completed');
      expect(mockSetFilter).toHaveBeenCalledWith('completed');
    });

    it('should handle invalid filter gracefully', () => {
      useLocalStorage
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter
        .mockReturnValueOnce(true) // for initial filter validation
        .mockImplementationOnce(() => { // for setFilter call
          throw new Error('Invalid filter');
        });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let caughtError = null;
      const handleError = (error) => {
        caughtError = error;
      };

      render(
        <TaskProvider>
          <TestComponent onError={handleError} />
        </TaskProvider>
      );

      act(() => {
        screen.getByTestId('set-filter').click();
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.message).toBe('Invalid filter');
      expect(consoleSpy).toHaveBeenCalledWith('Invalid filter:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('filteredTasks computation', () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: true },
      { id: '3', title: 'Task 3', completed: false },
      { id: '4', title: 'Task 4', completed: true }
    ];

    it('should show all tasks when filter is "all"', () => {
      useLocalStorage
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce(['all', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      expect(screen.getByTestId('filtered-count')).toHaveTextContent('4');
    });

    it('should show only completed tasks when filter is "completed"', () => {
      useLocalStorage
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce(['completed', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      expect(screen.getByTestId('filtered-count')).toHaveTextContent('2');
    });

    it('should show only pending tasks when filter is "pending"', () => {
      useLocalStorage
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce(['pending', mockSetFilter]);
      
      validateTasksArray.mockReturnValue(true);
      validateFilter.mockReturnValue(true);

      render(
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      );

      expect(screen.getByTestId('filtered-count')).toHaveTextContent('2');
    });
  });

  describe('useTaskContext hook', () => {
    it('should throw error when used outside TaskProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTaskContext must be used within a TaskProvider');

      consoleSpy.mockRestore();
    });
  });
});