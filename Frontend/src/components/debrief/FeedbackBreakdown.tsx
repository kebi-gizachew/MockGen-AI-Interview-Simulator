import React from 'react';
import { Card } from '../common/Card';
import { Feedback } from '../../types';
import { Award, CheckCircle, AlertTriangle, Lightbulb, Target, Code2, MessageSquare, Gauge, Cpu, Briefcase } from 'lucide-react';

export interface FeedbackBreakdownProps {
  feedback?: Feedback | null;
  summaryContent?: string;
  score?: number;
  recommendation?: string;
  recommendationColor?: string;
}

const ScoreBar: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({
  label,
  value,
  icon,
  color,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-sm font-black text-slate-100">{clamped}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export const FeedbackBreakdown: React.FC<FeedbackBreakdownProps> = ({
  feedback,
  summaryContent,
  score = 0,
  recommendation,
  recommendationColor = 'bg-slate-500/10 text-slate-300 border-slate-500/30',
}) => {
  const summary = feedback?.summary || summaryContent || 'No evaluation summary available for this interview yet.';
  const strengths = feedback?.strengths?.length ? feedback.strengths : [];
  const weaknesses = feedback?.weaknesses?.length ? feedback.weaknesses : [];
  const recommendations = feedback?.recommendations?.length ? feedback.recommendations : [];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card glow={score >= 80 ? 'purple' : 'none'}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Award className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            AI Interviewer Evaluation Report
          </h3>
        </div>
        {recommendation && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <Briefcase className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Hiring Committee Verdict:
            </span>
            <span
              className={`ml-auto px-3 py-1 rounded-full text-xs font-extrabold border ${recommendationColor}`}
            >
              {recommendation}
            </span>
          </div>
        )}
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{summary}</p>
      </Card>

      {/* Breakdown Scores */}
      {feedback && (
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Performance Breakdown
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ScoreBar label="Problem Solving" value={feedback.problemSolving ?? 0} color="bg-purple-500" icon={<Gauge className="w-3.5 h-3.5 text-purple-400" />} />
            <ScoreBar label="Code Quality" value={feedback.codeQuality ?? 0} color="bg-indigo-500" icon={<Code2 className="w-3.5 h-3.5 text-indigo-400" />} />
            <ScoreBar label="Communication" value={feedback.communication ?? 0} color="bg-emerald-500" icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-400" />} />
            <ScoreBar label="Optimization" value={feedback.optimization ?? 0} color="bg-amber-500" icon={<Cpu className="w-3.5 h-3.5 text-amber-400" />} />
          </div>
        </Card>
      )}

      {/* Grid: Strengths vs Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/20 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>Key Candidate Strengths</span>
          </div>
          {strengths.length > 0 ? (
            <ul className="text-xs text-slate-200 space-y-2.5 list-disc list-inside leading-relaxed">
              {strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No strengths recorded — complete an interview to receive a full evaluation.
            </p>
          )}
        </Card>

        <Card className="border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-rose-500/20 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Identified Weaknesses & Missing Considerations</span>
          </div>
          {weaknesses.length > 0 ? (
            <ul className="text-xs text-slate-200 space-y-2.5 list-disc list-inside leading-relaxed">
              {weaknesses.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No weaknesses recorded — complete an interview to receive a full evaluation.
            </p>
          )}
        </Card>
      </div>

      {/* Actionable Suggested Improvements */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-500/20 text-amber-400 font-bold text-sm">
          <Lightbulb className="w-5 h-5" />
          <span>Actionable Suggested Improvements for Next Interview</span>
        </div>
        {recommendations.length > 0 ? (
          <div className="space-y-2.5">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="font-bold text-amber-300 mr-2">{index + 1}.</span>
                <span className="text-slate-300">{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            No recommendations recorded — complete an interview to receive a full evaluation.
          </p>
        )}
      </Card>
    </div>
  );
};
