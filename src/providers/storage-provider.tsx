// StorageContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';

// Define the shape of our context
interface StorageContextType {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

// Create the context with a default value
const StorageContext = createContext<StorageContextType | undefined>(undefined);

// Props for our provider component
interface StorageProviderProps {
  children: ReactNode;
  storageType?: 'localStorage' | 'sessionStorage';
  initialState?: Record<string, string>;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({
  children,
  storageType = 'localStorage',
  initialState = {}
}) => {
  // Choose the storage object based on the prop
  const storage =
    storageType === 'localStorage' ? localStorage : sessionStorage;

  // Initialize state from storage
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with the initial state if provided
  useEffect(() => {
    if (!isInitialized) {
      // Add initial state values to storage
      Object.entries(initialState).forEach(([key, value]) => {
        if (!storage.getItem(key)) {
          storage.setItem(key, value);
        }
      });
      setIsInitialized(true);
    }
  }, [initialState, storage, isInitialized]);

  const getItem = (key: string): string | null => {
    return storage.getItem(key);
  };

  const setItem = (key: string, value: string): void => {
    storage.setItem(key, value);
    // You could add a state update here if you want components to re-render
    // when storage changes
  };

  const removeItem = (key: string): void => {
    storage.removeItem(key);
  };

  const clear = (): void => {
    storage.clear();
  };

  const value = {
    getItem,
    setItem,
    removeItem,
    clear
  };

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
};

// Custom hook to use the storage context
export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
