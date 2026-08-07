import React, { useEffect, useRef } from 'react';
import { Message } from '../../types';
import { getScoreBadgeColor, formatTimeAgo } from '../../utils/formatters';
import { SimpleMarkdown } from '../common/SimpleMarkdown';
import { Bot, User as UserIcon, Sparkles, Award } from 'lucide-react';

export interface ChatMessageListProps {
  messages: Message[];
  isThinking?: boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, isThinking = false }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Compute average score from AI feedback messages
  const feedbackScores = messages
    .filter((m) => m.metadata?.score !== undefined && m.metadata?.score !== null)
    .map((m) => m.metadata!.score!);

  const latestScore = feedbackScores.length > 0 ? feedbackScores[feedbackScores.length - 1] : null;

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {/* AI Interviewer Top Panel */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between mb-4 bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              AI Technical Interviewer
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Evaluating System Architecture, Problem Solving, & Code Quality
            </p>
          </div>
        </div>

        {latestScore !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Award className="w-4 h-4 text-purple-400" />
            <div className="text-right">
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Latest Score</span>
              <span className={`text-xs font-bold ${getScoreBadgeColor(latestScore).split(' ')[1]}`}>
                {latestScore} / 100
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
          <Bot className="w-12 h-12 mb-3 text-purple-400/50 animate-pulse" />
          <p className="text-sm font-medium">Initializing AI interviewer...</p>
        </div>
      ) : (
        messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isSystem = msg.role === 'system';
          const score = msg.metadata?.score;

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div className="px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-400">
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 max-w-3xl ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold border shadow-md ${
                  isAssistant
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                    : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                }`}
              >
                {isAssistant ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} min-w-0`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-300">
                    {isAssistant ? 'AI Technical Interviewer' : 'Candidate'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatTimeAgo(msg.createdAt)}
                  </span>
                  {score !== undefined && score !== null && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getScoreBadgeColor(
                        score
                      )}`}
                    >
                      Score: {score}/100
                    </span>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isAssistant
                      ? 'glass-panel text-slate-100 rounded-tl-none border-slate-800'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-purple-600/15 whitespace-pre-wrap'
                  }`}
                >
                  {isAssistant ? <SimpleMarkdown text={msg.content} /> : msg.content}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* AI Typing Indicator */}
      {isThinking && (
        <div className="flex gap-3 max-w-3xl mr-auto" aria-label="AI interviewer typing response">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
          </div>
          <div className="glass-panel p-4 rounded-2xl rounded-tl-none text-sm text-slate-400 flex items-center gap-2">
            <span className="animate-pulse">AI Interviewer is evaluating answer...</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
