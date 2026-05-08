import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Trophy, Users, BarChart3, Star, Target, Share2, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface TournamentDetailProps {
  tournamentId: string;
  onBack: () => void;
  onMatchClick: (matchId: string) => void;
}

export function TournamentDetail({ tournamentId, onBack, onMatchClick }: TournamentDetailProps) {
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!tournamentId) return;

    const unsubTournament = onSnapshot(doc(db, 'tournaments', tournamentId), (d) => {
      if (d.exists()) setTournament({ id: d.id, ...d.data() });
      setLoading(false);
    });

    const q = query(collection(db, 'matches'), where('tournamentId', '==', tournamentId));
    const unsubMatches = onSnapshot(q, (s) => {
      setMatches(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTournament();
      unsubMatches();
    };
  }, [tournamentId]);

  const shareTournament = () => {
    const url = `${window.location.origin}/?tournament=${tournamentId}`;
    if (navigator.share) {
      navigator.share({ title: `CricPulse: ${tournament.name}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Tournament link copied!');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-red-500 animate-spin" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">
          <ChevronLeft className="w-4 h-4" />
          Back to list
        </button>
        <button onClick={shareTournament} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
          <Share2 className="w-4 h-4" />
          Share League
        </button>
      </div>

      <div className="bg-zinc-900 rounded-[3rem] p-10 border border-zinc-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="bg-red-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm mb-4 inline-block">Official Tournament</div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">{tournament.name}</h1>
          </div>
          <div className="flex gap-10 text-center">
            <StatSmall label="Teams" value={tournament.teamIds?.length || 0} />
            <StatSmall label="Matches" value={matches.length} />
            <StatSmall label="Avg Score" value="164" />
          </div>
        </div>
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-600/5 rounded-full blur-[80px] -mr-40 -mt-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics Pillar */}
        <div className="lg:col-span-1 space-y-8">
          <SectionHeader icon={<Trophy className="text-yellow-500" />} title="Tournament Leaders" />
          <div className="bg-zinc-900 rounded-[2rem] p-6 border border-zinc-800 space-y-6">
            <LeaderItem label="Orange Cap (Runs)" name="Sajib" stats="452 Runs" isTop />
            <LeaderItem label="Purple Cap (Wickets)" name="Karim" stats="18 Wickets" />
            <LeaderItem label="Highest Score" name="Nabil" stats="112 (48)" />
            <LeaderItem label="MVP" name="Warriors Capt." stats="Rank #1" />
          </div>
        </div>

        {/* Live Standings Pillar */}
        <div className="lg:col-span-2 space-y-8">
          <SectionHeader icon={<TrendingUp className="text-red-500" />} title="Points Table" />
          <div className="bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/50 text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-800">
                  <th className="px-6 py-4">SQUAD</th>
                  <th className="px-4 py-4 text-center">P</th>
                  <th className="px-4 py-4 text-center">W</th>
                  <th className="px-4 py-4 text-center">L</th>
                  <th className="px-4 py-4 text-center">NRR</th>
                  <th className="px-6 py-4 text-center">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tournament.pointsTable?.map((row: any, i: number) => (
                  <tr key={row.teamId} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4 font-black uppercase text-sm group-hover:text-red-500 transition-colors">{row.teamName || 'WARRIORS '+ (i+1)}</td>
                    <td className="px-4 py-4 text-center font-mono text-zinc-400">{row.played}</td>
                    <td className="px-4 py-4 text-center font-mono text-emerald-500">{row.won}</td>
                    <td className="px-4 py-4 text-center font-mono text-red-500">{row.lost}</td>
                    <td className="px-4 py-4 text-center font-mono text-zinc-500 text-xs">+{row.nrr.toFixed(3)}</td>
                    <td className="px-6 py-4 text-center"><span className="bg-zinc-950 px-3 py-1 rounded-lg font-black text-white border border-zinc-800">{row.points}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shadow-lg">
        {icon}
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
    </div>
  );
}

function StatSmall({ label, value }: { label: string, value: string | number }) {
  return (
    <div>
      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function LeaderItem({ label, name, stats, isTop = false }: { label: string, name: string, stats: string, isTop?: boolean }) {
  return (
    <div className="group cursor-pointer">
      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</div>
      <div className="flex justify-between items-center">
        <div className={`font-black uppercase tracking-tight transition-colors ${isTop ? 'text-red-500 text-lg' : 'text-white'}`}>
          {name}
        </div>
        <div className="text-[10px] font-black text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">{stats}</div>
      </div>
    </div>
  );
}

function TrendingUp(props: any) {
  return <BarChart3 {...props} />;
}
