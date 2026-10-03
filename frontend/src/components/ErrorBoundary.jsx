import { Component } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
          <div className="flex max-w-md flex-col items-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle size={26} />
            </div>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">Something went wrong</h2>
            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
              An unexpected error occurred while rendering the interface. Reloading the application usually resolves this.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900 cursor-pointer"
            >
              <RefreshCw size={15} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
