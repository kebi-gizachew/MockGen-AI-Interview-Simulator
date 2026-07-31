import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 text-center">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
          <Bot className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-slate-100 mb-2">404</h1>
          <h2 className="text-lg font-bold text-slate-200">Page Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">
            The interview session or requested path does not exist.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
