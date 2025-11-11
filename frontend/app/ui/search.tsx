// frontend/app/ui/search.tsx
// Figma Make: components/ui-brand/search.tsx

// This is just a search box with an icon without a search logic

import { memo } from "react";
import { Icon } from "./icon";

export interface SearchProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const Search = memo(function Search({
  value = "",
  placeholder = "Search...",
  onChange,
  className = "",
}: SearchProps) {
  return (
    <div className={`search ${className}`}>
      <Icon name="search" className="icon-lg text-on-surface-variant" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="input-base has-icon"
      />
    </div>
  );
});