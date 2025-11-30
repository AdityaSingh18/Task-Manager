import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createTask, validateTasksArray, validateFilter } from '../models/Task';

const TaskContext = createContext();


export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}


export function TaskProvider({ children }) {

  const [tasks, setTasks] = useLocalStorage('tasks', []);
  const [filter, setFilterState] = useLocalStorage('filter', 'all');


  const validatedTasks = useMemo(() => {
    try {
      validateTasksArray(tasks);
      return tasks;
    } catch (error) {
      console.warn('Invalid tasks data in localStorage, resetting to empty array:', error);
      setTasks([]);
      return [];
    }
  }, [tasks, setTasks]);

  const validatedFilter = useMemo(() => {
    try {
      validateFilter(filter);
      return filter;
    } catch (error) {
      console.warn('Invalid filter in localStorage, resetting to "all":', error);
      setFilterState('all');
      return 'all';
    }
  }, [filter, setFilterState]);


  const addTask = useCallback((title) => {
    try {
      const newTask = createTask(title);
      setTasks(prevTasks => [...prevTasks, newTask]);
    } catch (error) {
      throw error;
    }
  }, [setTasks]);


  const toggleTaskCompletion = useCallback((id) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id 
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }, [setTasks]);


  const deleteTask = useCallback((id) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  }, [setTasks]);


  const setFilter = useCallback((newFilter) => {
    try {
      validateFilter(newFilter);
      setFilterState(newFilter);
    } catch (error) {
      console.error('Invalid filter:', error);
      throw error;
    }
  }, [setFilterState]);

 
  const filteredTasks = useMemo(() => {
    switch (validatedFilter) {
      case 'completed':
        return validatedTasks.filter(task => task.completed);
      case 'pending':
        return validatedTasks.filter(task => !task.completed);
      case 'all':
      default:
        return validatedTasks;
    }
  }, [validatedTasks, validatedFilter]);

  const contextValue = {
    tasks: validatedTasks,
    filter: validatedFilter,
    filteredTasks,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    setFilter
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}