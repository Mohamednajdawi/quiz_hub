'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FileText, GraduationCap, Home, BarChart3, LogOut, User, ChevronDown, CreditCard, Sparkles, Shield, MoreVertical, Crown, Settings } from 'lucide-react';
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
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
];

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Shield },
];

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check if any study tool is active
  const isStudyToolActive = studyTools.some(tool => pathname === tool.href || pathname.startsWith(tool.href + '/'));

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email
    : '';

  const remainingGenerations = typeof user?.free_tokens === 'number' ? user.free_tokens : null;
  const isPro = user?.account_type === 'pro' || user?.subscription?.status === 'active';
  const subscription = user?.subscription;
  // Show manage subscription if user has any subscription (active or canceled but still in period)
  // A subscription exists if it's present and has status 'active' (even if cancel_at_period_end is true)
  const hasSubscription = subscription && subscription.status === 'active';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="bg-white border-b border-[#e6e6e6] sticky top-0 z-40 backdrop-blur-sm bg-white/95 text-brand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-bold bg-gradient-to-r from-[#163172] to-[#2756c7] bg-clip-text text-transparent">
                Quiz Hub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1 md:flex-1 md:justify-center md:ml-8">
            {/* Filter navigation items based on authentication */}
            {navigation
              .filter(item => {
                // When not authenticated, only show Home and Pricing
                if (!isAuthenticated) {
                  return item.href === '/' || item.href === '/pricing';
                }
                // When authenticated, show all items
                return true;
              })
              .map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#e6e6e6] text-[#163172]'
                        : 'text-[#0e1f47] hover:bg-[#f2f2f2]'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-2 transition-colors ${isActive ? 'text-[#163172]' : 'text-[#596078] group-hover:text-[#0e1f47]'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#163172] rounded-full" />
                    )}
                  </Link>
                );
              })}
            
            {/* Admin Link - Only show if authenticated AND is admin */}
            {isAuthenticated && isAdmin && adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                  className={`group relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                      ? 'bg-[#e6e6e6] text-[#163172]'
                      : 'text-[#0e1f47] hover:bg-[#f2f2f2]'
                  }`}
                >
                  <item.icon className={`w-4 h-4 mr-2 transition-colors ${isActive ? 'text-[#163172]' : 'text-[#596078] group-hover:text-[#0e1f47]'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#163172] rounded-full" />
                  )}
                    </Link>
                  );
                })}
                
                {/* Study Tools Dropdown - Only show if authenticated */}
                {isAuthenticated && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isStudyToolActive
                      ? 'bg-[#e6e6e6] text-[#163172]'
                      : 'text-[#0e1f47] hover:bg-[#f2f2f2]'
                      }`}
                    >
                  <GraduationCap className={`w-4 h-4 mr-2 transition-colors ${isStudyToolActive ? 'text-[#163172]' : 'text-[#596078] group-hover:text-[#0e1f47]'}`} />
                  <span>Study Tools</span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-all duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${isStudyToolActive ? 'text-[#163172]' : 'text-[#596078]'}`} />
                    </button>
                    
                    {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                    <div className="py-1.5">
                          {studyTools.map((tool) => {
                            const isActive = pathname === tool.href || pathname.startsWith(tool.href + '/');
                            return (
                              <Link
                                key={tool.name}
                                href={tool.href}
                                onClick={() => setIsDropdownOpen(false)}
                            className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                                  isActive
                                    ? 'bg-[#e6e6e6] text-[#163172] font-medium'
                                : 'text-[#0e1f47] hover:bg-[#f2f2f2]'
                                }`}
                              >
                            <tool.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#163172]' : 'text-[#9fa4b4]'}`} />
                                {tool.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

          {/* Right Side - User Actions */}
          <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                {/* User Info - Desktop Only */}
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-brand-surface">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                    isPro 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                      : 'bg-gradient-to-r from-[#163172] to-[#2756c7]'
                  }`}>
                    {isPro ? <Crown className="w-4 h-4" /> : getUserInitials()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand truncate max-w-[120px]">
                        {displayName}
                      </span>
                      {isPro && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          Pro
                        </span>
                      )}
                    </div>
                    {!isPro && remainingGenerations !== null && (
                      <div className="flex items-center gap-1 text-xs text-[#163172]">
                        <Sparkles className="h-3 w-3" />
                        <span>{remainingGenerations} left</span>
                      </div>
                    )}
                    {isPro && subscription?.plan_type && (
                      <div className="text-xs text-gray-500 capitalize">
                        {subscription.plan_type} Plan
                        {typeof subscription.remaining_generations === 'number' ? ` (${subscription.remaining_generations} left)` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-[#0e1f47] hover:bg-[#e6e6e6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e439d] transition-colors"
                    aria-label="User menu"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                      <div className="py-1.5">
                        {/* User Info in Dropdown */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                              isPro 
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                              {isPro ? <Crown className="w-5 h-5" /> : getUserInitials()}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {displayName}
                                </span>
                                {isPro && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                    Pro
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 truncate">
                                {user?.email}
                              </span>
                            </div>
                          </div>
                          
                          {/* Subscription Info */}
                          {isPro && subscription && (
                            <div className="mt-3 px-2 py-1.5 rounded-md bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-900 capitalize">
                                  {subscription.plan_type} Plan
                                  {typeof subscription.remaining_generations === 'number' ? ` (${subscription.remaining_generations} left)` : ''}
                                </span>
                                {subscription.cancel_at_period_end && (
                                  <span className="text-xs text-orange-600 font-medium">
                                    Cancels soon
                                  </span>
                                )}
                              </div>
                              {subscription.current_period_end && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {!isPro && remainingGenerations !== null && (
                            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                              <span className="text-xs font-medium text-indigo-700">
                                {remainingGenerations} free generation{remainingGenerations === 1 ? '' : 's'} remaining
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 mr-3 text-gray-400" />
                          Profile Settings
                        </Link>
                        
                        {hasSubscription ? (
                          <Link
                            href="/pricing?manage=true"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3 text-gray-400" />
                            Manage Subscription
                          </Link>
                        ) : (
                          <Link
                            href="/pricing"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                          >
                            <Crown className="w-4 h-4 mr-3" />
                            Upgrade to Pro
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100 my-1" />
                        
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#0e1f47] hover:text-[#163172] transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2756c7] rounded-lg hover:bg-[#1e439d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#163172] transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {/* Filter navigation items based on authentication */}
          {navigation
            .filter(item => {
              // When not authenticated, only show Home and Pricing
              if (!isAuthenticated) {
                return item.href === '/' || item.href === '/pricing';
              }
              // When authenticated, show all items
              return true;
            })
            .map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          
          {/* Admin Link for Mobile */}
          {isAuthenticated && isAdmin && adminNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
          
          {/* Study Tools Dropdown for Mobile - Only show if authenticated */}
          {isAuthenticated && (
            <div>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isStudyToolActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center">
                  <GraduationCap className={`w-5 h-5 mr-3 ${isStudyToolActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  Study Tools
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="pl-4 mt-1 space-y-1">
                  {studyTools.map((tool) => {
                    const isActive = pathname === tool.href || pathname.startsWith(tool.href + '/');
                    return (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <tool.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                        {tool.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {isAuthenticated ? (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              {/* User Info */}
              <div className="px-3 py-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                    isPro 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {isPro ? <Crown className="w-5 h-5" /> : getUserInitials()}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </span>
                      {isPro && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          Pro
                        </span>
                      )}
                    </div>
                    {!isPro && remainingGenerations !== null && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600">
                        <Sparkles className="h-3 w-3" />
                        <span>{remainingGenerations} free generation{remainingGenerations === 1 ? '' : 's'} left</span>
                      </div>
                    )}
                    {isPro && subscription?.plan_type && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {subscription.plan_type} Plan
                        {typeof subscription.remaining_generations === 'number' ? ` (${subscription.remaining_generations} left)` : ''}
                      </div>
                    )}
                  </div>
                </div>
                {isPro && subscription && (
                  <div className="mt-2 px-2 py-1.5 rounded-md bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                    {subscription.cancel_at_period_end ? (
                      <div className="text-xs text-orange-600">
                        Subscription cancels on {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'period end'}
                      </div>
                    ) : subscription.current_period_end && (
                      <div className="text-xs text-gray-600">
                        Renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Link
                href="/profile"
                className={`flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  pathname.startsWith('/profile')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5 mr-3 text-gray-400" />
                Profile
              </Link>
              
              {hasSubscription ? (
                <Link
                  href="/pricing?manage=true"
                  className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-5 h-5 mr-3 text-gray-400" />
                  Manage Subscription
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Crown className="w-5 h-5 mr-3" />
                  Upgrade to Pro
                </Link>
              )}
              
              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <Link
                href="/login"
                className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
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
