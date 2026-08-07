import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { interviewService } from '../services/interview.service';
import { authService } from '../services/auth.service';
import { InterviewSession, SessionStatus, StartInterviewConfig } from '../types';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { SessionCard } from '../components/dashboard/SessionCard';
import { StartInterviewModal } from '../components/dashboard/StartInterviewModal';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { Plus, RefreshCw, Layers, Sparkles, User as UserIcon, ShieldAlert } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendMsg, setResendMsg] = useState<string>('');

  const handleResendVerification = async () => {
    if (!user?.email || isResending) return;
    setIsResending(true);
    setResendMsg('');
    try {
      await authService.resendVerification(user.email);
      setResendMsg('Verification email sent — check your inbox.');
    } catch (err: unknown) {
      setResendMsg(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await interviewService.getUserSessions({
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      setSessions(res.data.sessions || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch interview sessions.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleStartSession = async (config: StartInterviewConfig) => {
    const res = await interviewService.createSession(config);
    const newSessionId = res.data.session.id;
    navigate(`/interview/${newSessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await interviewService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete session.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unverified Email Banner */}
        {user && user.provider !== 'google' && !user.isVerified && (
          <div className="glass-panel border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 bg-gradient-to-r from-amber-950/30 to-slate-900/60">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-200">Your email is not verified yet</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Confirm your address to fully activate your account and never miss session reports.
                </p>
                {resendMsg && <p className="text-xs text-emerald-400 mt-1">{resendMsg}</p>}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResendVerification}
              isLoading={isResending}
              className="shrink-0"
            >
              Resend Verification Email
            </Button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 mb-8 bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
                  Welcome back, {user?.name || user?.email?.split('@')[0] || 'Candidate'}!
                </h1>
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Your AI interview suite is ready. Practice technical screens, live code snippets, and review debriefs.
              </p>
            </div>
          </div>

          {/* Start Interview CTA */}
          <div className="shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-5 h-5" />}
              className="w-full sm:w-auto shadow-lg shadow-purple-600/30"
            >
              Start New AI Interview
            </Button>
          </div>
        </div>

        {/* Statistics Section */}
        <StatsOverview sessions={sessions} />

        {/* Recent Activity Section */}
        <RecentActivityFeed sessions={sessions} />

        {/* Interview History Header & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">Interview History</h2>
            <p className="text-xs text-slate-400">All candidate interview sessions and debrief archives</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <Layers className="w-4 h-4 text-slate-400 ml-2" />
              {(['all', 'active', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                    filterStatus === st
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSessions}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Sessions Grid / States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-slate-400 mt-3">Loading candidate sessions...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center glass-panel border border-rose-500/30 rounded-2xl max-w-lg mx-auto my-12">
            <p className="text-sm text-rose-400 font-medium mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchSessions}>
              Retry Connection
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center glass-panel border border-slate-800 rounded-3xl max-w-md mx-auto my-8 p-8">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">No Interview Sessions</h3>
            <p className="text-xs text-slate-400 mb-5">
              {filterStatus === 'all'
                ? "You haven't started any AI interview sessions yet."
                : `No sessions found with status "${filterStatus}".`}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Start First Interview
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={handleDeleteSession} />
            ))}
          </div>
        )}
      </main>

      {/* Start Interview Modal */}
      <StartInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStartSession}
      />
    </div>
  );
};
