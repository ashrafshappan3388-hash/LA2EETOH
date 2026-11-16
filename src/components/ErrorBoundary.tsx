import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  isAr?: boolean;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isAr = Boolean(this.props.isAr);
      return (
        <div className="max-w-[680px] mx-auto my-10 p-6 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {isAr ? 'حدث خطأ غير متوقع أثناء عرض هذا القسم' : 'Something went wrong displaying this section'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 break-words">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
