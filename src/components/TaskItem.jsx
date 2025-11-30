import React from 'react';
import { useTaskContext } from '../context/TaskContext';

const TaskItem = React.memo(({ task }) => {
  const { toggleTaskCompletion, deleteTask } = useTaskContext();

  const handleToggleCompletion = () => {
    toggleTaskCompletion(task.id);
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <label className="task-checkbox-label">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggleCompletion}
            className="task-checkbox"
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
          <span className="checkbox-custom"></span>
        </label>
        <span className={`task-title ${task.completed ? 'completed-text' : ''}`}>
          {task.title}
        </span>
      </div>
      <button
        onClick={handleDelete}
        className="delete-button"
        aria-label={`Delete task "${task.title}"`}
        type="button"
      >
        ×
      </button>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;