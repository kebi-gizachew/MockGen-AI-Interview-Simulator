import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewService } from '../services/interview.service';
import { InterviewSession, CodeSubmission, Feedback } from '../types';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { ScoreGauge } from '../components/debrief/ScoreGauge';
import { FeedbackBreakdown } from '../components/debrief/FeedbackBreakdown';
import { TranscriptViewer } from '../components/debrief/TranscriptViewer';
import { PreviousPerformanceComparison } from '../components/debrief/PreviousPerformanceComparison';
import { CodeEditorTab } from '../components/interview/CodeEditorTab';
import { formatDate, deriveRecommendation, getRecommendationBadgeColor } from '../utils/formatters';
import { ArrowLeft, Award, CheckCircle, Code, MessageSquare, TrendingUp } from 'lucide-react';

export const DebriefPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [allSessions, setAllSessions] = useState<InterviewSession[]>([]);
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'feedback' | 'transcript' | 'code' | 'history'>('feedback');

  const loadDebriefData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');

    try {
      const [sessionRes, codeRes, allSessionsRes, feedbackRes] = await Promise.all([
        interviewService.getSessionById(sessionId),
        interviewService.getCodeSubmissions(sessionId),
        interviewService.getUserSessions({ limit: 50 }),
        interviewService.getFeedback(sessionId),
      ]);

      setSession(sessionRes.data.session);
      setSubmissions(codeRes.data.submissions || []);
      setAllSessions(allSessionsRes.data.sessions || []);
      setFeedback(feedbackRes.data.feedback);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load interview debrief.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadDebriefData();
  }, [loadDebriefData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-400 mt-3">Compiling interview debrief & AI analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center max-w-md">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Debrief Unavailable</h3>
            <p className="text-xs text-slate-400 mb-6">{error || 'Session not found.'}</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const messages = session.messages || [];

  // Real persisted evaluation takes precedence; fall back to the transcript.
  const summaryMessage = messages.find((m) => m.metadata?.type === 'summary');
  const finalScore = feedback?.score ?? session.score ?? summaryMessage?.metadata?.score ?? 0;
  // Hiring-committee verdict: persisted recommendation, else derived from score.
  const recommendation = feedback?.recommendation || deriveRecommendation(finalScore);
  const recommendationColor = getRecommendationBadgeColor(recommendation, finalScore);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-100">{session.title}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Debrief Generated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Conducted {formatDate(session.startedAt)} • {messages.length} Exchanges
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Top Score & Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreGauge score={finalScore} label="Overall Interview Score" />
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-2">
                AI Interviewer Executive Summary
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {summaryMessage?.content ||
                  'Your candidate technical screen has been fully processed and evaluated against system architecture, code clarity, and problem-solving benchmarks.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-800 text-center">
              <div>
                <span className="block text-xs text-slate-400 font-medium">Exchanges</span>
                <span className="text-lg font-bold text-slate-100">{messages.length}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 font-medium">Code Snippets</span>
                <span className="text-lg font-bold text-slate-100">{submissions.length}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 font-medium">Hiring Recommendation</span>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-extrabold border ${recommendationColor}`}
                >
                  {recommendation}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation with Responsive Horizontal Scroll */}
        <div className="border-b border-slate-800 overflow-x-auto scrollbar-none">
          <div className="flex gap-4 min-w-max">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'feedback'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              Evaluation & Breakdown
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'history'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Previous Performance Comparison
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'transcript'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Full Transcript ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'code'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-4 h-4" />
              Submitted Code ({submissions.length})
            </button>
          </div>
        </div>

        {/* Active Tab View */}
        <div>
          {activeTab === 'feedback' && (
            <FeedbackBreakdown
              feedback={feedback}
              summaryContent={summaryMessage?.content}
              score={finalScore}
              recommendation={recommendation}
              recommendationColor={recommendationColor}
            />
          )}

          {activeTab === 'history' && (
            <PreviousPerformanceComparison
              currentSessionId={session.id}
              allSessions={allSessions}
            />
          )}

          {activeTab === 'transcript' && <TranscriptViewer messages={messages} />}

          {activeTab === 'code' && (
            <CodeEditorTab
              submissions={submissions}
              language="javascript"
              codeBuffers={{}}
              onLanguageChange={() => {}}
              onCodeChange={() => {}}
              onSubmitCode={async () => {}}
              onRunCode={async () => ({
                passed: 0,
                failed: 0,
                total: 0,
                results: [],
                error: 'Execution is disabled on completed interviews.',
              })}
              readOnly={true}
            />
          )}
        </div>
      </main>
    </div>
  );
};
