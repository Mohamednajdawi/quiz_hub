'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, FileText, GraduationCap, Home, BarChart3, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Quizzes', href: '/quizzes', icon: GraduationCap },
  { name: 'Flashcards', href: '/flashcards', icon: BookOpen },
  { name: 'Essay Q&A', href: '/essays', icon: FileText },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Student Hub', href: '/student-hub', icon: FileText },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex justify-between items-center w-full">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-indigo-600">
                  Quiz Maker
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden sm:flex items-center text-sm text-gray-700">
                    <User className="w-4 h-4 mr-1" />
                    {user?.email}
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <div className="pt-2 border-t border-gray-200">
              <div className="px-3 py-2 text-sm text-gray-700">
                <User className="w-4 h-4 inline mr-2" />
                {user?.email}
              </div>
              <button
                onClick={logout}
                className="flex items-center w-full pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <Link
                href="/login"
                className="flex items-center pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center pl-3 pr-4 py-2 text-base font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

