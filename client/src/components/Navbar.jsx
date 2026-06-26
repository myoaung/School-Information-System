import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold" onClick={closeMobileMenu}>
              SchoolHub
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/announcements" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              Announcements
            </Link>
            <Link to="/classes" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              Classes
            </Link>
            <Link to="/curriculum" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              Curriculum
            </Link>
            <Link to="/contact" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              Contact
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded-md">
                  Dashboard
                </Link>
                <span className="text-blue-200 text-sm">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:bg-blue-700 px-3 py-2 rounded-md">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/announcements"
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMobileMenu}
            >
              Announcements
            </Link>
            <Link
              to="/classes"
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMobileMenu}
            >
              Classes
            </Link>
            <Link
              to="/contact"
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block hover:bg-blue-700 px-3 py-2 rounded-md"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <div className="px-3 py-2 text-blue-200 text-sm">
                  {user.name} ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left hover:bg-blue-700 px-3 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block hover:bg-blue-700 px-3 py-2 rounded-md"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block bg-white text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
