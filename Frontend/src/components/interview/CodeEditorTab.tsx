import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { CodeSubmission, CodeRunResult } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Code2, Play, Send, History, Trash2, Terminal, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export interface CodeEditorTabProps {
  submissions: CodeSubmission[];
  /** Controlled editor state owned by the page so tab switches never lose code. */
  language: string;
  codeBuffers: Record<string, string>;
  onLanguageChange: (language: string) => void;
  onCodeChange: (language: string, value: string) => void;
  onResetCode?: (language: string) => void;
  onSubmitCode: (params: { language: string; code: string; notes?: string }) => Promise<void>;
  onRunCode: (language: string, code: string) => Promise<CodeRunResult>;
  onDeleteSubmission?: (submissionId: string) => Promise<void>;
  readOnly?: boolean;
}

const FALLBACK_STARTER_CODE: Record<string, string> = {
  javascript: '// Write your JavaScript solution here\nfunction solution() {\n  // implement the target function\n}\n',
  typescript: '// Write your TypeScript solution here\nfunction solution(): void {\n  // implement the target function\n}\n',
  python: '# Write your Python solution here\ndef solution():\n    # implement the target function\n    pass\n',
  java: '// Write your Java solution here\npublic class Solution {\n    public static void main(String[] args) {}\n}\n',
  cpp: '// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {}\n};\n',
};

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript (Node.js)' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python 3' },
  { id: 'java', label: 'Java 17' },
  { id: 'cpp', label: 'C++17' },
];

export const CodeEditorTab: React.FC<CodeEditorTabProps> = ({
  submissions,
  language,
  codeBuffers,
  onLanguageChange,
  onCodeChange,
  onResetCode,
  onSubmitCode,
  onRunCode,
  onDeleteSubmission,
  readOnly = false,
}) => {
  // Buffers are owned by the page (survives tab switches + refreshes).
  const code = codeBuffers[language] ?? FALLBACK_STARTER_CODE[language] ?? '';
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<CodeSubmission | null>(null);

  // Run Code state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null);

  const handleLanguageChange = (newLang: string) => {
    onLanguageChange(newLang);
    setRunResult(null);
  };

  const handleRunCode = async () => {
    if (!code.trim() || isRunning || readOnly) return;
    setIsRunning(true);
    setRunResult(null);
    try {
      const result = await onRunCode(language, code);
      setRunResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to run code.';
      setRunResult({ passed: 0, failed: 0, total: 0, results: [], error: msg });
    } finally {
      setIsRunning(false);
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

  const stringifyValue = (value: unknown) => {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'string') return `"${value}"`;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const classifyError = (error: string): string => {
    if (/compil\w* error/i.test(error)) return 'Compilation Error';
    if (/timed out|time limit/i.test(error)) return 'Time Limit Exceeded';
    if (/runtime error/i.test(error)) return 'Runtime Error';
    if (/judg\w* service|rate-limit/i.test(error)) return 'Judge Service Unavailable';
    return 'Execution Error';
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

          {!selectedSubmission && onResetCode && !readOnly && (
            <button
              onClick={() => {
                if (confirm(`Reset the ${language} editor back to the starter code?`)) {
                  onResetCode(language);
                }
              }}
              className="text-[10px] font-semibold text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
              title="Reset this language buffer to the starter code"
            >
              Reset Code
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">Language:</label>
              <select
                value={selectedSubmission ? selectedSubmission.language : language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={Boolean(selectedSubmission) || readOnly}
                className="bg-slate-950 text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-purple-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {!selectedSubmission && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRunCode}
                isLoading={isRunning}
                disabled={readOnly}
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
            onChange={(val) => !selectedSubmission && onCodeChange(language, val || '')}
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

        {/* Test Results Panel */}
        {runResult && (
          <div className="bg-slate-950 border-t border-slate-800 max-h-64 overflow-y-auto">
            <div className="p-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3 flex-wrap">
                <Terminal className="w-4 h-4 text-purple-400" />
                {runResult.error ? (
                  <span className="text-xs font-bold text-rose-400">
                    <XCircle className="w-3.5 h-3.5 inline mr-1" />
                    {classifyError(runResult.error)}
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                      {runResult.passed}/{runResult.total} passed
                    </span>
                    {runResult.failed > 0 && (
                      <span className="text-xs font-bold text-rose-400">
                        <XCircle className="w-3.5 h-3.5 inline mr-1" />
                        {runResult.failed} failed
                      </span>
                    )}
                  </>
                )}
                {(typeof runResult.runtimeMs === 'number' || runResult.memoryKb) && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {typeof runResult.runtimeMs === 'number' ? `${runResult.runtimeMs}ms` : ''}
                    {runResult.runtimeMs !== undefined && runResult.memoryKb ? ' · ' : ''}
                    {runResult.memoryKb ? `${(runResult.memoryKb / 1024).toFixed(1)}MB` : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setRunResult(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>

            {runResult.error ? (
              <div className="p-3 space-y-2">
                <p className="text-xs text-rose-400 font-mono whitespace-pre-wrap">{runResult.error}</p>
                {runResult.consoleOutput && runResult.consoleOutput.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Console Output</p>
                    {runResult.consoleOutput.map((line, i) => (
                      <p key={i} className="text-xs text-emerald-300 font-mono">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {runResult.results.map((tc, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-lg border text-xs font-mono ${
                      tc.passed
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-rose-500/5 border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${tc.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tc.passed ? '✓' : '✗'} Test Case #{index + 1}
                      </span>
                      {!tc.passed && tc.error && (
                        <span className="text-[10px] text-rose-400">Error: {tc.error}</span>
                      )}
                    </div>
                    {!tc.passed && !tc.error && (
                      <div className="space-y-0.5 text-slate-400">
                        <p>
                          Expected: <span className="text-slate-200">{stringifyValue(tc.expected)}</span>
                        </p>
                        <p>
                          Actual: <span className="text-slate-200">{stringifyValue(tc.actual)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {runResult.consoleOutput && runResult.consoleOutput.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Console Output</p>
                    {runResult.consoleOutput.map((line, i) => (
                      <p key={i} className="text-xs text-emerald-300 font-mono">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              const passed = sub.passedTests !== null && sub.passedTests !== undefined;
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
                      {passed && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            sub.passedTests === sub.totalTests
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {sub.passedTests}/{sub.totalTests}
                        </span>
                      )}
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
