import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Button } from './Button';
import { Bot, LogOut, LayoutDashboard, User as UserIcon, Wifi, WifiOff } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 group-hover:bg-purple-600/30 group-hover:border-purple-400 transition-all">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
              MockGen AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              Simulator
            </span>
          </div>
        </Link>

        {/* Right Action Items */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            {/* Socket connection indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800"
              title={isConnected ? 'Socket.IO Connected' : 'Socket Disconnected'}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Live Socket</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">REST Fallback</span>
                </>
              )}
            </div>

            {/* Navigation links */}
            {location.pathname !== '/dashboard' && (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                  Dashboard
                </Button>
              </Link>
            )}

            {/* User Profile display */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-semibold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <span className="font-medium text-slate-200 hidden sm:inline">{user.name || user.email}</span>
            </div>

            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
