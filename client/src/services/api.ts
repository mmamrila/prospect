const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface SearchFilters {
  query?: string;
  industries?: string[];
  positions?: string[];
  companySizes?: string[];
  locations?: string[];
  page?: number;
  limit?: number;
}

interface SearchResponse {
  contacts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

class ApiService {
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      // In a real app, we'd get the token from localStorage or context
      // For demo purposes, we'll skip authentication
    };
  }

  static async searchContacts(filters: SearchFilters): Promise<SearchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Search API error:', error);
      // For demo purposes, return mock data if API fails
      return {
        contacts: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      };
    }
  }

  static async getSuggestions(type: string, query: string = '') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/search/suggestions?type=${type}&query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Suggestions failed');
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error('Suggestions API error:', error);
      return [];
    }
  }
}

export { ApiService };
export type { SearchFilters, SearchResponse };