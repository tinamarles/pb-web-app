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
}

export const Sheet = ({ 
  open, 
  onOpenChange, 
  children, 
  title,
  className = 'sheet' }: SheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);

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
      <div className={`sheet-content ${className}`} ref={sheetRef}>
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