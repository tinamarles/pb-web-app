'use client';
// === MODIFICATION LOG ===
// Date: 2025-11-29 UTC
// Modified by: Assistant
// Changes: Created LocationAutocomplete component for city/state selection
// Purpose: Smart location search with API autocomplete (Nominatim for testing)
// Architecture: Standalone component that mimics FormField styling, manages own state
// Features: Debounced API calls, keyboard navigation, mobile-friendly
// ========================

import { useState, useEffect, useRef } from 'react';
import { Icon } from './icon';

export interface LocationAutocompleteProps {
  label?: string;
  sublabel?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  countries?: string[]; // Optional: filter by ISO 3166-1 alpha-2 codes (e.g., ['us', 'ca', 'au'])
}

interface LocationResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string; // ISO country code (e.g., "at", "au")
    'ISO3166-2-lvl4'?: string; // State code (e.g., "US-MO")
  };
}

export function LocationAutocomplete({
  label = 'Location',
  sublabel,
  value = '',
  onChange,
  placeholder = 'Start typing your city...',
  error,
  className = '',
  disabled = false,
  countries, // No default = worldwide search
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from Nominatim API
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Nominatim API - Free, no API key needed (respects usage policy: max 1 req/sec)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=5` +
        (countries ? `&countrycodes=${countries.join(',')}` : ''), // Filter by country codes if provided
        {
          headers: {
            'Accept': 'application/json',
            // User-Agent required by Nominatim usage policy
            'User-Agent': 'PickleballApp/1.0' 
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch locations');

      const data: LocationResult[] = await response.json();
      
      // Format results as "City, State"
      const formatted = data
        .map(result => {
          const city = result.address.city || result.address.town || result.address.village;
          const state = result.address.state;
          const country = result.address.country;
          const countryCode = result.address.country_code?.toUpperCase();
          // Extract state code from ISO format (e.g., "US-MO" -> "MO")
          const stateCode = result.address['ISO3166-2-lvl4']?.split('-')[1];
          
          if (!city) return null;
          
          // US/Canada format: "City, State"
          if (countryCode === 'US' || countryCode === 'CA') {
            if (stateCode || state) {
              return `${city}, ${stateCode || state}`;
            }
          }
          
          // International format: "City, Country"
          if (country) {
            return `${city}, ${country}`;
          }
          
          // Fallback: just the city name
          return city;
        })
        .filter((item): item is string => item !== null);

      // Remove duplicates
      const unique = [...new Set(formatted)];
      
      setSuggestions(unique);
      setIsOpen(unique.length > 0);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (500ms debounce)
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 500);
  };

  // Handle selecting a suggestion
  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    
    if (onChange) {
      onChange(selectedValue);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle blur - notify parent of final value
  const handleBlur = () => {
    // Small delay to allow click on suggestion to register
    setTimeout(() => {
      if (onChange && inputValue !== value) {
        onChange(inputValue);
      }
    }, 200);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`} ref={containerRef}>
      {/* Top Label */}
      {label && (
        <div className="flex items-center gap-1">
          <label className="input-field__top-label">
            {label}
          </label>
          {sublabel && (
            <span className="input-field__sub-label">{sublabel}</span>
          )}
        </div>
      )}

      {/* Input Container */}
      <div className="relative">
        <div className="input-field h-12">
          {/* Location Icon */}
          <Icon name="location" size="lg" className="text-on-surface-variant" />
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            className="input-base pl-10"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
          />
          
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Icon name="loading" size="md" className="text-on-surface-variant animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-surface-container rounded-lg shadow-lg border border-outline-variant overflow-hidden">
            <ul className="max-h-60 overflow-y-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion}-${index}`}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors
                    hover:bg-surface-container-high
                    ${index === highlightedIndex ? 'bg-surface-container-high' : ''}
                  `}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur event
                    handleSelect(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="location" size="sm" className="text-on-surface-variant" />
                    <span className="body-md text-on-surface">{suggestion}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <span className="label-sm text-error ml-1">{error}</span>
      )}
    </div>
  );
}
