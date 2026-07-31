import React from 'react';
import { Link } from 'react-router-dom';
import { InterviewSession } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { TrendingUp, Award, Calendar, CheckCircle2 } from 'lucide-react';

export interface PreviousPerformanceComparisonProps {
  currentSessionId: string;
  allSessions: InterviewSession[];
}

export const PreviousPerformanceComparison: React.FC<PreviousPerformanceComparisonProps> = ({
  currentSessionId,
  allSessions,
}) => {
  // Filter other completed sessions
  const pastSessions = allSessions.filter(
    (s) => s.id !== currentSessionId && s.status === 'completed'
  );

  if (pastSessions.length === 0) {
    return (
      <Card className="mt-6 border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Previous Interview Performance History
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          This is your first completed technical screen. Future interview debriefs will display score trends and historical comparisons here!
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Previous Interview Performance ({pastSessions.length} Past Screens)
          </h3>
        </div>
        <Badge variant="purple">Performance History</Badge>
      </div>

      <div className="space-y-3">
        {pastSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200">{session.title}</h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formatDate(session.startedAt)}
                  </span>
                  <span>•</span>
                  <span>{session._count?.messages || 0} Exchanges</span>
                </p>
              </div>
            </div>

            <Link
              to={`/debrief/${session.id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition-all"
            >
              Compare Debrief
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
};
