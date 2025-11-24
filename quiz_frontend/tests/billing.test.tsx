import { render, screen, waitFor } from '@testing-library/react';
import { BillingContent } from '@/app/dashboard/billing/page';
import { renderWithQueryClient } from './utils';

const mockGetSubscription = vi.fn();
const mockCancelSubscription = vi.fn();
const mockUseAuth = vi.fn(() => ({
  isAuthenticated: true,
  isAdmin: false,
  user: { first_name: 'Test' },
  logout: vi.fn(),
}));
const mockUseNotifications = vi.fn(() => ({
  notifications: [],
  unreadCount: 0,
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

vi.mock('@/lib/api/subscription', () => ({
  subscriptionApi: {
    getCurrentUserSubscription: () => mockGetSubscription(),
    cancelSubscription: (...args: any[]) => mockCancelSubscription(...args),
  },
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

describe('BillingContent', () => {
  beforeEach(() => {
    mockGetSubscription.mockReset();
    mockCancelSubscription.mockReset();
  });

  it('shows upgrade prompt when no subscription exists', async () => {
    mockGetSubscription.mockResolvedValue({
      has_subscription: false,
    });

    render(renderWithQueryClient(<BillingContent />));

    await waitFor(() =>
      expect(
        screen.getByText(/You’re on the free plan/i)
      ).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument();
  });

  it('renders subscription details and manage controls', async () => {
    mockGetSubscription.mockResolvedValue({
      has_subscription: true,
      plan_type: 'pro',
      status: 'active',
      current_period_end: '2030-01-01T00:00:00.000Z',
      cancel_at_period_end: false,
      monthly_generations: 100,
      remaining_generations: 80,
      stripe_subscription_id: 'sub_123',
    });

    render(renderWithQueryClient(<BillingContent />));

    await waitFor(() =>
      expect(screen.getByText(/Manage Subscription/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Renews on/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cancel at period end/i })
    ).toBeInTheDocument();
  });
});

