import React, { useState } from 'react';
import { Brain, Sparkles, Target, MessageSquare, TrendingUp, Loader, AlertCircle } from 'lucide-react';
import { AIService } from '../services/aiService';
import { INDUSTRIES, POSITIONS } from '../data/searchData';

interface AIProspectingProps {
  onProspectsFound?: (prospects: any[]) => void;
}

export const AIProspecting: React.FC<AIProspectingProps> = ({ onProspectsFound }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  // Form state
  const [industries, setIndustries] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [keywords, setKeywords] = useState('');
  const [limit, setLimit] = useState(20);

  // AI insights state
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [prospectInsights, setProspectInsights] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const handleAISearch = async () => {
    if (industries.length === 0 && positions.length === 0 && !keywords) {
      setError('Please select at least one industry, position, or enter keywords');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);
    setSearchMetadata(null);

    try {
      const response = await AIService.discoverProspects({
        industries,
        positions,
        location,
        companySize,
        keywords,
        limit
      });

      setSearchResults(response.prospects);
      setSearchMetadata(response.metadata);
      
      if (onProspectsFound) {
        onProspectsFound(response.prospects);
      }

    } catch (err: any) {
      setError(err.message || 'AI prospecting failed. Please check your API key and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetInsights = async (prospect: any) => {
    setSelectedProspect(prospect);
    setIsLoadingInsights(true);
    setProspectInsights(null);

    try {
      const response = await AIService.getProspectInsights(prospect.id);
      setProspectInsights(response.insights);
    } catch (err) {
      console.error('Failed to get insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleGenerateMessage = async (messageType: 'email' | 'linkedin' | 'phone') => {
    if (!selectedProspect) return;

    try {
      const response = await AIService.generateOutreachMessage(
        selectedProspect.id,
        messageType,
        'professional',
        'introductory meeting'
      );
      setGeneratedMessage(response.message);
    } catch (err) {
      console.error('Failed to generate message:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Search Form */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-6 h-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Prospect Discovery</h2>
          <Sparkles className="w-5 h-5 text-yellow-500 ml-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Industries */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Target Industries</label>
            <select
              multiple
              value={industries}
              onChange={(e) => setIndustries(Array.from(e.target.selectedOptions, option => option.value))}
              className="input w-full h-32"
            >
              {INDUSTRIES.slice(0, 50).map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Positions */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Target Positions</label>
            <select
              multiple
              value={positions}
              onChange={(e) => setPositions(Array.from(e.target.selectedOptions, option => option.value))}
              className="input w-full h-32"
            >
              {POSITIONS.slice(0, 50).map((position) => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
            <input
              type="text"
              placeholder="e.g., San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Company Size */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Company Size</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="input w-full"
            >
              <option value="">Any Size</option>
              <option value="1-10 employees">1-10 employees</option>
              <option value="11-50 employees">11-50 employees</option>
              <option value="51-200 employees">51-200 employees</option>
              <option value="201-500 employees">201-500 employees</option>
              <option value="501-1,000 employees">501-1,000 employees</option>
              <option value="1,001-5,000 employees">1,001-5,000 employees</option>
              <option value="5,001-10,000 employees">5,001-10,000 employees</option>
              <option value="10,000+ employees">10,000+ employees</option>
            </select>
          </div>
        </div>

        {/* Keywords and Limit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Keywords & Technologies</label>
            <input
              type="text"
              placeholder="e.g., SaaS, CRM, AI, marketing automation"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Max Results</label>
            <input
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="input w-full"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleAISearch}
          disabled={isSearching}
          className="btn btn-primary btn-lg w-full md:w-auto"
        >
          {isSearching ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              AI is finding prospects...
            </>
          ) : (
            <>
              <Target className="w-5 h-5 mr-2" />
              Discover Prospects with AI
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Search Failed</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-500 text-xs mt-2">
                💡 Make sure you have set your OpenAI API key in the server environment variables
              </p>
            </div>
          </div>
        )}

        {/* Search Metadata */}
        {searchMetadata && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">AI Search Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Total Found:</span>
                <span className="ml-1 text-blue-800">{searchMetadata.total}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">New Prospects:</span>
                <span className="ml-1 text-blue-800">{searchMetadata.newProspects}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">AI Generated:</span>
                <span className="ml-1 text-blue-800">{searchMetadata.aiGenerated ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Search Time:</span>
                <span className="ml-1 text-blue-800">
                  {new Date(searchMetadata.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Prospects Results */}
      {searchResults.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            AI-Discovered Prospects ({searchResults.length})
          </h3>
          <div className="space-y-4">
            {searchResults.map((prospect) => (
              <div key={prospect.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {prospect.firstName} {prospect.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{prospect.position}</p>
                    <p className="text-sm text-gray-500">
                      {prospect.company} • {prospect.industry} • {prospect.location}
                    </p>
                    {prospect.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prospect.tags.map((tag: string) => (
                          <span key={tag} className="badge badge-purple text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">AI Score</div>
                      <div className={`text-lg font-bold ${
                        prospect.score >= 90 ? 'text-green-600' : 
                        prospect.score >= 80 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {prospect.score}
                      </div>
                    </div>
                    <button
                      onClick={() => handleGetInsights(prospect)}
                      className="btn btn-secondary btn-sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      AI Insights
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights Panel */}
      {selectedProspect && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            AI Insights: {selectedProspect.firstName} {selectedProspect.lastName}
          </h3>
          
          {isLoadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
              <span className="text-gray-600">Generating AI insights...</span>
            </div>
          ) : prospectInsights ? (
            <div className="space-y-6">
              {/* Talking Points */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🎯 Key Talking Points</h4>
                <ul className="space-y-1">
                  {prospectInsights.talkingPoints?.map((point: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outreach Strategy */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📋 Recommended Outreach</h4>
                <p className="text-sm text-gray-600">{prospectInsights.outreachStrategy}</p>
              </div>

              {/* Pain Points */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🎯 Potential Pain Points</h4>
                <ul className="space-y-1">
                  {prospectInsights.painPoints?.map((pain: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {pain}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Message Generation */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">💬 AI Message Generator</h4>
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => handleGenerateMessage('email')}
                    className="btn btn-primary btn-sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Email
                  </button>
                  <button
                    onClick={() => handleGenerateMessage('linkedin')}
                    className="btn btn-secondary btn-sm"
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => handleGenerateMessage('phone')}
                    className="btn btn-secondary btn-sm"
                  >
                    Phone Script
                  </button>
                </div>

                {generatedMessage && (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {generatedMessage.type.charAt(0).toUpperCase() + generatedMessage.type.slice(1)} Message
                      </span>
                      <span className="badge badge-green text-xs">AI Generated</span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedMessage.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Click "AI Insights" on a prospect to get personalized intelligence
            </div>
          )}
        </div>
      )}
    </div>
  );
};