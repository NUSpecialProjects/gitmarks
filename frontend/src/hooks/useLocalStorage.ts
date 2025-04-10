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
}: StorageConfig<T>): [T, (value: T) => void] {
  // Initialize state from localStorage or default value
  const [inMemoryState, setInMemoryState] = useState<T>(getLocalStorageValue(key, defaultValue, deserialize));

  // Wrapper function to update both state and localStorage
  const setValue = (newValue: T) => {
    try {
      if (key) {
        setInMemoryState(newValue);
        localStorage.setItem(key, serialize(newValue));
      } else {
        throw new Error("Key is undefined");
      }
    } catch (error) {
      console.error(`Error saving to localStorage for key ${key}:`, error);
    }
  };

  // Sync state when key changes
  useEffect(() => {
    const newValue = getLocalStorageValue(key, defaultValue, deserialize);
    if (newValue !== inMemoryState) {
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