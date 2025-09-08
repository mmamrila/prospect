import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, Download, Plus, MapPin, Building, X, ChevronDown } from 'lucide-react';
import { Contact } from '../types';
import { INDUSTRIES, POSITIONS, US_CITIES, COMPANY_SIZES, SEARCH_RADIUS_OPTIONS, REVENUE_RANGES } from '../data/searchData';
import { LocationSearch } from '../components/LocationSearch';
import { ApiService } from '../services/api';


export const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState('50');
  const [selectedRevenue, setSelectedRevenue] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [industrySearch, setIndustrySearch] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const handlePositionToggle = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const handleCompanySizeToggle = (size: string) => {
    setSelectedCompanySizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleRevenueToggle = (revenue: string) => {
    setSelectedRevenue(prev => 
      prev.includes(revenue) 
        ? prev.filter(r => r !== revenue)
        : [...prev, revenue]
    );
  };

  const performSearch = async (resetPage = true) => {
    setLoading(true);
    
    try {
      const locations = selectedLocation ? [selectedLocation] : [];
      
      const response = await ApiService.searchContacts({
        query: searchQuery,
        industries: selectedIndustries,
        positions: selectedPositions,
        companySizes: selectedCompanySizes,
        locations,
        page: resetPage ? 1 : pagination.page,
        limit: 20
      });
      
      setContacts(resetPage ? response.contacts : [...contacts, ...response.contacts]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSelectedIndustries([]);
    setSelectedPositions([]);
    setSelectedCompanySizes([]);
    setSelectedRevenue([]);
    setSelectedLocation('');
    setSearchRadius('50');
    setIndustrySearch('');
    setPositionSearch('');
  };

  // Perform search when filters change
  useEffect(() => {
    performSearch();
  }, [searchQuery, selectedIndustries, selectedPositions, selectedCompanySizes, selectedLocation, selectedRevenue]);

  // Initial search on mount
  useEffect(() => {
    performSearch();
  }, []);

  const filteredIndustries = INDUSTRIES.filter(industry =>
    industry.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const filteredPositions = POSITIONS.filter(position =>
    position.toLowerCase().includes(positionSearch.toLowerCase())
  );

  const totalActiveFilters = selectedIndustries.length + selectedPositions.length + 
                            selectedCompanySizes.length + selectedRevenue.length + 
                            (selectedLocation ? 1 : 0);

  return (
    <div className="flex h-full">
      {/* Filters Sidebar */}
      {showFilters && (
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Search Filters</h2>
              <div className="flex items-center space-x-2">
                {totalActiveFilters > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Location Filter */}
            <LocationSearch
              selectedLocation={selectedLocation}
              searchRadius={searchRadius}
              onLocationChange={setSelectedLocation}
              onRadiusChange={setSearchRadius}
            />

            {/* Industry Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Industry</h3>
                {selectedIndustries.length > 0 && (
                  <span className="badge badge-blue text-xs">
                    {selectedIndustries.length}
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Search industries..."
                value={industrySearch}
                onChange={(e) => setIndustrySearch(e.target.value)}
                className="input w-full mb-3 text-sm"
              />
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredIndustries.slice(0, 20).map((industry) => (
                  <label key={industry} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIndustries.includes(industry)}
                      onChange={() => handleIndustryToggle(industry)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <span className="text-gray-700 text-sm">{industry}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Position Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Position</h3>
                {selectedPositions.length > 0 && (
                  <span className="badge badge-green text-xs">
                    {selectedPositions.length}
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Search positions..."
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
                className="input w-full mb-3 text-sm"
              />
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredPositions.slice(0, 20).map((position) => (
                  <label key={position} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPositions.includes(position)}
                      onChange={() => handlePositionToggle(position)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <span className="text-gray-700 text-sm">{position}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Company Size Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Company Size</h3>
                {selectedCompanySizes.length > 0 && (
                  <span className="badge badge-purple text-xs">
                    {selectedCompanySizes.length}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {COMPANY_SIZES.map((size) => (
                  <label key={size} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCompanySizes.includes(size)}
                      onChange={() => handleCompanySizeToggle(size)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <span className="text-gray-700 text-sm">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Revenue Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Revenue</h3>
                {selectedRevenue.length > 0 && (
                  <span className="badge badge-gray text-xs">
                    {selectedRevenue.length}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {REVENUE_RANGES.map((revenue) => (
                  <label key={revenue} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRevenue.includes(revenue)}
                      onChange={() => handleRevenueToggle(revenue)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <span className="text-gray-700 text-sm">{revenue}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary w-full"
              onClick={() => performSearch()}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Search Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {!showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="btn btn-secondary"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Show Filters
                  {totalActiveFilters > 0 && (
                    <span className="ml-2 badge badge-blue text-xs">
                      {totalActiveFilters}
                    </span>
                  )}
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">Find Prospects</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </button>
              <button className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add to List
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, company, title, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10 py-3 text-base"
            />
          </div>

          {/* Active Filters */}
          {totalActiveFilters > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedLocation && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedLocation} ({searchRadius} miles)
                  <button
                    onClick={() => setSelectedLocation('')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedIndustries.map((industry) => (
                <span key={industry} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {industry}
                  <button
                    onClick={() => handleIndustryToggle(industry)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedPositions.map((position) => (
                <span key={position} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {position}
                  <button
                    onClick={() => handlePositionToggle(position)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedCompanySizes.map((size) => (
                <span key={size} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {size}
                  <button
                    onClick={() => handleCompanySizeToggle(size)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedRevenue.map((revenue) => (
                <span key={revenue} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {revenue}
                  <button
                    onClick={() => handleRevenueToggle(revenue)}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {contacts.length} of {pagination.total} results
            </p>
            <select className="input w-auto text-sm">
              <option>Sort by relevance</option>
              <option>Sort by name</option>
              <option>Sort by company</option>
              <option>Sort by score</option>
            </select>
          </div>

          {loading && contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Searching...</p>
            </div>
          ) : (
            <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-blue-600">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{contact.position}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {contact.company}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {contact.location}
                          </div>
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((tag) => (
                              <span key={tag} className="badge badge-gray text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">Score</div>
                      <div className={`text-lg font-bold ${
                        contact.score >= 90 ? 'text-green-600' : 
                        contact.score >= 80 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {contact.score}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button className="btn btn-primary btn-sm">
                        Add to List
                      </button>
                      <button className="btn btn-secondary btn-sm">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Load More */}
          {pagination.hasMore && (
            <div className="mt-8 text-center">
              <button 
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  performSearch(false);
                }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};