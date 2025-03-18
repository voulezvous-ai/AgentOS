import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-body">
        <h2>{title}</h2>
        <div>
          {children}
        </div>
        <button className="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;