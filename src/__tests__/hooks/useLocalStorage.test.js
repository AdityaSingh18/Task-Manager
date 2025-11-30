import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
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
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterAll(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return stored value from localStorage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored-value'));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('stored-value');
  });

  it('should handle complex objects with JSON serialization', () => {
    const complexObject = { 
      tasks: [
        { id: '1', title: 'Test task', completed: false },
        { id: '2', title: 'Another task', completed: true }
      ],
      filter: 'all'
    };
    
    localStorageMock.setItem('test-key', JSON.stringify(complexObject));
    
    const { result } = renderHook(() => useLocalStorage('test-key', {}));
    
    expect(result.current[0]).toEqual(complexObject);
  });

  it('should update localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
  });

  it('should handle function updates like useState', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(1));
  });

  it('should handle corrupted localStorage data gracefully', () => {
    // Simulate corrupted JSON data
    localStorageMock.getItem.mockReturnValueOnce('invalid-json{');
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Error reading localStorage key "test-key"'),
      expect.any(Error)
    );
  });

  it('should handle localStorage getItem errors', () => {
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage not available');
    });
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle localStorage setItem errors', () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage quota exceeded');
    });
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    // State should still update even if localStorage fails
    expect(result.current[0]).toBe('new-value');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error setting localStorage key "test-key"'),
      expect.any(Error)
    );
  });

  it('should handle null values correctly', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', null));
    
    act(() => {
      result.current[1](null);
    });
    
    expect(result.current[0]).toBe(null);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(null));
  });

  it('should handle array values correctly', () => {
    const testArray = [1, 2, 3, 'test'];
    
    const { result } = renderHook(() => useLocalStorage('test-key', []));
    
    act(() => {
      result.current[1](testArray);
    });
    
    expect(result.current[0]).toEqual(testArray);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testArray));
  });

  it('should handle boolean values correctly', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', false));
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(true));
  });

  it('should work with different keys independently', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));
    
    act(() => {
      result1.current[1]('updated1');
    });
    
    act(() => {
      result2.current[1]('updated2');
    });
    
    expect(result1.current[0]).toBe('updated1');
    expect(result2.current[0]).toBe('updated2');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', JSON.stringify('updated1'));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('key2', JSON.stringify('updated2'));
  });
});