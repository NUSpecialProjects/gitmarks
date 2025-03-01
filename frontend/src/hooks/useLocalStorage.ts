import { useState, useEffect } from 'react';

interface StorageConfig<T> {
  key: string | null;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

/**
 * A hook for persisting and syncing state with localStorage
 * @param config Configuration object for the storage
 * @returns [value, setValue] tuple similar to useState
 */
export function useLocalCachedState<T>({
  key,
  defaultValue,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: StorageConfig<T>): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from localStorage or default value
  const [inMemoryState, setInMemoryState] = useState<T>(getLocalStorageValue(key, defaultValue, deserialize));

  // Wrapper function to update both state and localStorage
  const setValue = (newValue: T | ((prev: T) => T)) => {
    setInMemoryState((prevValue) => {
      const nextValue = newValue instanceof Function ? newValue(prevValue) : newValue;
      
      if (key) {
        try {
          if (nextValue === null || nextValue === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, serialize(nextValue));
          }
        } catch (error) {
          console.error(`Error saving to localStorage for key ${key}:`, error);
        }
      }
      
      return nextValue;
    });
  };

  // Sync state when key changes
  useEffect(() => {
    const newValue = getLocalStorageValue(key, defaultValue, deserialize);
    if (newValue !== inMemoryState) {
      console.log("setting in memory state: key = ", key);
      setInMemoryState(newValue);
    }
  }, [key]);

  return [inMemoryState, setValue];
}

function getLocalStorageValue<T>(key: string | null, defaultValue: T, deserialize: (value: string) => T): T {
    if (!key) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading from localStorage for key ${key}:`, error);
      return defaultValue;
    }
  }

/**
 * Creates a unique key by joining multiple parts with underscores
 * Returns null if any part is undefined
 */
export const createUniqueKey = (
  ...parts: (string | undefined)[]
): string => {
  if (parts.some(part => part === undefined)) throw new Error("Undefined part in createUniqueKey");
  return parts.join('_');
};