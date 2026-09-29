import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Apple Farm ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#eaf6ff] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-4xl shadow-md mb-4 border border-emerald-200">
            🍎
          </div>
          <h2 className="text-xl font-black text-[#1c324f] mb-2">
            Something went wrong
          </h2>
          <p className="text-xs font-bold text-slate-500 max-w-xs mb-6">
            Apple Farm ran into a temporary glitch. Click below to refresh and continue farming!
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 rounded-2xl bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] text-white font-black text-sm shadow-[0_4px_0_#145a32] border-t border-emerald-300 active:scale-95 transition-transform cursor-pointer"
          >
            Reload Apple Farm
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
