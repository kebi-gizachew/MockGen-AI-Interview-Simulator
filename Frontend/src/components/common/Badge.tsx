import React, { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'active' | 'completed' | 'purple' | 'gray' | 'danger' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    gray: 'bg-slate-800 text-slate-300 border-slate-700',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  }[variant];

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium rounded',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-md',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 border uppercase tracking-wider ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
