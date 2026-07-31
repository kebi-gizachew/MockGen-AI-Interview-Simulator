import React from 'react';
import { Card } from '../common/Card';
import { Award, CheckCircle, Target } from 'lucide-react';

export interface FeedbackBreakdownProps {
  summaryContent?: string;
  score?: number;
}

export const FeedbackBreakdown: React.FC<FeedbackBreakdownProps> = ({
  summaryContent,
  score,
}) => {
  return (
    <div className="space-y-6">
      <Card glow={score && score >= 80 ? 'purple' : 'none'}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Award className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            AI Interviewer Executive Summary
          </h3>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {summaryContent ||
            'Interview complete. Detailed feedback and exchange analysis generated below.'}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Key Strengths & High Points</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li>Demonstrated clear architectural reasoning and system boundaries.</li>
            <li>Effective communication during candidate answers.</li>
            <li>Structured approach to problem solving under mock interview conditions.</li>
          </ul>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm">
            <Target className="w-4 h-4" />
            <span>Areas for Recommendation & Growth</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li>Proactively discuss edge cases, distributed failure modes, and trade-offs.</li>
            <li>Elaborate on time and space complexity metrics for code solutions.</li>
            <li>State implicit assumptions early during technical questions.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
