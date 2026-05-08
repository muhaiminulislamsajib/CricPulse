import React from 'react';
import { Trophy, TrendingUp, Users, PlusCircle, Activity, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onStartScoring: () => void;
  onExploreTournaments: () => void;
}

export function Home({ onStartScoring, onExploreTournaments }: HomeProps) {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 p-8 md:p-16 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <Activity className="w-4 h-4" />
            Khelbo Warriors Official
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-black text-white leading-[1] mb-6 uppercase tracking-tighter">
            CricPulse by <br />
            <span className="text-red-500">Khelbo Warriors.</span>
          </h1>
          <p className="text-zinc-400 text-lg mb-10 max-w-md font-medium leading-relaxed">
            The power of CricPulse matches the spirit of the Warriors. Track, score, and dominate the league.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={onStartScoring}
              className="bg-red-600 hover:bg-red-500 text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 text-sm uppercase tracking-widest"
              id="start-match-hero"
            >
              Start Live Scoring
            </button>
            <button 
              onClick={onExploreTournaments}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold px-10 py-5 rounded-2xl transition-all text-sm uppercase tracking-widest border border-zinc-700"
              id="explore-tournaments-hero"
            >
              Tournaments
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 translate-x-1/4">
          <Trophy className="w-[600px] h-[600px] text-white" />
        </div>
      </section>

      {/* Quick Stats / Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<TrendingUp className="w-6 h-6 text-red-500" />}
          title="Live Points Tables"
          description="Automatic updates for NRR, points, and standings after every single match completion."
        />
        <FeatureCard 
          icon={<Users className="w-6 h-6 text-red-500" />}
          title="Squad Builder"
          description="Build professional squads, track player stats, and manage team profiles with precision."
        />
        <FeatureCard 
          icon={<Star className="w-6 h-6 text-red-500" />}
          title="Custom Formats"
          description="From street cricket to professional leagues—any overs, any wickets, any time."
        />
      </div>

      {/* Call to Actions */}
      <div className="bg-zinc-900 rounded-[2rem] p-10 border border-zinc-800 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Host your tournament</h2>
            <p className="text-zinc-500 font-medium tracking-wide">Invite teams and launch your first championship today.</p>
          </div>
          <button 
            className="flex items-center gap-2 bg-white text-zinc-950 font-black py-4 px-10 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl uppercase text-sm tracking-widest"
            id="create-tournament-cta"
          >
            <PlusCircle className="w-5 h-5" />
            Host League
          </button>
        </div>
        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 hover:border-red-500/50 transition-all group">
      <div className="bg-zinc-950 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-zinc-800">
        {icon}
      </div>
      <h3 className="text-xl font-black mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-zinc-500 leading-relaxed font-medium">{description}</p>
    </div>
  );
}
