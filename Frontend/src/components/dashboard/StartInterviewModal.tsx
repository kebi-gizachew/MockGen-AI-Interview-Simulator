import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StartInterviewConfig } from '../../types';
import { Sparkles, Play, Building2, Cpu, Gauge, Code2, Timer } from 'lucide-react';

export interface StartInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: StartInterviewConfig) => Promise<void>;
}

const TOP_COMPANIES = [
  { id: 'google', name: 'Google' },
  { id: 'meta', name: 'Meta' },
  { id: 'amazon', name: 'Amazon (AWS)' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'apple', name: 'Apple' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'uber', name: 'Uber' },
  { id: 'airbnb', name: 'Airbnb' },
  { id: 'stripe', name: 'Stripe' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'custom', name: 'Custom Company' },
];

const ROLES = [
  'Software Engineer Intern',
  'Backend Engineer',
  'Frontend Engineer',
  'Full Stack Engineer',
  'Machine Learning Engineer',
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', className: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  { id: 'medium', label: 'Medium', className: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  { id: 'hard', label: 'Hard', className: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
];

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
];

const DURATIONS = [30, 45, 60];

const selectedClass = 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-md shadow-purple-600/20';
const unselectedClass = 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200';

export const StartInterviewModal: React.FC<StartInterviewModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [company, setCompany] = useState<string>('Google');
  const [role, setRole] = useState<string>(ROLES[0]);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [language, setLanguage] = useState<string>('javascript');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onStart({
        company,
        role,
        difficulty: difficulty as StartInterviewConfig['difficulty'],
        language: language as StartInterviewConfig['language'],
        durationMinutes,
      });
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create interview session.';
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Your Interview" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Company */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            1. Target Company:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOP_COMPANIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCompany(c.name)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  company === c.name ? selectedClass : unselectedClass
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Role */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            2. Target Role:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-2.5 text-left rounded-xl text-xs font-semibold border transition-all ${
                  role === r ? selectedClass : unselectedClass
                }`}
              >
                <span className="truncate block">{r}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Difficulty */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            3. Difficulty:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                  difficulty === d.id ? `${d.className} border-current` : unselectedClass
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Language */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            4. Programming Language:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLanguage(l.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  language === l.id ? selectedClass : unselectedClass
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Duration */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            5. Interview Duration:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDurationMinutes(d)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  durationMinutes === d ? selectedClass : unselectedClass
                }`}
              >
                {d} minutes
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {company} · {role} · {difficulty} · {language} · {durationMinutes} min
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              Launch Interview
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
