export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export const formatTimeAgo = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  return formatDate(dateString);
};

import { HiringRecommendation } from '../types';

export const getScoreBadgeColor = (score?: number | null): string => {
  if (score === undefined || score === null) return 'bg-gray-800 text-gray-400 border-gray-700';
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
};

/** Deterministic verdict from a score — mirrors Backend/src/utils/recommendation.js. */
export const deriveRecommendation = (score: number): HiringRecommendation => {
  if (score >= 85) return 'Strong Hire';
  if (score >= 70) return 'Hire';
  if (score >= 55) return 'Leaning Hire';
  if (score >= 40) return 'Needs Improvement';
  return 'Not Ready Yet';
};

/** Tailwind badge classes per hiring recommendation (falls back by score). */
export const getRecommendationBadgeColor = (recommendation?: string | null, score?: number | null): string => {
  const verdict = recommendation || deriveRecommendation(score ?? 0);
  switch (verdict) {
    case 'Strong Hire':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    case 'Hire':
      return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
    case 'Leaning Hire':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'Needs Improvement':
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
  }
};
