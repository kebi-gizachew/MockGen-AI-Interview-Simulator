import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 border border-purple-500/50',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500/50',
    outline:
      'border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400',
    ghost:
      'text-slate-300 hover:text-white hover:bg-slate-800/60',
  }[variant];

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5',
  }[size];

  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-2" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
