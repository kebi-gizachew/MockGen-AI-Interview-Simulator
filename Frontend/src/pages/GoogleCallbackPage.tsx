import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/common/Spinner';

/**
 * Landing page for the Google OAuth redirect. The backend redirects here with
 * `?token=...&user=...`; we store the session and route to the dashboard.
 */
export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeExternalLogin } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('google');

    if (!token || !userParam) {
      navigate(error === 'error' ? '/login?google=error' : '/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      completeExternalLogin(token, user);
      navigate('/dashboard', { replace: true });
    } catch {
      navigate('/login?google=error', { replace: true });
    }
  }, [searchParams, navigate, completeExternalLogin]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-slate-400">Completing Google sign-in...</p>
    </div>
  );
};

export default GoogleCallbackPage;
