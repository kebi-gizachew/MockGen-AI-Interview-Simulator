import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewSession } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ArrowLeft, CheckCircle, Clock, Edit2, Check, X } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export interface SessionHeaderProps {
  session: InterviewSession;
  onEndInterview: () => Promise<void>;
  onUpdateTitle?: (newTitle: string) => Promise<void>;
  isEnding?: boolean;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  session,
  onEndInterview,
  onUpdateTitle,
  isEnding = false,
}) => {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(session.title);

  const isActive = session.status === 'active';

  const handleSaveTitle = async () => {
    if (onUpdateTitle && titleText.trim() && titleText !== session.title) {
      await onUpdateTitle(titleText.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="w-full glass-panel border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
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
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Started {formatTimeAgo(session.startedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Status badge & End interview button */}
      <div className="flex items-center gap-3">
        <Badge variant={isActive ? 'active' : 'completed'}>
          {isActive ? 'Live Technical Screen' : 'Completed Session'}
        </Badge>

        {isActive && (
          <Button
            variant="danger"
            size="sm"
            onClick={onEndInterview}
            isLoading={isEnding}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            End Interview & Generate Debrief
          </Button>
        )}
      </div>
    </div>
  );
};
