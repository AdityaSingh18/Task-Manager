/**
 * Task data model and related types
 */

/**
 * @typedef {Object} Task
 * @property {string} id - UUID v4 format
 * @property {string} title - Task description (1-500 characters, trimmed)
 * @property {boolean} completed - Completion status (default: false)
 */

/**
 * @typedef {'all' | 'completed' | 'pending'} FilterType
 */

/**
 * Creates a new task object with validation
 * @param {string} title - The task title
 * @returns {Task} A new task object
 * @throws {Error} If title is invalid
 */
export function createTask(title) {
  const validatedTitle = validateTaskTitle(title);
  
  return {
    id: generateTaskId(),
    title: validatedTitle,
    completed: false
  };
}

/**
 * Validates a task title
 * @param {string} title - The title to validate
 * @returns {string} The trimmed and validated title
 * @throws {Error} If title is invalid
 */
export function validateTaskTitle(title) {
  if (typeof title !== 'string') {
    throw new Error('Task title must be a string');
  }
  
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length === 0) {
    throw new Error('Task title cannot be empty');
  }
  
  if (trimmedTitle.length > 500) {
    throw new Error('Task title cannot exceed 500 characters');
  }
  
  return trimmedTitle;
}

/**
 * Validates a complete task object
 * @param {any} task - The task object to validate
 * @returns {boolean} True if task is valid
 * @throws {Error} If task is invalid
 */
export function validateTask(task) {
  if (!task || typeof task !== 'object') {
    throw new Error('Task must be an object');
  }
  
  if (!task.id || typeof task.id !== 'string') {
    throw new Error('Task must have a valid id');
  }
  
  if (!isValidUUID(task.id)) {
    throw new Error('Task id must be a valid UUID');
  }
  
  validateTaskTitle(task.title);
  
  if (typeof task.completed !== 'boolean') {
    throw new Error('Task completed status must be a boolean');
  }
  
  return true;
}

/**
 * Validates an array of tasks
 * @param {any} tasks - The tasks array to validate
 * @returns {boolean} True if all tasks are valid
 * @throws {Error} If any task is invalid
 */
export function validateTasksArray(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('Tasks must be an array');
  }
  
  tasks.forEach((task, index) => {
    try {
      validateTask(task);
    } catch (error) {
      throw new Error(`Invalid task at index ${index}: ${error.message}`);
    }
  });
  
  return true;
}

/**
 * Validates a filter type
 * @param {any} filter - The filter to validate
 * @returns {boolean} True if filter is valid
 * @throws {Error} If filter is invalid
 */
export function validateFilter(filter) {
  const validFilters = ['all', 'completed', 'pending'];
  
  if (!validFilters.includes(filter)) {
    throw new Error(`Filter must be one of: ${validFilters.join(', ')}`);
  }
  
  return true;
}

/**
 * Generates a unique UUID for task IDs
 * @returns {string} A UUID v4 string
 */
export function generateTaskId() {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates if a string is a valid UUID
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(uuid) {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}