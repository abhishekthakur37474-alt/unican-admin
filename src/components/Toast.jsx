// src/components/Toast.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const displayedMessagesRef = useRef(new Set());

  const removeToast = useCallback((id, message) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    displayedMessagesRef.current.delete(message);
  }, []);

  const showToast = useCallback((type, message, title = '') => {
    // Prevent duplicates
    if (displayedMessagesRef.current.has(message)) {
      return;
    }

    displayedMessagesRef.current.add(message);
    const id = Date.now() + Math.random().toString();

    setToasts((prev) => [...prev, { id, type, message, title }]);

    // Auto-dismiss after 5000ms
    setTimeout(() => {
      removeToast(id, message);
    }, 5000);
  }, [removeToast]);

  const toast = {
    success: (msg, title = 'Success') => showToast('success', msg, title),
    info: (msg, title = 'Info') => showToast('info', msg, title),
    warning: (msg, title = 'Warning') => showToast('warning', msg, title),
    error: (msg, title = 'Error') => showToast('error', msg, title),
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return 'ri-checkbox-circle-fill';
      case 'info':
        return 'ri-information-fill';
      case 'warning':
        return 'ri-alert-fill';
      case 'error':
        return 'ri-close-circle-fill';
      default:
        return 'ri-notification-fill';
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container-custom">
        {toasts.map((t) => (
          <div key={t.id} className={`custom-toast toast-${t.type}`}>
            <div className="toast-body-custom">
              <i className={`toast-icon ${getIcon(t.type)}`}></i>
              <div className="toast-content">
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-message">{t.message}</div>
              </div>
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(t.id, t.message)}
              >
                ✕
              </button>
            </div>
            <div className="toast-progress-bar"></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};