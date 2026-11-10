import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SeniorModeProvider } from './context/SeniorModeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';
import { VoiceAgentProvider } from './context/VoiceAgentContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SeniorModeProvider>
          <LanguageProvider>
            <LocationProvider>
              <NotificationProvider>
                <VoiceAgentProvider>
                  <App />
                </VoiceAgentProvider>
              </NotificationProvider>
            </LocationProvider>
          </LanguageProvider>
        </SeniorModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
