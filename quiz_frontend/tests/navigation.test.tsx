import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Navigation } from '@/components/Navigation';

const mockUseAuth = vi.fn();
const mockUseNotifications = vi.fn(() => ({
  notifications: [],
  unreadCount: 0,
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/NotificationsContext', () => ({
  useNotifications: () => mockUseNotifications(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Navigation', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('links Manage Subscription to billing dashboard for paying users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { first_name: 'Sam' },
      hasSubscription: true,
      subscription: { status: 'active', plan_type: 'pro' },
      logout: vi.fn(),
    });

    render(<Navigation />);

    const manageLink = screen.getByRole('link', { name: /Manage Subscription/i });
    expect(manageLink).toHaveAttribute('href', '/dashboard/billing');
  });

  it('shows upgrade link when user has no subscription', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { first_name: 'Sam' },
      hasSubscription: false,
      subscription: null,
      logout: vi.fn(),
    });

    render(<Navigation />);

    const upgradeLink = screen.getByRole('link', { name: /Upgrade to Pro/i });
    expect(upgradeLink).toHaveAttribute('href', '/pricing');
  });
});

