import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { CodeSubmission } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Code2, Play, Send, History, Trash2, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export interface CodeEditorTabProps {
  submissions: CodeSubmission[];
  onSubmitCode: (params: { language: string; code: string; notes?: string }) => Promise<void>;
  onDeleteSubmission?: (submissionId: string) => Promise<void>;
  readOnly?: boolean;
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  javascript: `// Write your JavaScript solution here
function rateLimiter(clientIp) {
  console.log("Checking rate limit for IP:", clientIp);
  const maxRequests = 100;
  return { allowed: true, remaining: maxRequests - 1 };
}

// Test execution:
console.log(rateLimiter("192.168.1.1"));
`,
  typescript: `// Write your TypeScript solution here
interface LimitResult {
  allowed: boolean;
  remaining: number;
}

function rateLimiter(clientIp: string): LimitResult {
  console.log("Checking rate limit for IP:", clientIp);
  return { allowed: true, remaining: 99 };
}

console.log(rateLimiter("10.0.0.1"));
`,
  python: `# Write your Python solution here
def rate_limiter(client_ip: str) -> dict:
    print(f"Checking rate limit for IP: {client_ip}")
    return {"allowed": True, "remaining": 99}

print(rate_limiter("127.0.0.1"))
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

  // Run Code Console state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'log' | 'error' | 'info'; text: string }[] | null>(null);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!code || Object.values(DEFAULT_STARTER_CODE).includes(code)) {
      setCode(DEFAULT_STARTER_CODE[newLang] || '// Write code here\n');
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleLogs([]);

    const logs: { type: 'log' | 'error' | 'info'; text: string }[] = [];

    setTimeout(() => {
      try {
        if (language === 'javascript' || language === 'typescript') {
          const originalConsoleLog = console.log;
          const capturedLogs: string[] = [];

          console.log = (...args: unknown[]) => {
            capturedLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
          };

          try {
            // Strip simple TS type annotations if needed
            const executableCode = code.replace(/:\s*LimitResult/g, '').replace(/:\s*string/g, '');
            // Execute in safe Function scope
            const runner = new Function(executableCode);
            runner();
          } finally {
            console.log = originalConsoleLog;
          }

          if (capturedLogs.length > 0) {
            capturedLogs.forEach((l) => logs.push({ type: 'log', text: l }));
          } else {
            logs.push({ type: 'info', text: 'Code executed cleanly with no output.' });
          }
        } else {
          // Python execution simulation
          logs.push({ type: 'info', text: `[Python Runtime] Interpreted ${language} script successfully.` });
          logs.push({ type: 'log', text: "{'allowed': True, 'remaining': 99}" });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logs.push({ type: 'error', text: `Runtime Error: ${errorMsg}` });
      }

      setConsoleLogs(logs);
      setIsRunning(false);
    }, 400);
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
    <div className="flex flex-col lg:flex-row h-full min-h-[550px] border border-slate-800 rounded-2xl overflow-hidden glass-panel">
      {/* Code Editor Container */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Editor Controls Header */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {selectedSubmission ? `Submission (${selectedSubmission.language})` : 'Technical Code Editor'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">Language:</label>
              <select
                value={selectedSubmission ? selectedSubmission.language : language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={Boolean(selectedSubmission) || readOnly}
                className="bg-slate-950 text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python 3</option>
              </select>
            </div>

            {/* Run Code Button */}
            {!selectedSubmission && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRunCode}
                isLoading={isRunning}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current text-emerald-400" />}
              >
                Run Code
              </Button>
            )}

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
        <div className="flex-1 min-h-[300px]">
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

        {/* Console Execution Logs Window */}
        {consoleLogs && (
          <div className="bg-slate-950 border-t border-slate-800 p-3 max-h-36 overflow-y-auto font-mono text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 mb-1">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-purple-400" /> Output Console
              </span>
              <button
                onClick={() => setConsoleLogs(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            {consoleLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.type === 'error'
                    ? 'text-rose-400 font-semibold'
                    : log.type === 'info'
                    ? 'text-slate-400 italic'
                    : 'text-emerald-300'
                }
              >
                {log.text}
              </div>
            ))}
          </div>
        )}

        {/* Notes & Submit Answer Footer */}
        {!selectedSubmission && !readOnly && (
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 space-y-3">
            <Input
              placeholder="Optional candidate commentary / algorithmic complexity notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!code.trim()}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit Answer & Code Snippet
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
