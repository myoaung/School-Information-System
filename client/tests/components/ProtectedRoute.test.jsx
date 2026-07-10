import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import * as AuthContext from '../../src/context/AuthContext';

vi.mock('../../src/context/AuthContext');

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { name: 'Test User', role: 'student' },
      isAuthenticated: true,
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should not render children
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    // Should have navigated to login route
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows loading spinner while checking auth', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Should not render children
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    // Should show the loading spinner div
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('redirects to /dashboard when role does not match requiredRole', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { name: 'Student', role: 'student' },
      isAuthenticated: true,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Admin content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
