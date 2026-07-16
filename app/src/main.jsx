import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CategoriasProvider } from './context/CategoriasContext';
import { NotificacoesProvider } from './context/NotificacoesContext';
import { PresenceProvider } from './context/PresenceContext';
import { ChatBadgeProvider } from './context/ChatBadgeContext';
import App from './App';
import UpdateBanner from './components/UpdateBanner';
import ErrorBoundary from './components/ErrorBoundary';
import './lib/installPrompt';
import './styles/tokens.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ThemeProvider>
          <CategoriasProvider>
            <AuthProvider>
              <NotificacoesProvider>
                <PresenceProvider>
                  <ChatBadgeProvider>
                    <App />
                    <UpdateBanner />
                  </ChatBadgeProvider>
                </PresenceProvider>
              </NotificacoesProvider>
            </AuthProvider>
          </CategoriasProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
