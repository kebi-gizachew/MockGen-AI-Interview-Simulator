import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { interviewService } from '../services/interview.service';
import { InterviewSession, Message, CodeSubmission, SocketAiResponsePayload } from '../types';
import { Navbar } from '../components/common/Navbar';
import { Spinner } from '../components/common/Spinner';
import { SessionHeader } from '../components/interview/SessionHeader';
import { ChatMessageList } from '../components/interview/ChatMessageList';
import { ChatInput } from '../components/interview/ChatInput';
import { CodeEditorTab } from '../components/interview/CodeEditorTab';
import { QuestionHistory } from '../components/interview/QuestionHistory';
import { QuestionPanel } from '../components/interview/QuestionPanel';
import { SOCKET_EVENTS } from '../utils/constants';
import { MessageSquare, Code, HelpCircle, AlertCircle } from 'lucide-react';

export const InterviewRoomPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'questions'>('chat');

  // Editor state lives at the page level (not inside CodeEditorTab) so that
  // switching tabs never unmounts the buffers, and is mirrored to localStorage
  // so a page refresh / accidental navigation preserves the candidate's work.
  const [editorLanguage, setEditorLanguage] = useState<string>('javascript');
  const [codeBuffers, setCodeBuffers] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(`ai_interview_code_${sessionId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      /* corrupted storage — start fresh */
    }
    return {};
  });

  // If the route param changes without a remount (e.g. navigating straight from
  // one session room to another), reload that session's buffers instead of
  // carrying the previous session's code over. Declared BEFORE the save effect
  // so it runs first in the same commit.
  const skipNextSaveRef = useRef(false);
  useEffect(() => {
    skipNextSaveRef.current = true;
    try {
      const raw = localStorage.getItem(`ai_interview_code_${sessionId}`);
      setCodeBuffers(raw ? JSON.parse(raw) : {});
    } catch {
      setCodeBuffers({});
    }
  }, [sessionId]);

  // Auto-save the editor buffers on every change. Skips the commit right after
  // a session switch so stale buffers never overwrite the new session's code.
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    try {
      localStorage.setItem(`ai_interview_code_${sessionId}`, JSON.stringify(codeBuffers));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [codeBuffers, sessionId]);

  const handleCodeChange = useCallback((lang: string, value: string) => {
    setCodeBuffers((prev) => (prev[lang] === value ? prev : { ...prev, [lang]: value }));
  }, []);

  // Seed starter code into buffers once the question loads (languages without
  // any saved buffer yet get the question's starter template).
  useEffect(() => {
    const starter = session?.question?.starterCode;
    if (!starter) return;
    setCodeBuffers((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const lang of ['javascript', 'typescript', 'python', 'java', 'cpp']) {
        if (next[lang] === undefined && starter[lang]) {
          next[lang] = starter[lang];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [session?.question]);

  const handleEditorLanguageChange = useCallback((lang: string) => {
    setEditorLanguage(lang);
  }, []);

  // Reset one language buffer back to the question starter code (user-initiated clear).
  const handleResetCode = useCallback(
    (lang: string) => {
      const starter = session?.question?.starterCode?.[lang];
      if (starter) {
        setCodeBuffers((prev) => ({ ...prev, [lang]: starter }));
      }
    },
    [session?.question]
  );

  const [isSending, setIsSending] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const thinkingTimeoutRef = useRef<number | null>(null);
  const autoEndedRef = useRef(false);

  // True when the configured interview duration has elapsed.
  const isTimeUp = (s: InterviewSession | null): boolean => {
    if (!s || s.status !== 'active') return false;
    const minutes = Number(s.durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return false;
    const started = new Date(s.startedAt).getTime();
    if (!Number.isFinite(started)) return false;
    return Date.now() >= started + minutes * 60 * 1000;
  };

  // Route to the debrief after a server-reported time expiry (HTTP 410).
  const goToDebrief = useCallback(() => {
    if (!sessionId) return;
    navigate(`/debrief/${sessionId}`);
  }, [sessionId, navigate]);

  // Automatic interview completion: when the timer expires the AI closes the
  // session professionally (server-side autoExpired flow) and we land on the
  // debrief. Fires exactly once per session.
  const handleAutoEndInterview = useCallback(async () => {
    if (!sessionId || autoEndedRef.current) return;
    autoEndedRef.current = true;
    setIsEnding(true);
    try {
      await interviewService.endInterview(sessionId, { autoExpired: true });
      goToDebrief();
    } catch (err: unknown) {
      const apiError = err as Error & { status?: number };
      // 400 = a concurrent server-side auto-end already completed the session
      // (the server 410 guard on the chat path can race the timer). Not an
      // error from the candidate's perspective — route to the debrief silently.
      if (apiError?.status !== 400) {
        alert(apiError.message || 'Failed to finalize interview.');
      }
      setIsEnding(false);
      // Even if the report generation hiccuped, the session is now closed —
      // the debrief page falls back to the transcript when feedback is absent.
      goToDebrief();
    }
  }, [sessionId, goToDebrief]);

  // 1s ticker that triggers the auto-end the moment time runs out.
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const tick = () => {
      if (isTimeUp(session) && !autoEndedRef.current && !isEnding) {
        handleAutoEndInterview();
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session, isEnding, handleAutoEndInterview]);

  // Guard: reset the "AI thinking" UI state if no response arrives in time.
  const resetThinkingState = useCallback(() => {
    setIsSending(false);
    setIsAiThinking(false);
    if (thinkingTimeoutRef.current !== null) {
      window.clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
  }, []);

  const armThinkingTimeout = useCallback(() => {
    if (thinkingTimeoutRef.current !== null) {
      window.clearTimeout(thinkingTimeoutRef.current);
    }
    thinkingTimeoutRef.current = window.setTimeout(() => {
      resetThinkingState();
    }, 45000);
  }, [resetThinkingState]);

  // Load session & code submissions from REST API
  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');

    try {
      const [sessionRes, codeRes] = await Promise.all([
        interviewService.getSessionById(sessionId),
        interviewService.getCodeSubmissions(sessionId),
      ]);

      const loadedSession = sessionRes.data.session;
      setSession(loadedSession);
      setMessages(loadedSession.messages || []);
      setSubmissions(codeRes.data.submissions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load interview session.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Socket.IO real-time event listeners & room joining
  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;

    socket.emit(SOCKET_EVENTS.JOIN_SESSION, { sessionId });

    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleAiResponse = (payload: SocketAiResponsePayload) => {
      resetThinkingState();

      if (payload.assistantMessage) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.assistantMessage.id)) return prev;
          return [...prev, payload.assistantMessage];
        });
      }
    };

    const handleSocketError = (err: { message?: string; code?: number }) => {
      resetThinkingState();
      // 410 = the session's time expired server-side and the report is ready.
      if (err?.code === 410) {
        autoEndedRef.current = true;
        goToDebrief();
        return;
      }
      console.warn('Socket error event:', err.message);
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SOCKET_EVENTS.AI_RESPONSE, handleAiResponse);
    socket.on(SOCKET_EVENTS.ERROR, handleSocketError);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SOCKET_EVENTS.AI_RESPONSE, handleAiResponse);
      socket.off(SOCKET_EVENTS.ERROR, handleSocketError);
    };
  }, [socket, isConnected, sessionId, resetThinkingState, goToDebrief]);

  // Send candidate message (via Socket if connected, else via REST)
  const handleSendMessage = async (text: string) => {
    if (!sessionId || isSending) return;

    setIsSending(true);
    setIsAiThinking(true);
    armThinkingTimeout();

    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        sessionId,
        message: text,
      });
    } else {
      // REST API fallback
      try {
        const res = await interviewService.sendChatMessage(sessionId, text);
        setMessages((prev) => [...prev, res.data.userMessage, res.data.assistantMessage]);
      } catch (err: unknown) {
        const apiError = err as Error & { status?: number };
        // 410 = time expired; the server already generated the report.
        if (apiError?.status === 410) {
          autoEndedRef.current = true;
          goToDebrief();
          return;
        }
        const msg = apiError.message || 'Failed to send message.';
        alert(msg);
      } finally {
        resetThinkingState();
      }
    }
  };

  // Always-fires REST chat used for the AI code review after a submission.
  const requestAiCodeReview = async (text: string) => {
    if (!sessionId) return;
    try {
      setIsAiThinking(true);
      armThinkingTimeout();
      const res = await interviewService.sendChatMessage(sessionId, text);
      setMessages((prev) => [...prev, res.data.userMessage, res.data.assistantMessage]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to get AI code review.');
    } finally {
      resetThinkingState();
    }
  };

  // Submit code snippet — the backend runs the test cases, records the result,
  // and creates a system transcript note server-side. The AI review is triggered
  // via REST chat (which never drops the prompt), and the AI sees the actual
  // code through the server interview context.
  const handleSubmitCode = async (params: { language: string; code: string; notes?: string }) => {
    if (!sessionId) return;
    try {
      const res = await interviewService.submitCode(sessionId, params);
      setSubmissions((prev) => [res.data.submission, ...prev]);

      await requestAiCodeReview(
        `I submitted my ${params.language} solution${params.notes ? ` (${params.notes})` : ''}. Please review my code.`
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit code.');
    }
  };

  // Run code against the session question test cases on the backend
  const handleRunCode = async (language: string, code: string) => {
    if (!sessionId) return Promise.reject(new Error('Missing session id.'));
    const res = await interviewService.runCode(sessionId, language, code);
    return res.data.result;
  };

  // Delete code submission
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!sessionId) return;
    try {
      await interviewService.deleteCodeSubmission(sessionId, submissionId);
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete submission.');
    }
  };

  // Update Title
  const handleUpdateTitle = async (newTitle: string) => {
    if (!sessionId) return;
    try {
      const res = await interviewService.updateSession(sessionId, newTitle);
      setSession(res.data.session);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update title.');
    }
  };

  // End interview session
  const handleEndInterview = async () => {
    if (!sessionId || isEnding) return;
    if (!confirm('Are you sure you want to end this interview and view your final performance debrief?')) {
      return;
    }

    setIsEnding(true);
    try {
      await interviewService.endInterview(sessionId);
      navigate(`/debrief/${sessionId}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to end interview.');
      setIsEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-400 mt-3">Connecting to technical interview room...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    if (thinkingTimeoutRef.current !== null) {
      window.clearTimeout(thinkingTimeoutRef.current);
    }
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center max-w-md">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-100 mb-2">Session Error</h3>
            <p className="text-xs text-slate-400 mb-6">{error || 'Session not found.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = session.status === 'completed';

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      <Navbar />

      <SessionHeader
        session={session}
        onEndInterview={handleEndInterview}
        onUpdateTitle={handleUpdateTitle}
        isEnding={isEnding}
        isConnected={isConnected}
      />

      {/* Main Technical Workspace Toolbar with Responsive Horizontal Scroll */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'chat'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Interview Chat</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code Workspace</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">
              {submissions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'questions'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Question History</span>
          </button>
        </div>
      </div>

      {/* Workspace Main Display */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 max-w-5xl w-full mx-auto">
            <ChatMessageList messages={messages} isThinking={isAiThinking} />
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isCompleted}
              isSending={isSending}
            />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="flex-1 p-4 sm:p-6 min-h-0 max-w-[1600px] w-full mx-auto grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
            <div className="hidden xl:block min-h-0 overflow-hidden">
              <QuestionPanel question={session.question || null} />
            </div>
            <div className="min-h-0">
              <CodeEditorTab
                submissions={submissions}
                language={editorLanguage}
                codeBuffers={codeBuffers}
                onLanguageChange={handleEditorLanguageChange}
                onCodeChange={handleCodeChange}
                onResetCode={handleResetCode}
                onSubmitCode={handleSubmitCode}
                onRunCode={handleRunCode}
                onDeleteSubmission={handleDeleteSubmission}
                readOnly={isCompleted}
              />
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="flex-1 p-4 sm:p-6 min-h-0 max-w-4xl w-full mx-auto">
            <QuestionHistory messages={messages} />
          </div>
        )}
      </div>
    </div>
  );
};
