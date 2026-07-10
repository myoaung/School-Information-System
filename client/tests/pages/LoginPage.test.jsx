import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../src/pages/LoginPage';
import * as AuthContext from '../../src/context/AuthContext';
import * as LanguageContext from '../../src/context/LanguageContext';

vi.mock('../../src/context/AuthContext');
vi.mock('../../src/context/LanguageContext');

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
const mockT = vi.fn((key) => {
  const translations = {
    'login.title': 'Sign In',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',
    'login.error': 'Invalid credentials',
    'login.createNew': 'Create new account',
    'login.demoTitle': 'Demo Accounts',
    'login.demoAccounts': 'Click any account to auto-fill',
  };
  return translations[key] || key;
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function Wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    vi.mocked(LanguageContext.useTranslation).mockReturnValue({
      t: mockT,
      locale: 'en',
      setLocale: vi.fn(),
      formatDate: vi.fn(),
      formatDateShort: vi.fn(),
    });
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders email and password inputs', () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows login button', () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('form submission sends credentials and navigates to dashboard', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ name: 'Test', role: 'admin' });

    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    );

    await user.type(screen.getByLabelText('Email'), 'admin@school.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@school.com', 'password123');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: 'Invalid email or password' } },
    });

    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    );

    await user.type(screen.getByLabelText('Email'), 'bad@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
