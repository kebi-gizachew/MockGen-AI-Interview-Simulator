import React, { useState, KeyboardEvent } from 'react';
import { Button } from '../common/Button';
import { Send } from 'lucide-react';

export interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  isSending?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isSending = false,
}) => {
  const [text, setText] = useState('');

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isSending) return;

    setText('');
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 sm:p-4 glass-panel border-t border-slate-800">
      <div className="flex gap-2 items-end">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          placeholder={
            disabled
              ? 'Interview session completed.'
              : 'Type your candidate response (Press Enter to send, Shift+Enter for newline)...'
          }
          className="flex-1 bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl p-3 text-sm border border-slate-800 focus:border-purple-500/80 focus:outline-none resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          isLoading={isSending}
          disabled={disabled || !text.trim()}
          rightIcon={<Send className="w-4 h-4" />}
          className="h-[52px]"
        >
          Send
        </Button>
      </div>
    </div>
  );
};
