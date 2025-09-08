import React, { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';

const mockUser = {
  firstName: 'John',
  lastName: 'Doe',
  avatar: undefined
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setCurrentPage('search');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
      case 'new-search':
        return <Search />;
      case 'contacts':
        return (
          <div className="p-6">
            <div className="card p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">All Contacts</h1>
              <p className="text-gray-600">Manage all your contacts in one place</p>
              <button className="btn btn-primary mt-4">
                Import Contacts
              </button>
            </div>
          </div>
        );
      case 'lists':
      case 'new-list':
        return (
          <div className="p-6">
            <div className="card p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Lists</h1>
              <p className="text-gray-600">Organize your prospects into targeted lists</p>
              <button className="btn btn-primary mt-4">
                Create New List
              </button>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <div className="card p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">Track your prospecting performance and ROI</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="stat-card">
                  <div className="stat-card-label">Conversion Rate</div>
                  <div className="stat-card-value">18.2%</div>
                  <div className="stat-card-change stat-card-change-positive">
                    +2.1% from last month
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Response Rate</div>
                  <div className="stat-card-value">34.7%</div>
                  <div className="stat-card-change stat-card-change-positive">
                    +5.3% from last month
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Pipeline Value</div>
                  <div className="stat-card-value">$847K</div>
                  <div className="stat-card-change stat-card-change-positive">
                    +12.8% from last month
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <div className="card p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input type="text" value="John" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input type="text" value="Doe" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input type="email" value="john.doe@company.com" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input type="text" value="Acme Corp" className="input w-full" />
                    </div>
                  </div>
                  <button className="btn btn-primary mt-4">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header user={mockUser} onSearch={handleSearch} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;