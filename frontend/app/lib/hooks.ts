import { useEffect } from 'react';

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

// You can add more hooks here in the future:
// export function useAnotherHook() { ... }
