'use client';
import React, { useEffect, useRef } from 'react';
import { Button } from './button';

// === MODIFICATION LOG ===
// Date: 2025-11-24 UTC
// Modified by: Assistant
// Changes: Created custom Sheet component for mobile edit flow
// Purpose: Slide-up sheet for editing profile fields on mobile (NO Radix dependency)
// Architecture: Pure React (useState, useRef, useEffect) + CSS-driven design
// ========================

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string; // Allow custom className to be passed
  mode?: 'bottom' | 'right' | 'left' | 'center' | 'responsive-right'; // Slide direction: bottom/right/left/center, default = responsive 
}

export const Sheet = ({ 
  open, 
  onOpenChange, 
  children, 
  title,
  className = 'sheet',
  mode }: SheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap: Move focus into sheet when opened, return when closed
  useEffect(() => {
    if (open) {
      // Store currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Move focus into sheet - prioritize input fields over buttons
      setTimeout(() => {
        if (sheetRef.current) {
          // First try to focus an input/textarea/select (the actual editable field)
          const inputElements = sheetRef.current.querySelectorAll<HTMLElement>(
            'input, textarea, select'
          );
          if (inputElements.length > 0) {
            inputElements[0].focus();
            return;
          }
          
          // Fall back to any focusable element if no inputs exist
          const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
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

  // Trap focus inside sheet (prevent tabbing outside)
  useEffect(() => {
    if (!open) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !sheetRef.current) return;

      const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
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
      // Close if clicking on backdrop (not the sheet content)
      if (target.classList.contains('sheet-backdrop')) {
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
      <div className="sheet-backdrop" />
      
      {/* Sheet Content - slides up from bottom on mobile, centered modal on desktop */}
      <div className={`sheet-content ${className}`} ref={sheetRef} data-mode={mode}>
        {/* Header - sticky at top with title and close button */}
        <div className="sheet__header">
          <h2 className="title-lg emphasized">{title}</h2>
          <Button
            variant="subtle"
            icon="close"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            
          />
        </div>
        
        {/* Body - scrollable content area */}
        <div className="sheet-body">
          {children}
        </div>
      </div>
    </>
  );
};