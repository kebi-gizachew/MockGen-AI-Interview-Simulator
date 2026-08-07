import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input, InputProps } from './Input';

/**
 * Password field with a working visibility toggle. The eye icon is explicitly
 * colored for the dark theme (never inherits a black/near-invisible style),
 * is clickable (type="button"), and swaps between Eye / EyeOff.
 */
export const PasswordInput: React.FC<InputProps> = ({ label, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      label={label}
      type={visible ? 'text' : 'password'}
      leftIcon={props.leftIcon ?? <Lock className="w-4 h-4" />}
      rightIcon={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          className="p-1.5 -mr-1 text-slate-400 hover:text-purple-300 active:scale-95 transition-colors focus:outline-none"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
};
