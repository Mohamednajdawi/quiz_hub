'use client';

import { memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogOut, User, BarChart3 } from 'lucide-react';

export const Navigation = memo(function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/results', label: 'Results', icon: BarChart3 },
  ];

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
            <div className="hidden sm:flex items-center gap-2 text-[#94A3B8]">
              <User className="w-5 h-5" />
              <span className="text-sm">
                {user?.first_name || user?.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user?.email || 'User'}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-[#94A3B8] hover:text-white hover:bg-[#161F32] rounded transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
});

