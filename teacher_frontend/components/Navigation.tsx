'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogOut, User, BarChart3, ChevronDown } from 'lucide-react';

export const Navigation = memo(function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="glassmorphism border-b border-[#38BDF8]/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push('/courses')}
              className="flex items-center gap-2 text-white font-bold text-xl hover:text-[#38BDF8] transition-colors"
            >
              <BookOpen className="w-6 h-6" />
              Teacher Dashboard
            </button>

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

          <div className="flex items-center gap-4">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">{displayName}</span>
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
          </div>
        </div>
      </div>
    </nav>
  );
});

