import React from 'react';
import { User, Search, Bell, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onSearch }) => {
  return (
    <header className="header">
      <div className="header-content">
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">
            <span>P</span>
          </div>
          <h1 className="logo-text">ProspectAI</h1>
        </div>

        {/* Search Bar */}
        <div className="header-search">
          <div className="relative">
            <Search className="header-search-icon" />
            <input
              type="text"
              placeholder="Search contacts, companies, or industries..."
              className="input w-full"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
            <Settings className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>
              {user && (
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              )}
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};