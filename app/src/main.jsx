import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificacoesProvider } from './context/NotificacoesContext';
import { PresenceProvider } from './context/PresenceContext';
import { ChatBadgeProvider } from './context/ChatBadgeContext';
import App from './App';
import './lib/installPrompt';
import './styles/tokens.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <NotificacoesProvider>
            <PresenceProvider>
              <ChatBadgeProvider>
                <App />
              </ChatBadgeProvider>
            </PresenceProvider>
          </NotificacoesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
