import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col">
          <nav className="bg-white shadow-sm border-b px-6 py-4">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              SchoolHub
            </Link>
          </nav>
          <main className="flex-grow flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                The page crashed unexpectedly. Your other pages still work.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="text-left text-xs bg-gray-100 p-3 rounded mb-6 overflow-auto max-h-40 text-red-600">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              )}
              <div className="flex gap-3 justify-center">
                <Link
                  to="/"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go Home
                </Link>
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
