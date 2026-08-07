import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { PasswordInput } from '../components/common/PasswordInput';
import { Button } from '../components/common/Button';
import { authService, GOOGLE_AUTH_URL } from '../services/auth.service';
import { getFailedPasswordRules, isPasswordValid, PASSWORD_RULES } from '../utils/password';
import { Bot, Mail, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Hide the Google button when the backend has no OAuth credentials.
  useEffect(() => {
    authService
      .getAuthConfig()
      .then((res) => setGoogleEnabled(Boolean(res.data.googleEnabled)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email.trim() || !password) {
      setError('Please provide email and password.');
      return;
    }

    const failedRules = getFailedPasswordRules(password);
    if (failedRules.length > 0) {
      setShowRules(true);
      setError(`Password must include ${failedRules.map((r) => r.label.toLowerCase()).join(', ')}.`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      // The backend sends the welcome email at registration (accounts are
      // active immediately); the banner below confirms the message was sent.
      setIsRegistered(true);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Email may already exist.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Create Candidate Account</h2>
          <p className="mt-2 text-xs text-slate-400">
            Start realistic AI coding & technical interviews in seconds
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Registration confirmation notice */}
        {isRegistered && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center">
            <ShieldCheck className="w-4 h-4 inline mr-1 -mt-0.5" />
            Welcome email sent to <span className="font-bold">{email}</span> — your account is ready to go.
          </div>
        )}

        {/* Google Sign Up */}
        {googleEnabled && (
          <div className="space-y-3">
            <a
              href={GOOGLE_AUTH_URL}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 text-sm font-semibold hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              <GoogleIcon />
              Sign up with Google
            </a>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name (Optional)"
            type="text"
            placeholder="Jane Candidate"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
            autoFocus
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="candidate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setShowRules(true);
            }}
            onFocus={() => setShowRules(true)}
            helperText="Must be at least 8 characters with upper & lowercase letters, a number, and a special character."
            required
          />

          {/* Live password-strength checklist */}
          {showRules && password.length > 0 && (
            <ul className="space-y-1.5 -mt-1">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                  <li
                    key={rule.key}
                    className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                      passed ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            disabled={password.length > 0 && !isPasswordValid(password)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account & Launch
          </Button>
        </form>

        {/* Login prompt */}
        <p className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-purple-400 hover:text-purple-300 underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};
