import React from 'react';
import { Card } from '../common/Card';
import { InterviewSession } from '../../types';
import { PlayCircle, CheckCircle2, Award, TrendingUp } from 'lucide-react';

export interface StatsOverviewProps {
  sessions: InterviewSession[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ sessions }) => {
  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  const completed = sessions.filter((s) => s.status === 'completed' && s.score !== null && s.score !== undefined);
  const averageScore = completed.length
    ? Math.round(completed.reduce((acc, s) => acc + (s.score || 0), 0) / completed.length)
    : null;

  // Best performing topics: average score per topic across completed, scored sessions
  const topicScores = new Map<string, { total: number; count: number }>();
  completed.forEach((s) => {
    const topic = s.question?.topic || 'General';
    const entry = topicScores.get(topic) || { total: 0, count: 0 };
    entry.total += s.score || 0;
    entry.count += 1;
    topicScores.set(topic, entry);
  });
  const bestTopics = [...topicScores.entries()]
    .map(([topic, { total, count }]) => ({ topic, average: Math.round(total / count) }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);

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
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Score</p>
          <p className="text-2xl font-black text-slate-100">
            {averageScore !== null ? averageScore : '—'}
            {averageScore !== null && <span className="text-sm font-bold text-slate-500">/100</span>}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Best Topics</p>
          {bestTopics.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {bestTopics.map((t) => (
                <span
                  key={t.topic}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                  title={`${t.topic}: ${t.average}/100 avg`}
                >
                  {t.topic} {t.average}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xl font-black text-slate-100">—</p>
          )}
        </div>
      </Card>
    </div>
  );
};
