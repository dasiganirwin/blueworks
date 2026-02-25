'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Address autocomplete backed by Mapbox Geocoding API.
 *
 * Props:
 *   label      – field label text
 *   required   – shows asterisk
 *   placeholder
 *   error      – validation error string
 *   onSelect({ address, lat, lng }) – called when user picks a suggestion
 */
export function AddressAutocomplete({ label, required, placeholder, error, onSelect }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [fetching, setFetching]     = useState(false);
  const [open, setOpen]             = useState(false);
  const [confirmed, setConfirmed]   = useState(false);

  const debounceRef   = useRef(null);
  const containerRef  = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((q) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setFetching(true);
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
      `?access_token=${TOKEN}&country=PH&limit=5&types=address,place,poi`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data.features ?? []);
        setOpen(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setConfirmed(false);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
  };

  const handleSelect = (feature) => {
    const address     = feature.place_name;
    const [lng, lat]  = feature.center; // Mapbox returns [lng, lat]
    setQuery(address);
    setConfirmed(true);
    setSuggestions([]);
    setOpen(false);
    onSelect({ address, lat, lng });
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {label}
          {required && <span className="text-danger-600 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder ?? 'Search for your address…'}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={[
            'w-full px-3 py-2 text-sm border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'transition-colors',
            error ? 'border-danger-500 bg-danger-50' : 'border-gray-300',
          ].join(' ')}
        />

        {/* Loading spinner */}
        {fetching && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
        >
          {suggestions.map((feature) => (
            <li
              key={feature.id}
              role="option"
              onClick={() => handleSelect(feature)}
              className="px-3 py-2.5 cursor-pointer hover:bg-brand-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <span className="text-sm font-medium text-gray-800 block truncate">
                {feature.text}
              </span>
              <span className="text-xs text-gray-500 block truncate mt-0.5">
                {feature.place_name}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Confirmed badge */}
      {confirmed && !error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <svg className="w-3.5 h-3.5 text-success-600 shrink-0" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-success-600">Location confirmed</p>
        </div>
      )}

      {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
    </div>
  );
}
