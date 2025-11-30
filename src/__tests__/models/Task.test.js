import {
  createTask,
  validateTaskTitle,
  validateTask,
  validateTasksArray,
  validateFilter,
  generateTaskId,
  isValidUUID
} from '../../models/Task.js';

describe('Task Data Model', () => {
  describe('generateTaskId', () => {
    it('should generate a valid UUID', () => {
      const id = generateTaskId();
      expect(typeof id).toBe('string');
      expect(isValidUUID(id)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateTaskId();
      const id2 = generateTaskId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID format', () => {
      const validUUID = '123e4567-e89b-42d3-a456-426614174000';
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-42d3-a456')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
      expect(isValidUUID(123)).toBe(false);
    });
  });

  describe('validateTaskTitle', () => {
    it('should accept valid titles', () => {
      expect(validateTaskTitle('Valid task')).toBe('Valid task');
      expect(validateTaskTitle('  Trimmed task  ')).toBe('Trimmed task');
    });

    it('should reject empty titles', () => {
      expect(() => validateTaskTitle('')).toThrow('Task title cannot be empty');
      expect(() => validateTaskTitle('   ')).toThrow('Task title cannot be empty');
    });

    it('should reject non-string titles', () => {
      expect(() => validateTaskTitle(null)).toThrow('Task title must be a string');
      expect(() => validateTaskTitle(undefined)).toThrow('Task title must be a string');
      expect(() => validateTaskTitle(123)).toThrow('Task title must be a string');
      expect(() => validateTaskTitle({})).toThrow('Task title must be a string');
    });

    it('should reject titles exceeding 500 characters', () => {
      const longTitle = 'a'.repeat(501);
      expect(() => validateTaskTitle(longTitle)).toThrow('Task title cannot exceed 500 characters');
    });

    it('should accept titles at the 500 character limit', () => {
      const maxTitle = 'a'.repeat(500);
      expect(validateTaskTitle(maxTitle)).toBe(maxTitle);
    });
  });

  describe('createTask', () => {
    it('should create a valid task with correct properties', () => {
      const task = createTask('Test task');
      
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title', 'Test task');
      expect(task).toHaveProperty('completed', false);
      expect(isValidUUID(task.id)).toBe(true);
    });

    it('should trim whitespace from title', () => {
      const task = createTask('  Trimmed task  ');
      expect(task.title).toBe('Trimmed task');
    });

    it('should throw error for invalid titles', () => {
      expect(() => createTask('')).toThrow('Task title cannot be empty');
      expect(() => createTask('   ')).toThrow('Task title cannot be empty');
    });
  });

  describe('validateTask', () => {
    const validTask = {
      id: '123e4567-e89b-42d3-a456-426614174000',
      title: 'Valid task',
      completed: false
    };

    it('should validate correct task objects', () => {
      expect(validateTask(validTask)).toBe(true);
      expect(validateTask({
        ...validTask,
        completed: true
      })).toBe(true);
    });

    it('should reject non-object tasks', () => {
      expect(() => validateTask(null)).toThrow('Task must be an object');
      expect(() => validateTask(undefined)).toThrow('Task must be an object');
      expect(() => validateTask('string')).toThrow('Task must be an object');
      expect(() => validateTask(123)).toThrow('Task must be an object');
    });

    it('should reject tasks without valid id', () => {
      expect(() => validateTask({ ...validTask, id: undefined })).toThrow('Task must have a valid id');
      expect(() => validateTask({ ...validTask, id: null })).toThrow('Task must have a valid id');
      expect(() => validateTask({ ...validTask, id: 123 })).toThrow('Task must have a valid id');
      expect(() => validateTask({ ...validTask, id: 'invalid-uuid' })).toThrow('Task id must be a valid UUID');
    });

    it('should reject tasks with invalid titles', () => {
      expect(() => validateTask({ ...validTask, title: '' })).toThrow('Task title cannot be empty');
      expect(() => validateTask({ ...validTask, title: null })).toThrow('Task title must be a string');
    });

    it('should reject tasks with invalid completed status', () => {
      expect(() => validateTask({ ...validTask, completed: 'true' })).toThrow('Task completed status must be a boolean');
      expect(() => validateTask({ ...validTask, completed: 1 })).toThrow('Task completed status must be a boolean');
      expect(() => validateTask({ ...validTask, completed: null })).toThrow('Task completed status must be a boolean');
    });
  });

  describe('validateTasksArray', () => {
    const validTask1 = {
      id: '123e4567-e89b-42d3-a456-426614174000',
      title: 'Task 1',
      completed: false
    };

    const validTask2 = {
      id: '987fcdeb-51d2-43e1-b789-123456789abc',
      title: 'Task 2',
      completed: true
    };

    it('should validate array of valid tasks', () => {
      expect(validateTasksArray([])).toBe(true);
      expect(validateTasksArray([validTask1])).toBe(true);
      expect(validateTasksArray([validTask1, validTask2])).toBe(true);
    });

    it('should reject non-arrays', () => {
      expect(() => validateTasksArray(null)).toThrow('Tasks must be an array');
      expect(() => validateTasksArray(undefined)).toThrow('Tasks must be an array');
      expect(() => validateTasksArray('string')).toThrow('Tasks must be an array');
      expect(() => validateTasksArray({})).toThrow('Tasks must be an array');
    });

    it('should reject arrays with invalid tasks', () => {
      const invalidTask = { ...validTask1, id: 'invalid-uuid' };
      expect(() => validateTasksArray([validTask1, invalidTask])).toThrow('Invalid task at index 1');
    });

    it('should provide specific error messages for invalid tasks', () => {
      const taskWithoutTitle = { ...validTask1, title: '' };
      expect(() => validateTasksArray([taskWithoutTitle])).toThrow('Invalid task at index 0: Task title cannot be empty');
    });
  });

  describe('validateFilter', () => {
    it('should validate correct filter values', () => {
      expect(validateFilter('all')).toBe(true);
      expect(validateFilter('completed')).toBe(true);
      expect(validateFilter('pending')).toBe(true);
    });

    it('should reject invalid filter values', () => {
      expect(() => validateFilter('invalid')).toThrow('Filter must be one of: all, completed, pending');
      expect(() => validateFilter('')).toThrow('Filter must be one of: all, completed, pending');
      expect(() => validateFilter(null)).toThrow('Filter must be one of: all, completed, pending');
      expect(() => validateFilter(undefined)).toThrow('Filter must be one of: all, completed, pending');
      expect(() => validateFilter(123)).toThrow('Filter must be one of: all, completed, pending');
    });
  });
});