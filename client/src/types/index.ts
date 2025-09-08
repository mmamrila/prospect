export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  avatar?: string;
  createdAt: Date;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company: string;
  position: string;
  industry: string;
  location: string;
  linkedinUrl?: string;
  companySize?: string;
  revenue?: string;
  score: number;
  lastContacted?: Date;
  tags: string[];
  notes?: string;
  createdAt: Date;
}

export interface ProspectList {
  id: string;
  name: string;
  description?: string;
  contacts: Contact[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isShared: boolean;
  tags: string[];
}

export interface SearchFilters {
  industry?: string[];
  position?: string[];
  companySize?: string[];
  location?: string[];
  revenue?: string[];
  keywords?: string;
}

export interface SearchResult {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DashboardStats {
  totalContacts: number;
  totalLists: number;
  recentActivity: number;
  topIndustries: { industry: string; count: number }[];
  monthlyGrowth: number;
}