import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null; info?: string | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console (Vercel logs / Sentry etc. can be used here)
    console.error('ErrorBoundary captured an error:', error, info);
    this.setState({ info: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-xl bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error en la aplicación</h2>
            <p className="text-sm text-slate-600 mb-4">Ocurrió un error al cargar la aplicación. Revisa la consola para más detalles.</p>
            <details className="text-xs text-slate-500 whitespace-pre-wrap mb-4">
              {this.state.error?.toString()}
              {'\n'}
              {this.state.info}
            </details>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Recargar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}