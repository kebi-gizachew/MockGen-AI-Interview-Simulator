import React from 'react';

export interface ScoreGaugeProps {
  score: number;
  label?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label = 'Overall Score' }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  const getColor = () => {
    if (normalizedScore >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (normalizedScore >= 60) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-400 stroke-rose-500';
  };

  const strokeDasharray = 283; // 2 * pi * 45
  const strokeDashoffset = strokeDasharray - (strokeDasharray * normalizedScore) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-slate-800 fill-none"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            className={`fill-none transition-all duration-1000 ease-out ${getColor()}`}
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-black ${getColor().split(' ')[0]}`}>
            {normalizedScore}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            / 100
          </span>
        </div>
      </div>
      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-3">{label}</p>
    </div>
  );
};
