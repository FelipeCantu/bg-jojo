import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from "./AuthContext";
import { ThemeProvider, studioTheme } from '@sanity/ui';
import { BrowserRouter } from 'react-router-dom';

// Enhanced Error Boundary with hydration error support
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isHydrationError: false
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      isHydrationError: error.message.includes('hydration')
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    // Add error reporting here if needed
  }

  handleFullReload = () => {
    // Clear cache and reload for hydration errors
    if (this.state.isHydrationError) {
      if (window.caches) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    }
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2>Application Error</h2>
          <p style={{ color: '#e03131', margin: '1rem 0' }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </p>
          {this.state.isHydrationError && (
            <p style={{ margin: '1rem 0' }}>
              This appears to be a rendering mismatch. A full refresh may help.
            </p>
          )}
          <button 
            onClick={this.handleFullReload}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4263eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {this.state.isHydrationError ? 'Clear Cache & Reload' : 'Refresh Page'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe root element initialization with hydration error prevention
function initializeApp() {
  // Create a clean root container if needed
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    return newRoot;
  }

  // Clear any existing content that might cause hydration mismatch
  if (rootElement.innerHTML.trim() !== '') {
    console.warn('Existing content in root element - clearing to prevent hydration issues');
    rootElement.innerHTML = '';
  }

  return rootElement;
}

// Main render function with error protection
function renderApp() {
  try {
    const rootElement = initializeApp();
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <ThemeProvider theme={studioTheme}>
                <App />
              </ThemeProvider>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );

    return root;
  } catch (error) {
    console.error('Failed to render application:', error);
    
    // Fallback error display if rendering fails completely
    const rootElement = document.getElementById('root') || document.body;
    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
        <h2 style="color: #e03131;">Critical Rendering Error</h2>
        <p>Failed to initialize the application.</p>
        <p>${error.message}</p>
        <button 
          onclick="window.location.reload(true)" 
          style="
            padding: 0.75rem 1.5rem;
            background: #228be6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
          "
        >
          Force Reload
        </button>
      </div>
    `;
  }
}

// Initialize the application
renderApp();

// Web Vitals reporting
if (process.env.NODE_ENV === 'production') {
  reportWebVitals();
}