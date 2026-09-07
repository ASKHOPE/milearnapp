import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  itemName?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  itemName
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div 
        className="confirm-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <button 
          type="button" 
          className="confirm-modal-close" 
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={15} />
        </button>

        <div className="confirm-modal-header">
          <div className={`confirm-modal-icon-badge ${variant}`}>
            {variant === 'danger' ? (
              <Trash2 size={20} color="#ef4444" />
            ) : (
              <AlertTriangle size={20} color="var(--accent-primary)" />
            )}
          </div>
          <div>
            <h3 id="confirm-modal-title" className="confirm-modal-title">{title}</h3>
            {itemName && <span className="confirm-modal-item-badge">{itemName}</span>}
          </div>
        </div>

        <div className="confirm-modal-body">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        <div className="confirm-modal-actions">
          <Button 
            type="button" 
            variant="ghost" 
            size="md" 
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            size="md" 
            onClick={onConfirm}
            autoFocus
          >
            {variant === 'danger' && <Trash2 size={14} />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
