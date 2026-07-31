import React from 'react';
import { Card } from '../common/Card';
import { InterviewSession } from '../../types';
import { PlayCircle, CheckCircle2, MessageSquare, Award } from 'lucide-react';

export interface StatsOverviewProps {
  sessions: InterviewSession[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ sessions }) => {
  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const totalMessages = sessions.reduce((acc, s) => acc + (s._count?.messages || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <PlayCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sessions</p>
          <p className="text-2xl font-black text-slate-100">{activeCount}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-black text-slate-100">{completedCount}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Exchanges</p>
          <p className="text-2xl font-black text-slate-100">{totalMessages}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Interviews</p>
          <p className="text-2xl font-black text-slate-100">{sessions.length}</p>
        </div>
      </Card>
    </div>
  );
};
