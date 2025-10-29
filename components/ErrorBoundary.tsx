import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-brand-text">
          <h2 className="text-2xl font-bold mb-4">Algo salió mal.</h2>
          <p className="mb-4">Hemos registrado el error. Por favor, recarga la página e intenta de nuevo.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-brand-accent text-brand-primary font-bold py-2 px-6 rounded-lg hover:bg-brand-accent-hover transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
