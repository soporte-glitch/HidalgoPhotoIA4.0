import { useState, useCallback } from 'react';

// Define the tuple structure for the hook's return value for clarity
type BusyHook = [
  boolean, // isBusy
  <T>(fn: () => Promise<T>) => Promise<T | undefined>, // busyWrapper
  string | null, // error
  () => void // clearError
];

export const useBusy = (): BusyHook => {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * A wrapper for async functions that manages busy and error states.
   * @param fn The async function to execute.
   * @returns The result of the async function, or undefined if an error occurs.
   */
  const busyWrapper = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setIsBusy(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Ocurrió un error inesperado.';
      console.error("Error caught by useBusy:", err);
      setError(errorMessage);
      return undefined;
    } finally {
      setIsBusy(false);
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return [isBusy, busyWrapper, error, clearError];
};
