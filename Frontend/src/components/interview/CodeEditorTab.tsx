import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { CodeSubmission } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Code2, Send, History, Trash2 } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export interface CodeEditorTabProps {
  submissions: CodeSubmission[];
  onSubmitCode: (params: { language: string; code: string; notes?: string }) => Promise<void>;
  onDeleteSubmission?: (submissionId: string) => Promise<void>;
  readOnly?: boolean;
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  javascript: `// Write your solution here
function rateLimiter(req) {
  const now = Date.now();
  return true;
}
`,
  typescript: `// Write your solution in TypeScript
interface RequestPayload {
  ip: string;
  timestamp: number;
}

function processRequest(req: RequestPayload): boolean {
  return true;
}
`,
  python: `# Write your solution in Python
def rate_limiter(request_ip: str) -> bool:
    import time
    now = time.time()
    return True
`,
};

export const CodeEditorTab: React.FC<CodeEditorTabProps> = ({
  submissions,
  onSubmitCode,
  onDeleteSubmission,
  readOnly = false,
}) => {
  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState<string>(DEFAULT_STARTER_CODE.javascript);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<CodeSubmission | null>(null);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!code || Object.values(DEFAULT_STARTER_CODE).includes(code)) {
      setCode(DEFAULT_STARTER_CODE[newLang] || '// Write code here\n');
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || isSubmitting || readOnly) return;
    setIsSubmitting(true);
    try {
      await onSubmitCode({ language, code, notes: notes.trim() || undefined });
      setNotes('');
    } catch (err) {
      console.error('Failed to submit code snippet:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[500px] border border-slate-800 rounded-2xl overflow-hidden glass-panel">
      {/* Code Editor Container */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Editor Controls Header */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {selectedSubmission ? `Viewing Submission (${selectedSubmission.language})` : 'Live Editor'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400">Language:</label>
            <select
              value={selectedSubmission ? selectedSubmission.language : language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={Boolean(selectedSubmission) || readOnly}
              className="bg-slate-950 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
            {selectedSubmission && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSubmission(null)}
                className="text-xs"
              >
                Back to Live Editor
              </Button>
            )}
          </div>
        </div>

        {/* Monaco Editor Component */}
        <div className="flex-1 min-h-[350px]">
          <Editor
            height="100%"
            language={selectedSubmission ? selectedSubmission.language : language}
            value={selectedSubmission ? selectedSubmission.code : code}
            onChange={(val) => !selectedSubmission && setCode(val || '')}
            theme="vs-dark"
            options={{
              readOnly: Boolean(selectedSubmission) || readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Notes & Submit Footer */}
        {!selectedSubmission && !readOnly && (
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 space-y-3">
            <Input
              placeholder="Optional notes or complexity explanation (e.g. Time: O(N), Space: O(1))..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!code.trim()}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Save Code Snippet to Interview
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Code Submissions History Sidebar */}
      <div className="w-full lg:w-80 bg-slate-950/60 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
          <History className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Submissions ({submissions.length})
          </h4>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[450px]">
          {submissions.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2 text-center">
              No code snippets submitted yet.
            </p>
          ) : (
            submissions.map((sub) => {
              const isSelected = selectedSubmission?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="purple" size="sm">
                      {sub.language}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {formatTimeAgo(sub.createdAt)}
                      </span>
                      {onDeleteSubmission && !readOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this code submission?')) {
                              onDeleteSubmission(sub.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {sub.notes && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-1">
                      "{sub.notes}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
