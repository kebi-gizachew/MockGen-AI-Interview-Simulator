import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewSession } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import { Play, CheckCircle2, MessageSquare, Code, Trash2 } from 'lucide-react';

export interface SessionCardProps {
  session: InterviewSession;
  onDelete?: (sessionId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onDelete }) => {
  const navigate = useNavigate();
  const isActive = session.status === 'active';

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      navigate(`/interview/${session.id}`);
    } else {
      navigate(`/debrief/${session.id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Are you sure you want to delete session "${session.title}"?`)) {
      onDelete(session.id);
    }
  };

  return (
    <Card className="flex flex-col justify-between h-full group hover:border-purple-500/40">
      <div>
        {/* Status Badge & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={isActive ? 'active' : 'completed'}>
            {isActive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Session
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </>
            )}
          </Badge>

          {onDelete && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
              title="Delete session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-100 mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
          {session.title || 'Untitled Interview Session'}
        </h4>

        {/* Timestamps */}
        <p className="text-xs text-slate-400 mb-4">
          Started {formatTimeAgo(session.startedAt)} • {formatDate(session.startedAt)}
        </p>

        {/* Stats counters */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-5 py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>{session._count?.messages || 0} messages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>{session._count?.codeSubmissions || 0} code snippets</span>
          </div>
        </div>
      </div>

      {/* Button Action */}
      <Button
        variant={isActive ? 'primary' : 'secondary'}
        size="sm"
        className="w-full"
        onClick={handleAction}
        leftIcon={isActive ? <Play className="w-3.5 h-3.5 fill-current" /> : undefined}
      >
        {isActive ? 'Continue Interview' : 'View Debrief & Feedback'}
      </Button>
    </Card>
  );
};
