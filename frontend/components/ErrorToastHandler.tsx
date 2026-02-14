// components/ErrorToastHandler.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Client component that reads error from URL params and shows toast
 * 
 * Usage: Add to any page layout that might receive error redirects
 * 
 * IMPORTANT: Only removes 'error' and 'message' params - preserves ALL other params!
 * Example: ?intent=join&error=not_authorized → becomes ?intent=join after toast
 * 
 * Error codes:
 * - authentication_required → "Please log in to continue"
 * - not_authorized → "You don't have permission to access that page"
 * - not_found → "The requested page was not found"
 * - unknown → "An error occurred"
 */
export function ErrorToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname(); // ✅ Use Next.js hook instead of window.location
  
  useEffect(() => {
    const error = searchParams.get('error');
    const customMessage = searchParams.get('message');
    
    if (error) {
      // Show toast based on error type
      switch (error) {
        case 'authentication_required':
          toast.error('Authentication Required', {
            description: 'Please log in to continue',
          });
          break;
          
        case 'not_authorized':
          toast.error('Not Authorized', {
            description: customMessage || 'You don\'t have permission to access that page',
          });
          break;
          
        case 'not_found':
          toast.error('Not Found', {
            description: customMessage || 'The requested page was not found',
          });
          break;
          
        case 'unknown':
        default:
          toast.error('Error', {
            description: customMessage || 'An error occurred',
          });
          break;
      }
      
      // ✅ CRITICAL: Only remove error/message params, preserve ALL others!
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      newSearchParams.delete('message');
      
      // ✅ Build new URL with remaining params (like intent, tab, etc.)
      const newUrl = newSearchParams.toString() 
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      
      router.replace(newUrl);
    }
  }, [searchParams, router, pathname]); // ✅ Add pathname to dependencies
  
  return null; // This component doesn't render anything
}