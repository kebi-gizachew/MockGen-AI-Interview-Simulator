import React, { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: 'purple' | 'emerald' | 'none';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  onClick,
}) => {
  const glowStyles = {
    purple: 'glow-purple border-purple-500/30',
    emerald: 'glow-emerald border-emerald-500/30',
    none: 'border-slate-800 hover:border-slate-700',
  }[glow];

  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-xl p-6 transition-all duration-200 ${glowStyles} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
