'use client';

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

interface MapboxFeature {
  place_name: string;
  text: string;
  place_type: string[];
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

interface MapboxResponse {
  features: MapboxFeature[];
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

  // Fetch suggestions from Mapbox Geocoding API
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Check for Mapbox token
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set in environment variables');
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Mapbox Geocoding API - Free tier: 100k requests/month
      // Docs: https://docs.mapbox.com/api/search/geocoding/
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
      url.searchParams.set('access_token', mapboxToken);
      url.searchParams.set('types', 'place'); // Only cities/towns
      url.searchParams.set('limit', '10'); // More results than Nominatim!
      url.searchParams.set('autocomplete', 'true'); // Optimize for autocomplete
      
      // Optional country filter
      if (countries && countries.length > 0) {
        url.searchParams.set('country', countries.join(','));
      }
      
      const response = await fetch(url.toString());

      if (!response.ok) throw new Error('Failed to fetch locations');

      const data: MapboxResponse = await response.json();
      
      // Format results from Mapbox
      const formatted = data.features
        .map(feature => {
          // Mapbox already provides nicely formatted place names!
          // Example: "Vienna, Austria" or "St. Louis, Missouri, United States"
          const placeName = feature.place_name;
          
          // Extract city name and region/country from context
          const city = feature.text;
          const context = feature.context || [];
          
          // Find region and country from context
          const region = context.find(c => c.id.startsWith('region.'))?.text;
          const country = context.find(c => c.id.startsWith('country.'));
          const countryCode = country?.short_code?.toUpperCase();
          const countryName = country?.text;
          
          // For US/Canada: show "City, State" format
          if (region && (countryCode === 'US' || countryCode === 'CA')) {
            // Extract state code from region (e.g., "Missouri" -> keep as is, or use short code if available)
            return `${city}, ${region}`;
          }
          
          // For other countries: show "City, Country" format
          if (countryName && countryCode !== 'US' && countryCode !== 'CA') {
            return `${city}, ${countryName}`;
          }
          
          // Fallback: use Mapbox's formatted place_name
          return placeName;
        })
        .filter((item): item is string => item !== null && item !== undefined);

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
              <Icon name="loader-circle" size="md" className="text-on-surface-variant animate-spin" />
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
