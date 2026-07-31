import React from 'react';
import { Link } from 'react-router-dom';
import { InterviewSession } from '../../types';
import { Card } from '../common/Card';
import { formatTimeAgo } from '../../utils/formatters';
import { Activity, Clock, CheckCircle2, MessageSquare, Play, Sparkles } from 'lucide-react';

export interface RecentActivityFeedProps {
  sessions: InterviewSession[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ sessions }) => {
  // Sort sessions by updatedAt / startedAt descending
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.updatedAt || b.startedAt).getTime() - new Date(a.updatedAt || a.startedAt).getTime())
    .slice(0, 5);

  if (recentSessions.length === 0) return null;

  return (
    <Card className="mb-8 border-slate-800">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Recent Interview Activity
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">Latest Events</span>
      </div>

      <div className="space-y-3">
        {recentSessions.map((session) => {
          const isActive = session.status === 'active';
          return (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {isActive ? <Play className="w-4 h-4 fill-current" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-200 truncate">
                    {session.title || 'Technical Mock Interview'}
                  </h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatTimeAgo(session.updatedAt || session.startedAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      {session._count?.messages || 0} messages
                    </span>
                  </p>
                </div>
              </div>

              <Link
                to={isActive ? `/interview/${session.id}` : `/debrief/${session.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  isActive
                    ? 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {isActive ? 'Resume Session' : 'View Summary'}
              </Link>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
