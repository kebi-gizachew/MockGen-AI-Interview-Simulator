import React, { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-900/80 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-rose-500/60 focus:border-rose-500'
              : 'border-slate-800 focus:border-purple-500/80 hover:border-slate-700'
          } ${className}`}
          {...props}
        />
        {rightIcon && <div className="absolute right-3.5 text-slate-400">{rightIcon}</div>}
      </div>
      {error ? (
        <p className="text-xs text-rose-400 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
