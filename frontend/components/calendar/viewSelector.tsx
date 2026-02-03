"use client";
import { useState, useEffect } from "react";
import { DayPicker } from 'react-day-picker';

// ========================================
// TYPES
// ========================================
type ViewMode = "grid" | "weekly" | "daily";
type Variant = "events" | "schedule";

interface ViewSelectorProps {
  variant: Variant;
  date?: Date;
  activities?: Date[];
  onViewModeChange?: (mode: ViewMode) => void;
  onWeekChange?: (startDate: Date, endDate: Date) => void;
  onDateChange?: (date: Date) => void;
}

/**
 * DATE in javascript
 * const now = new Date(); - uses local timezone but internally stores as UTC
 * now.toISOString() -> will show UTC time
 * now.toLocaleString() -> shows formatted local time
 * Sun Feb 02 2026 14:35:22 GMT-0500 (Eastern Standard Time)
 * It contains:
 *  - Today's date: Feb 02, 2026
 *  - Current time: 14:35:22
 *  - Timezone: GMT-0500
 *
 * to set a date:
 *  const myDate = '2026-02-15'
 *  const displayDate = new Date(myDate).toLocaleDateString();
 *
 *  .toString() -> Sun Feb 02 2026 14:35:22 <GMT-0500></GMT-0500>
 *  .toLocaleString() -> 2/2/2026, 2:35:22 PM'
 */

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function ViewSelector({
  variant,
  date, // if you want to rename it then write date: newName;
  activities,
  onViewModeChange,
  onWeekChange,
  onDateChange,
}: ViewSelectorProps) {}
