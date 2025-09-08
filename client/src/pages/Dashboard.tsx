import React from 'react';
import { Users, List, TrendingUp, Target, ArrowUpRight } from 'lucide-react';

const stats = [
  {
    name: 'Total Contacts',
    value: '12,847',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    name: 'Active Lists',
    value: '47',
    change: '+3.2%',
    changeType: 'positive' as const,
    icon: List,
  },
  {
    name: 'Conversion Rate',
    value: '18.2%',
    change: '+2.1%',
    changeType: 'positive' as const,
    icon: Target,
  },
  {
    name: 'Monthly Growth',
    value: '2,340',
    change: '+8.7%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
];

const recentActivity = [
  {
    id: 1,
    action: 'New contact added',
    contact: 'Sarah Johnson (Salesforce)',
    time: '2 minutes ago',
  },
  {
    id: 2,
    action: 'List exported',
    contact: 'Enterprise SaaS Prospects',
    time: '15 minutes ago',
  },
  {
    id: 3,
    action: 'Contact updated',
    contact: 'Michael Chen (Microsoft)',
    time: '1 hour ago',
  },
  {
    id: 4,
    action: 'New list created',
    contact: 'Q4 Healthcare Leads',
    time: '2 hours ago',
  },
];

const topIndustries = [
  { industry: 'Technology', count: 3247, percentage: 65 },
  { industry: 'Healthcare', count: 1892, percentage: 38 },
  { industry: 'Financial Services', count: 1456, percentage: 29 },
  { industry: 'Manufacturing', count: 987, percentage: 20 },
  { industry: 'Retail', count: 743, percentage: 15 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good morning, Welcome back!</h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your prospecting today.</p>
          </div>
          <button className="btn btn-primary btn-lg">
            <Target className="w-4 h-4 mr-2" />
            Find New Prospects
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="stat-card">
              <div className="stat-card-header">
                <div>
                  <p className="stat-card-label">{stat.name}</p>
                  <p className="stat-card-value">{stat.value}</p>
                  <div className="stat-card-change stat-card-change-positive">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="ml-1">{stat.change}</span>
                    <span className="text-gray-600 ml-1">from last month</span>
                  </div>
                </div>
                <div className="stat-card-icon">
                  <Icon />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.action}</span>
                  </p>
                  <p className="text-sm text-gray-600">{activity.contact}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition">
            View all activity
          </button>
        </div>

        {/* Top Industries */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Industries</h3>
          <div className="space-y-4">
            {topIndustries.map((industry) => (
              <div key={industry.industry} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{industry.industry}</span>
                    <span className="text-sm text-gray-600">{industry.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${industry.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-left group">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Import Contacts</h4>
            <p className="text-sm text-gray-600 mt-1">Upload a CSV file to add contacts</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-left group">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
              <List className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Create List</h4>
            <p className="text-sm text-gray-600 mt-1">Organize contacts into targeted lists</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-left group">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Start Campaign</h4>
            <p className="text-sm text-gray-600 mt-1">Launch outreach to your prospects</p>
          </button>
        </div>
      </div>
    </div>
  );
};