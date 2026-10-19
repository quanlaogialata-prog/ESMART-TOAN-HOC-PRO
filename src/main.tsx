import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Ứng dụng gặp lỗi giao diện:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border border-slate-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Đang tải lại giao diện hệ thống</h2>
            <p className="text-slate-600 text-sm mb-6">
              Đã xảy ra sự cố hiển thị tạm thời ({this.state.error?.message || 'Lỗi không xác định'}). Vui lòng nhấn nút bên dưới để khôi phục giao diện.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('active_test_in_progress');
                  } catch (e) {}
                  window.location.reload();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow cursor-pointer"
              >
                Tải lại trang ngay
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Clear initial HTML loader timer
if (typeof window !== 'undefined' && (window as any).__esmartInitTimeout) {
  clearTimeout((window as any).__esmartInitTimeout);
}

// Mount React immediately
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error("Root element not found in DOM");
}

// Background cleanup: safely handle Service Worker without blocking UI rendering
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  setTimeout(() => {
    try {
      if (import.meta.env.DEV) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().catch(() => {});
          }
        }).catch(() => {});
      } else {
        import('virtual:pwa-register').then(({ registerSW }) => {
          try {
            registerSW({
              immediate: true,
              onNeedRefresh() {},
              onOfflineReady() {}
            });
          } catch (e) {
            console.warn('PWA registration skipped:', e);
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("ServiceWorker handling bypassed:", e);
    }
  }, 100);
}
