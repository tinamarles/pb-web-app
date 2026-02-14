// lib/tableTypes.ts
// Type definitions for DataTable component system

import type { ReactNode } from 'react';

/**
 * Column definition for DataTable
 * Generic T is the data type (Event, Member, etc.)
 */
export interface ColumnDef<T> {
  /** Unique identifier for the column */
  id: string;
  
  /** Column header label */
  label: string;
  
  /** Key in data object to access value (can be nested like 'user.name') */
  accessor?: keyof T | string;
  
  /** Whether this column is sortable */
  sortable?: boolean;
  
  /** Custom render function for cell content */
  render?: (row: T) => ReactNode;
  
  /** CSS class for column alignment/width */
  className?: string;
  
  /** Column width (for fixed widths) */
  width?: string;
}

/**
 * Action button configuration for single row
 */
export interface RowAction<T> {
  /** Unique identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Icon name from Icon component */
  icon?: string;
  
  /** Link href (for navigation actions) - use this for Next.js Link navigation */
  href?: string | ((row: T) => string);
  
  /** Action handler (for non-navigation actions like delete) */
  onClick?: (row: T) => void;
  
  /** Whether to show this action (can be conditional) */
  show?: (row: T) => boolean;
  
  /** Visual variant */
  variant?: 'default' | 'error' | 'success' | 'info' | 'warning' | 'primary' | 'secondary' | 'tertiary' | 'accent1' | 'accent2';
}

/**
 * Bulk action configuration for multiple selected rows
 */
export interface BulkAction<T> {
  /** Unique identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Icon name from Icon component */
  icon?: string;
  
  /** Action handler receives array of selected rows */
  onClick: (rows: T[]) => void;
  
  /** Visual variant */
  variant?: 'default' | 'error' | 'success' | 'info' | 'warning' | 'primary' | 'secondary' | 'tertiary' | 'accent1' | 'accent2';

}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Column ID to sort by */
  columnId: string;
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Complete table configuration
 */
export interface TableConfig<T> {
  /** Unique table identifier */
  id: string;
  
  /** Table title/label */
  label: string;
  
  /** Column definitions */
  columns: ColumnDef<T>[];
  
  /** Single row actions (Edit, Delete, etc.) */
  rowActions?: RowAction<T>[];
  
  /** Bulk actions (shown when rows selected) */
  bulkActions?: BulkAction<T>[];
  
  /** Enable row selection checkboxes */
  selectable?: boolean;
  
  /** Enable search functionality */
  searchable?: boolean;
  
  /** Search placeholder text */
  searchPlaceholder?: string;
  
  /** Function to extract unique ID from row */
  getRowId: (row: T) => string | number;
}