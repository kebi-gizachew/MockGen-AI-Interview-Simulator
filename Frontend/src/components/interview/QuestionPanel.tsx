import React from 'react';
import { Question } from '../../types';
import { FileText, Lightbulb, ListChecks, FunctionSquare } from 'lucide-react';

export interface QuestionPanelProps {
  question: Question | null;
}

const difficultyClass = (difficulty?: string) => {
  if (difficulty === 'easy') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (difficulty === 'hard') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
};

// How often this problem is reported at the target company.
const frequencyLabel = (frequency?: string | null) => {
  if (frequency === 'very_high') return '★ Very frequent';
  if (frequency === 'high') return 'Frequent';
  if (frequency === 'medium') return 'Occasional';
  if (frequency === 'low') return 'Rarely asked';
  return null;
};

const frequencyClass = (frequency?: string | null) => {
  if (frequency === 'very_high')
    return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
  if (frequency === 'high')
    return 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30';
  if (frequency === 'medium')
    return 'text-sky-300 bg-sky-500/10 border-sky-500/30';
  return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
};

export const QuestionPanel: React.FC<QuestionPanelProps> = ({ question }) => {
  if (!question) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 h-full flex flex-col items-center justify-center text-center">
        <FileText className="w-8 h-8 text-slate-600 mb-3" />
        <p className="text-xs text-slate-500">No coding problem assigned to this session.</p>
      </div>
    );
  }

  const frequency = frequencyLabel(question.interviewFrequency);

  // All companies known to ask this problem (falls back to the primary one).
  const companies =
    question.companies && question.companies.length > 0
      ? question.companies
      : question.company
        ? [question.company]
        : [];
  const primaryCompany = question.company || companies[0] || null;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-100 leading-snug">{question.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${difficultyClass(question.difficulty)}`}>
                {question.difficulty}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                {question.topic}
              </span>
              {companies.slice(0, 4).map((company) => (
                <span
                  key={company}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25"
                >
                  {company}
                </span>
              ))}
              {companies.length > 4 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-300 border border-slate-600/40">
                  +{companies.length - 4}
                </span>
              )}
              {frequency && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${frequencyClass(
                    question.interviewFrequency
                  )}`}
                  title={`How often this problem is reported at ${primaryCompany || 'the target company'}`}
                >
                  {frequency}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        <p className="text-slate-300 leading-relaxed">{question.description}</p>

        {question.examples && question.examples.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Examples
            </h4>
            {question.examples.map((example, index) => (
              <div key={index} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs space-y-1">
                <p className="text-slate-400">
                  <span className="text-purple-300 font-bold">Input:</span> {example.input}
                </p>
                <p className="text-slate-400">
                  <span className="text-emerald-300 font-bold">Output:</span> {example.output}
                </p>
                {example.explanation && (
                  <p className="text-slate-500">— {example.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {question.constraints && question.constraints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-cyan-400" /> Constraints
            </h4>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              {question.constraints.map((c, index) => (
                <li key={index}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-slate-400 flex items-start gap-2">
          <FunctionSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p>
            Implement <code className="text-purple-300 font-mono font-bold">{question.functionName}</code> with
            the exact function name, then use <span className="text-emerald-300 font-bold">Run Code</span> to test
            your solution against the hidden test cases.
          </p>
        </div>
      </div>
    </div>
  );
};
