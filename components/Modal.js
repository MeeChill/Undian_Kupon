'use client';
import { useEffect, useState } from 'react';

export default function Modal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Ya', cancelText = 'Batal', isDanger = false }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setShow(true);
        document.body.style.overflow = 'hidden';
    } else {
        const timer = setTimeout(() => setShow(false), 200);
        document.body.style.overflow = 'unset';
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : 'closed'}`}>
      <div className="modal-content">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">{cancelText}</button>
          <button onClick={onConfirm} className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}>{confirmText}</button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
          backdrop-filter: blur(4px);
        }
        .modal-overlay.open { opacity: 1; }
        
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transform: scale(0.95);
          transition: transform 0.2s ease-in-out;
        }
        .modal-overlay.open .modal-content { transform: scale(1); }

        .modal-title {
            margin-top: 0;
            margin-bottom: 0.5rem;
            color: var(--text-main);
            font-size: 1.25rem;
        }
        
        .modal-message {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        
        .btn-secondary {
            background-color: #e2e8f0;
            color: #475569;
        }
        .btn-secondary:hover {
            background-color: #cbd5e1;
        }
        .btn-primary {
            background-color: var(--primary);
            color: white;
        }
      `}</style>
    </div>
  );
}
