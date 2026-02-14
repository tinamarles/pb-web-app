'use client';
import React, { useEffect, useRef } from 'react';
import { Button } from './button';

// === MODIFICATION LOG ===
// Date: 2026-01-02 UTC
// Modified by: Assistant
// Changes: Created custom Modal component (NO ShadCN/Radix dependency!)
// Purpose: Centered modal overlay for confirmations, alerts, simple forms
// Architecture: Pure React + CSS-driven design (follows Sheet component pattern)
// Variants: 'alert' (small, confirmation), 'default' (standard), 'large' (forms)
//
// Date: 2026-02-06 UTC
// Modified by: Assistant
// Changes: Added className prop for custom modal sizing
// Why: Allows custom sizing (e.g., .modal-datepicker for smaller datepicker modal)
// Usage: <Modal className="modal-datepicker" /> applies custom width constraints
// ========================

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  variant?: 'alert' | 'default' | 'large'; // Size/style variant
  showCloseButton?: boolean; // Show X button (default: true for 'default'/'large', false for 'alert')
  className?: string; // Custom class for modal content (for sizing, etc.)
}

export const Modal = ({ 
  open, 
  onOpenChange, 
  children, 
  title, 
  description,
  variant = 'default',
  showCloseButton = variant !== 'alert', // Alert modals typically don't have X button
  className = '' // Custom class for modal sizing
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap: Move focus into modal when opened, return when closed
  useEffect(() => {
    if (open) {
      // Store currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Move focus into modal
      setTimeout(() => {
        if (modalRef.current) {
          // First try to focus an input/textarea/select
          const inputElements = modalRef.current.querySelectorAll<HTMLElement>(
            'input, textarea, select'
          );
          if (inputElements.length > 0) {
            inputElements[0].focus();
            return;
          }
          
          // Fall back to any focusable element (buttons)
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 100); // Small delay to ensure DOM is ready
    } else {
      // Return focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [open]);

  // Trap focus inside modal (prevent tabbing outside)
  useEffect(() => {
    if (!open) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element -> go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } 
      // Tab on last element -> go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Close if clicking on backdrop (not the modal content)
      if (target.classList.contains('modal-backdrop')) {
        onOpenChange(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop - semi-transparent overlay */}
      <div className="modal-backdrop" />
      
      {/* Modal Content - centered overlay */}
      <div 
        className={`modal-content ${className}`} 
        ref={modalRef}
        data-variant={variant}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
      >
        {/* Header - title, description, and optional close button */}
        {(title || description || showCloseButton) && (
          <div className="modal__header">
            <div className="modal__header-content">
              {title && (
                <h2 id="modal-title" className="modal__title">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="modal__description">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="dismiss"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              />
            )}
          </div>
        )}
        
        {/* Body - content area */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </>
  );
};

// ========================================
// COMPOUND COMPONENTS (Optional - for convenience)
// ========================================

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className = '' }: ModalFooterProps) => {
  return (
    <div className={`modal__footer ${className}`}>
      {children}
    </div>
  );
};

// ========================================
// CONVENIENCE WRAPPER: AlertModal
// For simple confirmation dialogs
// ========================================

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  variant?: 'default' | 'destructive'; // Visual style
}

export const AlertModal = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'default'
}: AlertModalProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      variant="alert"
      showCloseButton={false}
    >
      <ModalFooter>
        <Button
          variant="outlined"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'error' : 'filled'}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};