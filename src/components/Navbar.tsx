import React, { useState } from 'react';
import { Trophy, Users, Play, Home, LogIn, LogOut, CircleUser, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../App';
import { logout } from '../firebase';
import { motion } from 'motion/react';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onAuthClick: () => void;
}

export function Navbar({ currentView, onViewChange, onAuthClick }: NavbarProps) {
  const { user } = useAuth();

  return (
    <nav className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onViewChange('home')}
          id="logo-button"
        >
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-red-600/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-xl font-black tracking-tighter uppercase leading-none">Cric<span className="text-red-500">Pulse</span></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Khelbo Warriors</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <NavItem 
            label="Dashboard" 
            active={currentView === 'home'} 
            onClick={() => onViewChange('home')}
            id="nav-home"
          />
          <NavItem 
            label="Tournaments" 
            active={currentView === 'tournaments'} 
            onClick={() => onViewChange('tournaments')}
            id="nav-tournaments"
          />
          <NavItem 
            label="Live Scorer" 
            active={currentView === 'scoring'} 
            onClick={() => onViewChange('scoring')}
            id="nav-scorer"
          />
          <NavItem 
            label="Teams" 
            active={currentView === 'teams'} 
            onClick={() => onViewChange('teams')}
            id="nav-teams"
          />
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">User Account</p>
                <p className="text-sm font-semibold">{user.displayName || user.email?.split('@')[0]}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-red-500 font-bold">{user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Logout"
                  id="logout-button"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-all active:scale-95 text-sm uppercase tracking-widest flex items-center gap-2"
              id="login-button"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavItem({ label, active, onClick, id }: { label: string, active: boolean, onClick: () => void, id: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`transition-colors cursor-pointer ${
        active 
          ? 'text-red-500 font-bold' 
          : 'hover:text-zinc-200'
      }`}
    >
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-underline"
          className="h-0.5 w-full bg-red-500 mt-0.5"
        />
      )}
    </button>
  );
}
