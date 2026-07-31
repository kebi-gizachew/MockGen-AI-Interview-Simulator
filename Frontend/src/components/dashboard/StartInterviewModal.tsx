import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Sparkles, Play, Building2, Cpu } from 'lucide-react';

export interface StartInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (title: string) => Promise<void>;
}

const TOP_COMPANIES = [
  { id: 'google', name: 'Google' },
  { id: 'meta', name: 'Meta' },
  { id: 'amazon', name: 'Amazon (AWS)' },
  { id: 'apple', name: 'Apple' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'stripe', name: 'Stripe' },
  { id: 'openai', name: 'OpenAI' },
];

const NICHES = [
  { id: 'frontend', label: 'Frontend & Web Architecture' },
  { id: 'backend', label: 'Backend & Distributed Systems' },
  { id: 'fullstack', label: 'Fullstack Engineering' },
  { id: 'system_design', label: 'System Design & Infrastructure' },
  { id: 'devops', label: 'DevOps & SRE Engineering' },
  { id: 'ml_ai', label: 'Machine Learning & AI Systems' },
  { id: 'mobile', label: 'Mobile Engineering (iOS/Android)' },
];

export const StartInterviewModal: React.FC<StartInterviewModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [company, setCompany] = useState<string>('Google');
  const [niche, setNiche] = useState<string>('Frontend & Web Architecture');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const computedTitle = customTitle.trim()
    ? customTitle.trim()
    : `${company} - ${niche} Technical Screen`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onStart(computedTitle);
      setCustomTitle('');
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create interview session.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Target Company & Niche" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Target Company Selection */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            1. Select Target Company:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOP_COMPANIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCompany(c.name)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  company === c.name
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-md shadow-purple-600/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Technical Niche / Specialization Selection */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            2. Select Technical Role Niche:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {NICHES.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNiche(n.label)}
                className={`p-2.5 text-left rounded-xl text-xs font-semibold border transition-all ${
                  niche === n.label
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{n.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Custom Title Override */}
        <Input
          label="Optional Custom Title Override"
          placeholder={`Default: "${computedTitle}"`}
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          error={error}
          helperText={`Final Session Title: "${computedTitle}"`}
        />

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
            Launch {company} Interview
          </Button>
        </div>
      </form>
    </Modal>
  );
};
