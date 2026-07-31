import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewSession } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ArrowLeft, CheckCircle, Clock, Edit2, Check, X, Bot, Wifi, WifiOff } from 'lucide-react';

export interface SessionHeaderProps {
  session: InterviewSession;
  onEndInterview: () => Promise<void>;
  onUpdateTitle?: (newTitle: string) => Promise<void>;
  isEnding?: boolean;
  isConnected?: boolean;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  session,
  onEndInterview,
  onUpdateTitle,
  isEnding = false,
  isConnected = false,
}) => {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(session.title);

  // Live timer since startedAt
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!session.startedAt || session.status === 'completed') return;

    const startTime = new Date(session.startedAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt, session.status]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const isActive = session.status === 'active';

  const handleSaveTitle = async () => {
    if (onUpdateTitle && titleText.trim() && titleText !== session.title) {
      await onUpdateTitle(titleText.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="w-full glass-panel border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Left side: Back button & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  className="bg-slate-900 text-slate-100 text-sm font-bold rounded-lg px-2.5 py-1 border border-purple-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-100 truncate">
                  {session.title}
                </h2>
                {isActive && onUpdateTitle && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-slate-500 hover:text-purple-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Edit session title"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-1 font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              <Clock className="w-3 h-3 text-purple-400" />
              {isActive ? formatTimer(elapsedSeconds) : 'Session Ended'}
            </span>

            <span className="hidden sm:flex items-center gap-1.5 text-[11px]">
              {isConnected ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Socket Live
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> REST Protocol
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Status badge & End interview button */}
      <div className="flex items-center gap-3">
        <Badge variant={isActive ? 'active' : 'completed'}>
          {isActive ? 'Technical Screen in Progress' : 'Completed'}
        </Badge>

        {isActive && (
          <Button
            variant="danger"
            size="sm"
            onClick={onEndInterview}
            isLoading={isEnding}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            End & Generate Debrief
          </Button>
        )}
      </div>
    </div>
  );
};
