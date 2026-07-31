import React from 'react';
import { Message } from '../../types';
import { Bot, User as UserIcon, MessageSquare } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export interface TranscriptViewerProps {
  messages: Message[];
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ messages }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
          Complete Session Transcript ({messages.length} Exchanges)
        </h3>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id || index}
              className={`p-4 rounded-xl border text-sm ${
                isAssistant
                  ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                  : 'bg-purple-950/20 border-purple-900/40 text-purple-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2 font-bold text-xs">
                  {isAssistant ? (
                    <>
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300">AI Interviewer</span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-300">Candidate</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(msg.createdAt)}</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
