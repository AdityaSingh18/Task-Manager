import React from 'react';
import { TaskProvider } from './context/TaskContext';
import TaskForm from './components/TaskForm';
import { TaskFilters } from './components/TaskFilters';
import TaskList from './components/TaskList';
import ErrorBoundary from './components/ErrorBoundary';


function App() {
  return (
    <ErrorBoundary>
      <TaskProvider>
        <div className="app">
          <header className="app-header">
            <h1> Task Manager</h1>
          </header>
          
          <main className="app-main">
            <TaskForm />
            <TaskFilters />
            <TaskList />
          </main>
        </div>
      </TaskProvider>
    </ErrorBoundary>
  );
}

export default App;