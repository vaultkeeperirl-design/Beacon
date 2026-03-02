import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error caught by Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-neutral-900 border border-red-900/50 rounded-xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
            <p className="text-neutral-400 mb-6 font-mono text-sm overflow-auto max-h-40">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-bold border border-neutral-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
