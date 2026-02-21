import { useEffect, useState } from 'react';

/**
 * A custom hook to fix a persistent browser autofill bug.
 * This is a workaround for browsers that fail to apply custom CSS
 * to autofilled inputs, especially for properties like font-size.
 */
export function useAutofillFix() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Find all autofilled inputs on the page.
      // Use a type assertion to tell TypeScript that the elements are HTMLElements.
      const autofilledInputs = document.querySelectorAll('input:-webkit-autofill');

      autofilledInputs.forEach(input => {
        // Assert the element is an HTMLElement to access the style property.
        const htmlInput = input as HTMLElement;
        
        const originalTransition = htmlInput.style.transition;
        htmlInput.style.transition = 'none';

        window.getComputedStyle(htmlInput).getPropertyValue('font-size');

        htmlInput.style.transition = originalTransition;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);
}

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Custom hook to detect if viewport is below a certain breakpoint
 * 
 * EXCEPTION TO "NO WINDOW OBJECT" RULE:
 * This hook is used for blocking entire pages on mobile (e.g., admin event management).
 * Unlike hiding UI elements (which should use CSS), this prevents access to functionality
 * that would be unusable on small screens and shows a "desktop required" message.
 * 
 * @param breakpoint - Width in pixels (default: 640 for mobile)
 * @returns boolean - true if viewport is below breakpoint
 * 
 * @example
 * // Block mobile users (< 640px)
 * const isMobile = useIsMobile();
 * if (isMobile) return <DesktopRequiredMessage />;
 * 
 * @example
 * // Block mobile + tablet (< 1024px)
 * const isSmallScreen = useIsMobile(1024);
 * if (isSmallScreen) return <TabletRequiredMessage />;
 * 
 * @see Guidelines.md - Section on DOM Manipulation exceptions
 */
export function useIsMobile(breakpoint: number = 640): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile(); // Initial check on mount
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Custom hook to automatically redirect mobile users away from desktop-only pages
 * 
 * Combines viewport detection with automatic redirection and user notification.
 * Use this for admin pages that are not designed for mobile devices.
 * 
 * @param redirectPath - Where to send mobile users (e.g., '/admin/events/list')
 * @param breakpoint - Width in pixels to consider "mobile" (default: 640)
 * @param message - Custom toast message (optional)
 * @returns boolean - true if user is being redirected (for loading states)
 * 
 * @example
 * // Redirect mobile users to events list
 * const isRedirecting = useRedirectOnMobile('/admin/17/events/list');
 * if (isRedirecting) return <LoadingSpinner />;
 * 
 * @example
 * // Custom breakpoint and message
 * const isRedirecting = useRedirectOnMobile(
 *   '/dashboard',
 *   1024,
 *   'This feature requires a larger screen'
 * );
 */
export function useRedirectOnMobile(
  redirectPath: string,
  breakpoint: number = 640,
  message: string = 'This page requires a desktop or tablet'
): boolean {
  const isMobile = useIsMobile(breakpoint);
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isMobile && !isRedirecting) {
      setIsRedirecting(true);
      
      toast.error(message, {
        description: 'Redirecting...',
        duration: 3000,
      });

      // Redirect after short delay so toast is visible
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isMobile, redirectPath, message, router, isRedirecting]);

  return isRedirecting;
}
// You can add more hooks here in the future:
// export function useAnotherHook() { ... }
