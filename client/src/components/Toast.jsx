// Toast notification component — shown on success/error after form actions.
// Usage: import { useToast, ToastContainer } from './Toast';
//   const { toasts, showToast } = useToast();
//   showToast('Saved!', 'success');
//   <ToastContainer toasts={toasts} />

import { useState, useCallback, useEffect } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return { toasts, showToast };
}

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✓' : '✕'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
