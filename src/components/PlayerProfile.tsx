import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Trophy, Star, TrendingUp, Target, Calendar, ChevronLeft, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerProfileProps {
  playerId: string;
  onBack: () => void;
}

export function PlayerProfile({ playerId, onBack }: PlayerProfileProps) {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!playerId) return;

    const unsubscribe = onSnapshot(doc(db, 'players', playerId), (docSnap) => {
      if (docSnap.exists()) {
        setPlayer({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black uppercase">Player Not Found</h2>
        <button onClick={onBack} className="mt-4 text-red-500 font-bold uppercase tracking-widest text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-[0.2em]"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-zinc-900 rounded-[3rem] p-10 border border-zinc-800">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center border-2 border-red-500 shadow-2xl shadow-red-500/20">
            <UserIcon className="w-16 h-16 md:w-24 md:h-24 text-zinc-700" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest mb-4">
              <Star className="w-4 h-4" />
              {player.role || 'Player'}
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-2">{player.name}</h1>
            <p className="text-zinc-500 text-xl font-bold uppercase tracking-widest">
              Representing <span className="text-zinc-200">{player.teamName}</span>
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard icon={<Trophy className="text-yellow-500" />} label="Matches" value={player.careerStats?.matches || 0} />
        <StatCard icon={<TrendingUp className="text-red-500" />} label="Total Runs" value={player.careerStats?.runs || 0} />
        <StatCard icon={<Star className="text-emerald-500" />} label="Wickets" value={player.careerStats?.wickets || 0} />
        <StatCard icon={<Target className="text-blue-500" />} label="Highest" value={player.careerStats?.highestScore || 0} />
      </div>

      {/* Career Breakdown */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800">
        <h3 className="text-xl font-black uppercase tracking-tight mb-8">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <StatProgress label="Strike Rate" value={player.careerStats?.strikeRate || 0} max={200} color="bg-red-500" />
          <StatProgress label="Economy" value={player.careerStats?.economy || 0} max={12} reverse color="bg-emerald-500" />
          <StatProgress label="Avg Runs/Match" value={(player.careerStats?.runs / (player.careerStats?.matches || 1)) || 0} max={100} color="bg-blue-500" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: number | string }) {
  return (
    <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 text-center hover:border-red-500/50 transition-all group">
      <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function StatProgress({ label, value, max, color, reverse = false }: { label: string, value: number, max: number, color: string, reverse?: boolean }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-end mb-3">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className="text-xl font-black text-white">{value.toFixed(1)}</span>
      </div>
      <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color} shadow-lg`}
        />
      </div>
    </div>
  );
}
