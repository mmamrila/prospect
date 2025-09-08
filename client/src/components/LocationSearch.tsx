import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { SEARCH_RADIUS_OPTIONS } from '../data/searchData';

interface LocationSearchProps {
  selectedLocation: string;
  searchRadius: string;
  onLocationChange: (location: string) => void;
  onRadiusChange: (radius: string) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  selectedLocation,
  searchRadius,
  onLocationChange,
  onRadiusChange,
}) => {
  const [locationInput, setLocationInput] = useState(selectedLocation);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Common US cities for autocomplete suggestions
  const commonCities = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'San Jose, CA',
    'Austin, TX',
    'Jacksonville, FL',
    'Fort Worth, TX',
    'Columbus, OH',
    'Charlotte, NC',
    'San Francisco, CA',
    'Indianapolis, IN',
    'Seattle, WA',
    'Denver, CO',
    'Washington, DC',
    'Boston, MA',
    'El Paso, TX',
    'Nashville, TN',
    'Detroit, MI',
    'Oklahoma City, OK',
    'Portland, OR',
    'Las Vegas, NV',
    'Memphis, TN',
    'Louisville, KY',
    'Baltimore, MD',
    'Milwaukee, WI',
    'Atlanta, GA',
    'Miami, FL',
    'Raleigh, NC',
    'Minneapolis, MN',
    'Tampa, FL',
    'Cleveland, OH',
    'Orlando, FL',
    'Tucson, AZ',
    'Sacramento, CA',
    'Kansas City, MO',
    'Mesa, AZ',
    'Virginia Beach, VA',
    'Omaha, NE',
    'Oakland, CA',
    'Tulsa, OK',
    'Arlington, TX',
    'New Orleans, LA'
  ];

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    
    if (value.length > 2) {
      const filtered = commonCities
        .filter(city => city.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationSelect = (location: string) => {
    setLocationInput(location);
    onLocationChange(location);
    setShowSuggestions(false);
  };

  const handleLocationSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onLocationChange(locationInput);
      setShowSuggestions(false);
    }
  };

  const handleLocationBlur = () => {
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      if (locationInput !== selectedLocation) {
        onLocationChange(locationInput);
      }
    }, 200);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Location</h3>
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Enter any city (e.g., Austin, TX)"
            value={locationInput}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            onKeyDown={handleLocationSubmit}
            onBlur={handleLocationBlur}
            onFocus={() => locationInput.length > 2 && setShowSuggestions(true)}
            className="input w-full pl-10"
          />
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((city, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing
                  onClick={() => handleLocationSelect(city)}
                >
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    {city}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {(selectedLocation || locationInput) && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Search Radius
            </label>
            <select
              value={searchRadius}
              onChange={(e) => onRadiusChange(e.target.value)}
              className="input w-full text-sm"
            >
              {SEARCH_RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Within {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {(selectedLocation || locationInput) && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <MapPin className="w-3 h-3 inline mr-1" />
            Searching within {searchRadius} miles of {selectedLocation || locationInput}
          </div>
        )}
      </div>
    </div>
  );
};