const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface AIProspectingRequest {
  industries: string[];
  positions: string[];
  location: string;
  companySize: string;
  keywords: string;
  limit: number;
}

interface AIProspectingResponse {
  prospects: any[];
  metadata: {
    total: number;
    newProspects: number;
    searchQuery: string;
    aiGenerated: boolean;
    timestamp: string;
  };
}

interface ProspectInsights {
  talkingPoints: string[];
  outreachStrategy: string;
  painPoints: string[];
  companyInsights: string;
  personalizationData: string;
}

interface OutreachMessage {
  type: 'email' | 'linkedin' | 'phone';
  tone: 'professional' | 'casual' | 'direct';
  objective: string;
  content: string;
  generated: boolean;
  timestamp: string;
}

class AIService {
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  // AI-powered prospect discovery with real web scraping + OpenAI
  static async discoverProspects(request: AIProspectingRequest): Promise<AIProspectingResponse> {
    try {
      console.log('🤖 Using FULL AI endpoint - real web scraping + OpenAI intelligence...');
      
      const response = await fetch(`${API_BASE_URL}/ai/discover`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('AI prospect discovery failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Discovery error:', error);
      throw error;
    }
  }

  // Get AI insights for a prospect
  static async getProspectInsights(contactId: string): Promise<{
    prospect: any;
    insights: ProspectInsights;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/enrich/${contactId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('AI enrichment failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Insights error:', error);
      throw error;
    }
  }

  // Generate AI outreach messages
  static async generateOutreachMessage(
    contactId: string,
    messageType: 'email' | 'linkedin' | 'phone',
    tone: 'professional' | 'casual' | 'direct' = 'professional',
    objective: string = 'introductory meeting'
  ): Promise<{
    prospect: any;
    message: OutreachMessage;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/outreach/${contactId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ messageType, tone, objective }),
      });

      if (!response.ok) {
        throw new Error('AI message generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Message error:', error);
      throw error;
    }
  }

  // Batch AI scoring
  static async scoreProspects(contactIds: string[]): Promise<{
    scoredProspects: any[];
    metadata: {
      total: number;
      timestamp: string;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/score`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ contactIds }),
      });

      if (!response.ok) {
        throw new Error('AI scoring failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Scoring error:', error);
      throw error;
    }
  }

  // Check if AI features are available
  static async checkAIAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const health = await response.json();
      return response.ok && health.status === 'OK';
    } catch (error) {
      console.error('AI Availability check failed:', error);
      return false;
    }
  }
}

export { AIService };
export type { AIProspectingRequest, AIProspectingResponse, ProspectInsights, OutreachMessage };