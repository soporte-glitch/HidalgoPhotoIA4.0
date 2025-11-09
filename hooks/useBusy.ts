import { useState } from 'react';

export const useBusy = () => {
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const start = () => {
    setBusy(true);
    setError('');
  };

  const fail = (msg: string) => {
    setBusy(false);
    setError(msg);
  };

  const done = () => setBusy(false);

  // Fix: Added `clearError` to allow manually clearing error messages.
  const clearError = () => setError('');
  
  // Fix: Added `runTask` to handle async operations with busy state.
  const runTask = async (task: () => Promise<any>) => {
    start();
    try {
      await task();
      done();
    } catch (e: any) {
      fail(e.message || 'An unexpected error occurred.');
    }
  };

  return { isBusy, error, start, fail, done, runTask, clearError };
};