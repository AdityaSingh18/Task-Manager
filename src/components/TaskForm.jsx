import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';

const TaskForm = () => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const { addTask } = useTaskContext();

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  
    if (error) {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
 
    const trimmedValue = inputValue.trim();
    
   
    if (!trimmedValue) {
      setError('Task title cannot be empty');
      return;
    }
    
    try {
     
      addTask(trimmedValue);
      
      
      setInputValue('');
      setError('');
    } catch (error) {
  
      setError(error.message || 'Failed to add task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter a new task..."
          className={`task-input ${error ? 'error' : ''}`}
          aria-label="New task title"
          aria-describedby={error ? 'task-error' : undefined}
        />
        <button 
          type="submit" 
          className="add-button"
          aria-label="Add task"
        >
          Add Task
        </button>
      </div>
      {error && (
        <div 
          id="task-error" 
          className="error-message" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </form>
  );
};

export default TaskForm;