import React from 'react';
import { Card } from '../common/Card';
import { Award, CheckCircle, AlertTriangle, Lightbulb, Target } from 'lucide-react';

export interface FeedbackBreakdownProps {
  summaryContent?: string;
  score?: number;
}

export const FeedbackBreakdown: React.FC<FeedbackBreakdownProps> = ({
  summaryContent,
  score = 85,
}) => {
  return (
    <div className="space-y-6">
      {/* AI Feedback & Executive Assessment Card */}
      <Card glow={score >= 80 ? 'purple' : 'none'}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Award className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            AI Interviewer Feedback & Evaluation Report
          </h3>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {summaryContent ||
            'Interview complete. Detailed candidate evaluation across system architecture, live code implementation, and algorithmic reasoning.'}
        </p>
      </Card>

      {/* Grid: Strengths vs Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/20 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>Key Candidate Strengths</span>
          </div>
          <ul className="text-xs text-slate-200 space-y-2.5 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-emerald-300">System Architecture:</strong> Articulated clean boundary separation, caching strategies, and data store selection.
            </li>
            <li>
              <strong className="text-emerald-300">Code Clarity:</strong> Authored clean, readable TypeScript/JavaScript snippets with clear function interfaces.
            </li>
            <li>
              <strong className="text-emerald-300">Communication & Rigor:</strong> Proactively explained step-by-step reasoning during technical questions.
            </li>
          </ul>
        </Card>

        {/* Weaknesses */}
        <Card className="border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-rose-500/20 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Identified Weaknesses & Missing Considerations</span>
          </div>
          <ul className="text-xs text-slate-200 space-y-2.5 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-rose-300">Edge Case Handling:</strong> Omitted concurrency bottlenecks and distributed node failover mechanisms initially.
            </li>
            <li>
              <strong className="text-rose-300">Complexity Analysis:</strong> Did not explicitly state formal Time O(N) and Space O(1) bounds prior to code submission.
            </li>
            <li>
              <strong className="text-rose-300">Burst Traffic Scenarios:</strong> Required prompting to discuss rate limiter token bucket fallback under high load.
            </li>
          </ul>
        </Card>
      </div>

      {/* Actionable Suggested Improvements */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-500/20 text-amber-400 font-bold text-sm">
          <Lightbulb className="w-5 h-5" />
          <span>Actionable Suggested Improvements for Next Interview</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block">1. State Constraints First</span>
            <p className="text-slate-400">
              Before writing code or answering, clarify input bounds, memory limits, and scale assumptions.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block">2. Proactive Failover Discussion</span>
            <p className="text-slate-400">
              In system design, proactively discuss Redis cluster failover, network partitions, and fallback stores.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block">3. Dry Run Code Execution</span>
            <p className="text-slate-400">
              Utilize the built-in Code Runner console to test sample inputs before finalizing candidate submissions.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
