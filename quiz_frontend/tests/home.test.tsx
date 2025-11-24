import { render, screen } from '@testing-library/react';
import Home, { LoggedInHome } from '@/app/page';

const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Home page variants', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('renders marketing homepage for guests', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    render(<Home />);

    expect(
      screen.getByText('Study tools in one calm workspace')
    ).toBeInTheDocument();
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
  });

  it('renders personalized view when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { first_name: 'Alex' },
    });

    render(<Home />);

    expect(
      screen.getByText(/Ready to keep building, Alex/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue in Student Hub/i })
    ).toBeInTheDocument();
  });

  it('shows quick actions inside LoggedInHome', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { first_name: 'Taylor' },
    });

    render(<LoggedInHome />);

    expect(screen.getByText('Go to Student Hub')).toBeInTheDocument();
    expect(screen.getByText('Create a New Project')).toBeInTheDocument();
  });
});

