import React, { useEffect, useState, useCallback } from 'react';
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
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);

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
      setIsAiThinking(false);
      setIsSending(false);

      if (payload.assistantMessage) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.assistantMessage.id)) return prev;
          return [...prev, payload.assistantMessage];
        });
      }
    };

    const handleSocketError = (err: { message?: string }) => {
      setIsAiThinking(false);
      setIsSending(false);
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
  }, [socket, isConnected, sessionId]);

  // Send candidate message (via Socket if connected, else via REST)
  const handleSendMessage = async (text: string) => {
    if (!sessionId || isSending) return;

    setIsSending(true);
    setIsAiThinking(true);

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
        const msg = err instanceof Error ? err.message : 'Failed to send message.';
        alert(msg);
      } finally {
        setIsSending(false);
        setIsAiThinking(false);
      }
    }
  };

  // Submit code snippet
  const handleSubmitCode = async (params: { language: string; code: string; notes?: string }) => {
    if (!sessionId) return;
    try {
      const res = await interviewService.submitCode(sessionId, params);
      setSubmissions((prev) => [res.data.submission, ...prev]);

      // Notify in chat feed & trigger AI feedback
      const rawRes = await interviewService.saveRawMessage(
        sessionId,
        'system',
        `Candidate submitted a ${params.language} code solution.`
      );
      setMessages((prev) => [...prev, rawRes.data.message]);

      // Also trigger chat exchange for AI code analysis
      handleSendMessage(`I submitted code in ${params.language}: ${params.notes || 'Please review my logic.'}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit code.');
    }
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
          <div className="flex-1 p-4 sm:p-6 min-h-0 max-w-7xl w-full mx-auto">
            <CodeEditorTab
              submissions={submissions}
              onSubmitCode={handleSubmitCode}
              onDeleteSubmission={handleDeleteSubmission}
              readOnly={isCompleted}
            />
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
