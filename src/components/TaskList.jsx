import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import TaskItem from './TaskItem';

const TaskList = () => {
  const { filteredTasks, filter } = useTaskContext();


  if (filteredTasks.length === 0) {
    const getEmptyMessage = () => {
      switch (filter) {
        case 'completed':
          return 'No completed tasks yet.';
        case 'pending':
          return 'No pending tasks. Great job!';
        case 'all':
        default:
          return 'No tasks yet. Add one above to get started!';
      }
    };

    return (
      <div className="task-list-empty">
        <p className="empty-message">{getEmptyMessage()}</p>
      </div>
    );
  }

 
  return (
    <div className="task-list">
      {filteredTasks.map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
        />
      ))}
    </div>
  );
};

export default TaskList;