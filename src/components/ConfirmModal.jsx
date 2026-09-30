// src/components/ConfirmModal.jsx
import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you really want to proceed with this action?',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return 'ri-delete-bin-line';
      case 'warning':
        return 'ri-alert-line';
      default:
        return 'ri-question-line';
    }
  };

  return (
    <div className="app-confirm-backdrop" onClick={onCancel}>
      <div className="app-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className={`app-confirm-icon-wrapper icon-${type}`}>
          <i className={getIcon()}></i>
        </div>
        <h4 className="app-confirm-title">{title}</h4>
        <p className="app-confirm-message">{message}</p>
        <div className="app-confirm-actions">
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-confirm-proceed ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export { ConfirmModal };
export default ConfirmModal;