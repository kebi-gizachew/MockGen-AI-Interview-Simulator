// Password policy — must mirror Backend/src/services/auth.service.js exactly.
// The backend is the source of truth; this drives the live checklist UX.

export interface PasswordRule {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number (0-9)', test: (p) => /\d/.test(p) },
  {
    key: 'special',
    label: 'One special character (e.g. ! @ # $ % ^ & *)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

/** Returns the rules that FAILED for the given password (empty = valid). */
export const getFailedPasswordRules = (password: string): PasswordRule[] =>
  PASSWORD_RULES.filter((rule) => !rule.test(password));

/** Returns the rules the password satisfies (for the green checklist). */
export const getPassedPasswordRules = (password: string): PasswordRule[] =>
  PASSWORD_RULES.filter((rule) => rule.test(password));

export const isPasswordValid = (password: string): boolean =>
  getFailedPasswordRules(password).length === 0;
