import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { StatsSection } from '../components/landing/StatsSection';
import { Bot, Code2, BarChart3, ArrowRight, Sparkles, ShieldCheck, Zap, Target } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Nav */}
      <header className="w-full border-b border-slate-800/80 backdrop-blur bg-slate-950/70 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              MockGen <span className="text-purple-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex"
            >
              Login
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/register')}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-20 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[420px] bg-purple-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            FAANG-level interview simulation, powered by AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
            Master Technical Interviews with an{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              AI Interviewer
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Practice realistic software engineering interviews with AI-generated coding problems,
            real-time feedback, and personalized performance analysis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto shadow-xl shadow-purple-600/40"
              isLoading={loading}
            >
              Start Interview
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto"
            >
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Live platform statistics (fetched from GET /api/stats) */}
      <StatsSection />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-3xl p-8 border border-slate-800 hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">AI Interviewer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The AI behaves like a real technical interviewer — it evaluates communication,
              problem-solving, and coding ability across every exchange.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-slate-800 hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Coding Environment</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Solve programming problems inside a VS Code-like editor with real test-case
              execution, output consoles, and multiple language support.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-slate-800 hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Personalized Feedback</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Receive detailed feedback about correctness, time & space complexity, code quality,
              and concrete areas for improvement after every interview.
            </p>
          </div>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mt-14 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure JWT authentication
          </span>
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> Company & role specific screens
          </span>
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Track improvement over time
          </span>
        </div>
      </section>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-600">
        MockGen AI — Practice. Perform. Get Hired.
      </footer>
    </div>
  );
};

export default LandingPage;
