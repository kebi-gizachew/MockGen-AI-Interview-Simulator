import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Bot, CheckCircle2, XCircle, MailCheck } from 'lucide-react';

/**
 * Handles the ?token=... link from the verification email: calls the API,
 * updates the local user, and shows a success / error state.
 */
export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please use the full link from your email.');
      return;
    }
    handledRef.current = true;

    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (res.data.user) setUser(res.data.user);
        setStatus('success');
        setMessage('Your email has been verified. Your account is now fully active.');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed. The link may be invalid or expired.');
      }
    };
    verify();
  }, [searchParams, setUser]);

  const handleResend = async () => {
    if (!user?.email || resending) return;
    setResending(true);
    setResent(false);
    try {
      await authService.resendVerification(user.email);
      setResent(true);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to resend the verification email.');
      setStatus('error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
        <div className="inline-flex p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
          <Bot className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Email Verification</h2>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Spinner size="md" />
            <p className="text-sm text-slate-400">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">{message}</span>
            </div>
            <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start justify-center gap-2">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-left">{message}</span>
            </div>
            {user?.email && !resent && (
              <Button variant="secondary" size="md" className="w-full" isLoading={resending} onClick={handleResend}>
                <MailCheck className="w-4 h-4 mr-2" />
                Resend Verification Email
              </Button>
            )}
            {resent && (
              <p className="text-xs text-emerald-400 font-medium">
                A new verification email is on its way to {user?.email}.
              </p>
            )}
            <p className="text-center text-xs text-slate-400">
              <Link to="/dashboard" className="font-bold text-purple-400 hover:text-purple-300 underline">
                Back to Dashboard
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
