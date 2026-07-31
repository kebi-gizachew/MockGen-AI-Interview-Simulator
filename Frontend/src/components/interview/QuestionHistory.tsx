import React from 'react';
import { Message } from '../../types';
import { HelpCircle, Sparkles } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export interface QuestionHistoryProps {
  messages: Message[];
}

export const QuestionHistory: React.FC<QuestionHistoryProps> = ({ messages }) => {
  // Filter questions asked by assistant
  const questions = messages.filter(
    (m) => m.role === 'assistant' && (m.metadata?.type === 'question' || m.content.includes('?'))
  );

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <HelpCircle className="w-4 h-4 text-purple-400" />
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Asked Questions ({questions.length})
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {questions.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-3 text-center">
            No formal interview questions asked yet.
          </p>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center justify-between text-purple-300 font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Question #{idx + 1}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {formatTimeAgo(q.createdAt)}
                </span>
              </div>
              <p className="text-slate-200 line-clamp-3 leading-relaxed">{q.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
