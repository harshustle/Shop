import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[FreshCart ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-800/80 border border-slate-700/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
            {/* Top Citrus Aura */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Error Graphic */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              🍋
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              Application Notice
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              Something Went Sour!
            </h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              We encountered an unexpected bump while loading this section. Our grocery engineers have been alerted.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>Reload Page</span>
              </button>
              <a
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>🏠</span>
                <span>Return to Store</span>
              </a>
            </div>

            {/* Collapsible Tech Diagnostics */}
            <div className="border-t border-slate-700/60 pt-4 text-left">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 mx-auto"
              >
                <span>{this.state.showDetails ? 'Hide' : 'Show'} Technical Details</span>
                <span>{this.state.showDetails ? '▲' : '▼'}</span>
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-slate-950/80 rounded-xl text-left font-mono text-[11px] text-red-400 max-h-40 overflow-y-auto border border-red-950">
                  <p className="font-bold">{this.state.error?.toString()}</p>
                  <pre className="text-slate-500 whitespace-pre-wrap mt-1 text-[10px]">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
