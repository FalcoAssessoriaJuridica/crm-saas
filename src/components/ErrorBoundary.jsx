import React from 'react';

class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('CRM Error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <span className="text-red-400 text-2xl">⚠</span>
                    </div>
                    <div>
                        <h3 className="font-serif text-lg text-accent mb-1">Algo deu errado</h3>
                        <p className="text-xs text-muted-text max-w-xs">{this.state.error?.message || 'Erro inesperado no módulo'}</p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-accent/20 text-accent rounded-xl text-sm font-medium hover:bg-accent/30 transition-all"
                    >
                        Tentar novamente
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
