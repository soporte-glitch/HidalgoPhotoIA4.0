import React, { useState, useEffect } from 'react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

/**
 * Dispatches a custom event to show a toast notification.
 * @param message The message to display.
 * @param type The type of toast ('success' or 'error').
 */
export const showToast = (message: string, type: 'success' | 'error') => {
  document.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
};

const ToastNotification: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      const newToast: ToastMessage = {
        id: Date.now(),
        message,
        type,
      };
      setToasts(currentToasts => [...currentToasts, newToast]);
      setTimeout(() => {
        setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
      }, 3000);
    };

    document.addEventListener('show-toast', handleShowToast as EventListener);
    return () => document.removeEventListener('show-toast', handleShowToast as EventListener);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;