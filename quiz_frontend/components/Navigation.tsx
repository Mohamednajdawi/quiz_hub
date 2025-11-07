'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FileText, GraduationCap, Home, BarChart3, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const studyTools = [
  { name: 'Quizzes', href: '/quizzes', icon: GraduationCap },
  { name: 'Flashcards', href: '/flashcards', icon: BookOpen },
  { name: 'Essay Q&A', href: '/essays', icon: FileText },
];

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Student Hub', href: '/student-hub', icon: FileText },
];

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if any study tool is active
  const isStudyToolActive = studyTools.some(tool => pathname === tool.href || pathname.startsWith(tool.href + '/'));

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email
    : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                
                {/* Study Tools Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isStudyToolActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    Study Tools
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {studyTools.map((tool) => {
                          const isActive = pathname === tool.href || pathname.startsWith(tool.href + '/');
                          return (
                            <Link
                              key={tool.name}
                              href={tool.href}
                              onClick={() => setIsDropdownOpen(false)}
                              className={`flex items-center px-4 py-2 text-sm ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <tool.icon className="w-4 h-4 mr-2" />
                              {tool.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="hidden sm:inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                  <div className="hidden sm:flex items-center text-sm text-gray-700">
                    <User className="w-4 h-4 mr-1" />
                    {displayName}
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
          
          {/* Study Tools Dropdown for Mobile */}
          <div>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center justify-between w-full pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isStudyToolActive
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              <span className="flex items-center">
                <GraduationCap className="w-5 h-5 mr-3" />
                Study Tools
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="pl-6 space-y-1">
                {studyTools.map((tool) => {
                  const isActive = pathname === tool.href || pathname.startsWith(tool.href + '/');
                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      onClick={() => setIsDropdownOpen(false)}
                      className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-sm font-medium ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                      }`}
                    >
                      <tool.icon className="w-4 h-4 mr-3" />
                      {tool.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <div className="pt-2 border-t border-gray-200">
              <Link
                href="/profile"
                className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname.startsWith('/profile')
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </Link>
              <div className="px-3 py-2 text-sm text-gray-700">
                <User className="w-4 h-4 inline mr-2" />
                {displayName}
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

