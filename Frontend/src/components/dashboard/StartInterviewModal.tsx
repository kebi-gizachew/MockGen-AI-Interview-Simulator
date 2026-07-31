import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Sparkles, Play } from 'lucide-react';

export interface StartInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (title: string) => Promise<void>;
}

export const StartInterviewModal: React.FC<StartInterviewModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const PRESET_TOPICS = [
    'Frontend React & Modern Web Architecture',
    'System Design & Distributed Systems',
    'Fullstack Node.js & Database Engineering',
    'Data Structures & Algorithms Tech Screen',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onStart(title.trim() || 'Fullstack Engineering Mock Interview');
      setTitle('');
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create interview session.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure New AI Interview" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Interview Session Title"
          placeholder="e.g. Senior Frontend React Technical Screen"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          autoFocus
        />

        {/* Topic presets */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
            Or Choose A Suggested Topic Preset:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setTitle(topic)}
                className={`p-2.5 text-left rounded-xl text-xs border transition-all ${
                  title === topic
                    ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-medium">
                  <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="line-clamp-1">{topic.split('&')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

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
            Launch Interview Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};
