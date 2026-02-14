'use client';

/**
 * 1. IMPORTS
 */

/**
 * 2. TYPES (including Props)
 */

interface MyComponentProps {
  variant: 'primary' | 'secondary';
  date?: Date;
  onAction?: (data: string) => void;
  children?: React.ReactNode;
}

/**
 * 3. OUTSIDE FUNCTIONS (utilities)
 * 
 * These are functions that do not need component state;
 * They can be reused and tested independently
 */

function formatData(input: string): string {
    return input.toUpperCase();
}

/**
 * 4. FUNCTION DECLARATION
 */

export function MyComponent({
    variant,
    date,
    onAction,
    children
}: MyComponentProps) {

    /**
     * 5. DATA & STATE (if client component)
     */

    /**
     * 6. EFFECTS (if client component)
     */

    /**
     * 7. HANDLERS
     */

    const handleClick = () => {
        console.log('do something');
    };

    /**
     * 8. FUNCTIONS & COMPONENTS
     */

    const SomeComponent = () => {
        return (
            <div>

            </div>
        );
    };

    /**
     * 9. RENDER (minimal)
     */
    return (
        <>

        </>
    );
}