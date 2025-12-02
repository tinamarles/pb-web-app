import { FormFieldProps } from "@/ui";

// === MODIFICATION LOG ===
// Date: 2025-11-26 UTC
// Modified by: Assistant
// Changes: Created centralized form field configurations - single source of truth
// Purpose: Ensure consistency across all forms - firstName always looks the same everywhere
// Architecture: Each field config includes FormFieldProps + sheetTitle for mobile sheets
// Benefits: No duplication, easy to update globally, type-safe, consistent UX
// Usage: Import specific fields in form components, spread into FormField component
// ========================

/**
 * FORM FIELD CONFIGURATION SYSTEM
 *
 * Central repository for all form field configurations.
 * Ensures consistency across all forms in the application.
 *
 * USAGE:
 * ```tsx
 * import { FORM_FIELDS } from '@/data/formFieldConfigs';
 *
 * const fieldConfigs = {
 *   firstName: FORM_FIELDS.firstName,
 *   lastName: FORM_FIELDS.lastName,
 *   // ... other fields
 * };
 * ```
 *
 * STRUCTURE:
 * - Each field has all FormFieldProps (label, variant, type, icon, placeholder, etc.)
 * - sheetTitle: Used for mobile sheet edit dialogs
 * - Grouped by category for easy discovery
 */

// Field configuration type - extends FormFieldProps with sheetTitle for mobile sheets
export type FormFieldConfig = Partial<FormFieldProps> & { sheetTitle: string };

// ============================================
// PERSONAL INFORMATION FIELDS
// ============================================

export const PERSONAL_FIELDS = {
  firstName: {
    label: "First Name",
    variant: "default" as const,
    type: "text" as const,
    placeholder: "Your first Name",
    sheetTitle: "Edit First Name",
  },

  lastName: {
    label: "Last Name",
    variant: "default" as const,
    type: "text" as const,
    placeholder: "Your last Name",
    sheetTitle: "Edit Last Name",
  },

  dateOfBirth: {
    label: "Date of Birth",
    sublabel: "(Optional)",
    variant: "default" as const,
    type: "date" as const,
    icon: "calendar",
    placeholder: "yyyy/mm/dd",
    sheetTitle: "Edit Date of Birth",
  },

  gender: {
    label: "Gender",
    sublabel: "(Optional)",
    variant: "select" as const,
    placeholder: "Placeholder",
    options: ["Male", "Female", "Other"],
    sheetTitle: "Edit Gender",
    hideChevronOnMobile: true,
  },

  bio: {
    label: "Bio",
    variant: "default" as const,
    type: "textarea" as const,
    placeholder: "Tell us about yourself",
    textareaClassName: "min-h-[120px]",
    sheetTitle: "Edit Bio",
  },
} as const satisfies Record<string, FormFieldConfig>;

// ============================================
// CONTACT INFORMATION FIELDS
// ============================================

export const CONTACT_FIELDS = {
  email: {
    label: "Email",
    variant: "default" as const,
    type: "email" as const,
    placeholder: "Your email",
    sheetTitle: "Edit Email",
  },

  phoneNumber: {
    label: "Phone Number",
    sublabel: "(Optional)",
    variant: "default" as const,
    type: "tel" as const,
    icon: "phone",
    placeholder: "Placeholder",
    sheetTitle: "Edit Phone Number",
  },

  location: {
    label: "Location",
    sublabel: "(Optional)",
    variant: "default" as const,
    type: "text" as const,
    icon: "location",
    placeholder: "Your city",
    sheetTitle: "Edit Location",
  },
} as const satisfies Record<string, FormFieldConfig>;

// ============================================
// SPORTS/ACTIVITY SPECIFIC FIELDS
// ============================================

export const ACTIVITY_FIELDS = {
  skillLevel: {
    label: "Skill Level",
    sublabel: "(Level 1.0 to 7.0)",
    variant: "default" as const,
    type: "text" as const,
    placeholder: "Your skill level",
    sheetTitle: "Edit Skill Level",
  },

  isCertifiedInstructor: {
    label: "Certification",
    variant: "checkbox" as const,
    placeholder: "Certified Instructor",
    sheetTitle: "Edit Certification",
  },
} as const satisfies Record<string, FormFieldConfig>;

// ============================================
// PRIVACY/SETTINGS FIELDS
// ============================================

export const PRIVACY_FIELDS = {
  hasPrivacy: {
    label: "Privacy Settings",
    variant: "toggle" as const,
    text: "Keep my profile private",
    icon: "privacy",
    sheetTitle: "Edit Privacy",
  },
} as const satisfies Record<string, FormFieldConfig>;

// ============================================
// ALL FIELDS - Flat export for easy access
// ============================================

export const FORM_FIELDS = {
  // Personal
  ...PERSONAL_FIELDS,

  // Contact
  ...CONTACT_FIELDS,

  // Activity
  ...ACTIVITY_FIELDS,
} as const;

// ============================================
// TYPE EXPORTS
// ============================================

// Type helper to get field keys
export type FormFieldKey = keyof typeof FORM_FIELDS;

// Type helper to create typed field configs for specific forms
export type FieldConfigMap<T extends string> = Record<T, FormFieldConfig>;
