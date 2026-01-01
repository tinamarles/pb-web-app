// nextJS path: frontend/app/shared/ModuleClientOnly.tsx
'use client';
import dynamic from 'next/dynamic';
import { ModuleProps } from './types';

// Wrapper component that disables SSR for Module
// This prevents hydration errors since Module uses client-side state (isMobile, useAuth)
export const ModuleClientOnly = dynamic<ModuleProps>(
  () => import('./module').then(mod => mod.Module),
  { ssr: false,
    
  }
);
