import React from 'react';
import { 
  Home, 
  Search, 
  Users, 
  List, 
  BarChart3, 
  Settings,
  Plus,
  FolderOpen,
  Brain
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navigationItems = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'ai-prospecting', name: 'AI Prospecting', icon: Brain },
  { id: 'search', name: 'Find Prospects', icon: Search },
  { id: 'contacts', name: 'All Contacts', icon: Users },
  { id: 'lists', name: 'My Lists', icon: List },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
];

const quickActions = [
  { id: 'new-search', name: 'New Search', icon: Plus },
  { id: 'new-list', name: 'Create List', icon: FolderOpen },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <div className="sidebar">
      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon />
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="pt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => onNavigate(action.id)}
                  className="sidebar-nav-item"
                >
                  <Icon />
                  {action.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <button
          onClick={() => onNavigate('settings')}
          className="sidebar-nav-item"
        >
          <Settings />
          Settings
        </button>
      </div>
    </div>
  );
};