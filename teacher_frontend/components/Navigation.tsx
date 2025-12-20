'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogOut, User, BarChart3, ChevronDown, Menu, X } from 'lucide-react';

export const Navigation = memo(function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/results', label: 'Results', icon: BarChart3 },
  ];

  const displayName =
    user?.first_name || user?.last_name
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : user?.email || 'User';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="glassmorphism border-b border-[#38BDF8]/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={() => router.push('/courses')}
              className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl hover:text-[#38BDF8] transition-colors"
            >
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Teacher Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                      isActive
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#161F32]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Desktop User Menu */}
            <div className="hidden md:block relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-sm">{displayName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 glassmorphism border border-[#38BDF8]/20 rounded shadow-lg bg-[#0B1221]">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push('/account');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#94A3B8] hover:bg-[#161F32]"
                  >
                    <User className="w-4 h-4" />
                    <span>Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-[#161F32]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile User Button */}
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-[#38BDF8]/20 py-4 space-y-2"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded transition-colors ${
                    isActive
                      ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#161F32]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-[#38BDF8]/20">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/account');
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Account</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-[#161F32] rounded transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile User Menu */}
        {isUserMenuOpen && (
          <div className="md:hidden border-t border-[#38BDF8]/20 py-4">
            <div className="px-4 py-2 text-sm text-[#94A3B8] mb-2">{displayName}</div>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push('/account');
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Account</span>
            </button>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-[#161F32] rounded transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
});

