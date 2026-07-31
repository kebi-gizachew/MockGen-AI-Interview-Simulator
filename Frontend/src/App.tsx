import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { DebriefPage } from './pages/DebriefPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Candidate Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/interview/:id" element={<InterviewRoomPage />} />
                <Route path="/debrief/:id" element={<DebriefPage />} />
              </Route>

              {/* Default Redirection & 404 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
