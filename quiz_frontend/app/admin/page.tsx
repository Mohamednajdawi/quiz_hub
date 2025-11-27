'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi, AdminUser, AdminStats } from '@/lib/api/admin';
import { Users, UserCheck, UserX, GraduationCap, Search, Layers, FileText } from 'lucide-react';
import { format } from 'date-fns';

function AdminDashboardContent() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getAllUsers(),
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    retry: false,
  });

  const isLoading = usersLoading || statsLoading;

  // Filter users based on search query
  const filteredUsers = usersData?.users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (usersError) {
    const errorMessage = usersError instanceof Error 
      ? usersError.message 
      : 'Failed to load admin data';
    
    // Check if it's a 403 (forbidden) error
    const isForbidden = errorMessage.includes('403') || errorMessage.includes('Admin access required');
    
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <Alert type="error">
            {isForbidden 
              ? 'You do not have admin access. Please contact an administrator if you believe this is an error.'
              : errorMessage}
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Manage and monitor all user accounts</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 mb-6">
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded p-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Total Users</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_users}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded p-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Pro Users</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.pro_users}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded p-2">
                  <UserX className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Free Users</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.free_users}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded p-2">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Active Users</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.active_users}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded p-2">
                  <GraduationCap className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Quizzes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_quizzes}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded p-2">
                  <Layers className="h-4 w-4 text-orange-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Flashcards</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_flashcards}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-rose-100 rounded p-2">
                  <FileText className="h-4 w-4 text-rose-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Essays</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_essays}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-teal-100 rounded p-2">
                  <Layers className="h-4 w-4 text-teal-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">Mind Maps</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_mind_maps}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Token Usage Stats */}
        {stats && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-cyan-100 rounded p-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700">Input Tokens</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_input_tokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-teal-100 rounded p-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700">Output Tokens</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_output_tokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-emerald-100 rounded p-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="ml-2 min-w-0">
                  <p className="text-xs font-medium text-gray-700">Total Tokens</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total_tokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader title="All Users" />
          
          {/* Search Bar */}
          <div className="px-6 pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Quizzes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Flashcards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Essays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mind Maps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Input Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Output Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-8 text-center text-sm text-gray-500">
                      {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {searchQuery && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {usersData?.total || 0} users
              </p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const displayName = user.full_name || 
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 
    'N/A';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{displayName}</div>
        {user.first_name || user.last_name ? (
          <div className="text-xs text-gray-500">
            {user.first_name} {user.last_name}
          </div>
        ) : null}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.account_type === 'pro'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.account_type === 'pro' ? 'Pro' : 'Free'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.quiz_count}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.flashcard_count}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.essay_count}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.mind_map_count || 0}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-mono">
          {user.input_tokens.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-mono">
          {user.output_tokens.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900 font-mono">
          {user.total_tokens.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.created_at
          ? format(new Date(user.created_at), 'MMM d, yyyy')
          : 'N/A'}
      </td>
    </tr>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

