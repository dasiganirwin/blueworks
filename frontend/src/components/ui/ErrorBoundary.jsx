'use client';
import { Component } from 'react';
import Link from 'next/link';

// S5-03: React error boundary — catches uncaught JS errors in the component tree.
// Only renders fallback in production; dev still shows React error overlay.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') return;
    // Optionally log to an error monitoring service here
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError && process.env.NODE_ENV === 'production') {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center space-y-4">
            <svg className="w-14 h-14 mx-auto text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500">An unexpected error occurred. Please try again or return to the dashboard.</p>
            <Link
              href={this.props.dashboardHref ?? '/'}
              className="inline-block mt-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
