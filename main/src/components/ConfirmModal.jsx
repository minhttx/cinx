import React from 'react';
import ReactDOM from 'react-dom';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Đồng ý' }) => {
  if (!isOpen) return null;

  // Render modal into a portal at the end of document.body
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <span className="material-symbols-outlined warning-icon">warning</span>
          <h2>{title}</h2>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button className="m3-btn m3-btn-text" onClick={onCancel}>Hủy bỏ</button>
          <button className="m3-btn m3-btn-text confirm-btn" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
