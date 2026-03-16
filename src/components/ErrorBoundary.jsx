import React from "react";
import Icon from "./AppIcon";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    error.__ErrorBoundary = true;
    window.__COMPONENT_ERROR__?.(error, errorInfo);
    // console.log("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state?.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <div className="flex justify-center items-center mb-4">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
                <Icon name="AlertTriangle" size={32} className="text-error" />
              </div>
            </div>
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground text-base w-10/12 mx-auto">We encountered an unexpected error while processing your request.</p>
            </div>
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="bg-muted hover:bg-accent text-foreground font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors duration-200"
              >
                <Icon name="RefreshCw" size={18} />
                Retry
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors duration-200 shadow-sm"
              >
                <Icon name="Home" size={18} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props?.children;
  }
}

export default ErrorBoundary;
