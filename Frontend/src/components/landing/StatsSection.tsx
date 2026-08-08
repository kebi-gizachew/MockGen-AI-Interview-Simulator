import React, { useEffect, useState } from 'react';
import { Users, ClipboardCheck, Code2 } from 'lucide-react';
import { getPublicStats } from '../../services/stats.service';
import { PublicStats } from '../../types';

interface StatCardConfig {
  key: keyof PublicStats;
  label: string;
  icon: React.ReactNode;
  iconClasses: string;
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: 'registeredUsers',
    label: 'Registered Users',
    icon: <Users className="w-6 h-6" />,
    iconClasses: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  },
  {
    key: 'completedInterviews',
    label: 'Interviews Completed',
    icon: <ClipboardCheck className="w-6 h-6" />,
    iconClasses: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  },
  {
    key: 'codeSubmissions',
    label: 'Code Submissions',
    icon: <Code2 className="w-6 h-6" />,
    iconClasses: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
];

const formatCount = (value: number): string => value.toLocaleString('en-US');

/**
 * Live platform statistics band for the landing page. Fetches aggregate
 * counts from GET /api/stats. While loading it shows skeleton placeholders;
 * if the request fails it shows "—" placeholders (never invents fake numbers
 * and never breaks the rest of the page).
 */
export const StatsSection: React.FC = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicStats()
      .then((response) => {
        if (!cancelled) setStats(response.data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20" aria-label="Platform statistics">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="glass-panel rounded-3xl p-8 border border-slate-800 hover:border-purple-500/40 transition-all group"
          >
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${card.iconClasses}`}
            >
              {card.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">{card.label}</h3>
            {failed ? (
              // Backend unavailable: never invent numbers — show a placeholder.
              <p className="text-4xl font-black tracking-tight text-slate-600">—</p>
            ) : loading || !stats ? (
              <div className="h-10 w-28 rounded-lg bg-slate-800 animate-pulse" aria-hidden="true" />
            ) : (
              <p className="text-4xl font-black tracking-tight text-slate-100">
                {formatCount(stats[card.key])}
                <span className="text-purple-400">+</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
