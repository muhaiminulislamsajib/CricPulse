import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Plus, Trophy, Calendar, Settings, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TournamentDetail } from './TournamentDetail';

interface TournamentListProps {
  initialTournamentId?: string | null;
  onTournamentSelect?: (id: string | null) => void;
  onMatchSelect?: (id: string) => void;
  onScheduleMatch?: (tournamentId: string) => void;
}

export function TournamentList({ initialTournamentId, onTournamentSelect, onMatchSelect, onScheduleMatch }: TournamentListProps) {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [overs, setOvers] = useState(20);
  const [wickets, setWickets] = useState(10);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tournaments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const teamsUnsubscribe = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      teamsUnsubscribe();
    };
  }, []);

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please login first');
      return;
    }
    if (selectedTeamIds.length < 2) {
      setError('Select at least 2 teams');
      return;
    }

    try {
      const tournamentData = {
        name,
        ownerId: user.uid,
        status: 'upcoming',
        overs,
        wickets,
        teamIds: selectedTeamIds,
        createdAt: serverTimestamp(),
        pointsTable: selectedTeamIds.map(id => {
          const team = teams.find(t => t.id === id);
          return {
            teamId: id,
            teamName: team?.name || 'Unknown',
            played: 0,
            won: 0,
            lost: 0,
            points: 0,
            nrr: 0
          };
        })
      };
      await addDoc(collection(db, 'tournaments'), tournamentData);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tournaments');
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedTeamIds([]);
    setOvers(20);
    setWickets(10);
  };

  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(initialTournamentId || null);

  useEffect(() => {
    if (initialTournamentId !== undefined) {
      setActiveTournamentId(initialTournamentId);
    }
  }, [initialTournamentId]);

  const handleTournamentSelect = (id: string | null) => {
    setActiveTournamentId(id);
    onTournamentSelect?.(id);
  };

  if (activeTournamentId) {
    return (
      <TournamentDetail 
        tournamentId={activeTournamentId} 
        onBack={() => handleTournamentSelect(null)} 
        onMatchClick={(id) => onMatchSelect?.(id)}
        onScheduleMatch={() => onScheduleMatch?.(activeTournamentId)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Tournaments</h1>
          <p className="text-zinc-500 font-medium">Organize and track your cricket championships</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black py-3 px-8 rounded-2xl transition-all shadow-xl shadow-red-500/10 uppercase text-xs tracking-widest"
          id="create-tournament-btn"
        >
          <Plus className="w-5 h-5" />
          Host Tournament
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="col-span-full bg-zinc-900 p-12 rounded-[2rem] text-center border border-dashed border-zinc-800">
            <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-1 uppercase tracking-tight">No tournaments found</h3>
            <p className="text-zinc-500">Start by creating your own league or championship</p>
          </div>
        ) : (
          tournaments.map(tournament => (
            <div key={tournament.id} className="bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800 hover:border-red-500/30 transition-all flex h-52 group">
              <div className="w-3 flex-shrink-0 bg-red-500" />
              <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-red-400 transition-colors">{tournament.name}</h3>
                      <div className="flex gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {tournament.teamIds?.length || 0} Squads
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Settings className="w-3 h-3" />
                          {tournament.overs} Overs
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${
                      tournament.status === 'live' 
                        ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' 
                        : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50">
                   <div className="flex -space-x-3">
                    {tournament.teamIds?.slice(0, 4).map((id: string, i: number) => (
                       <div key={id} className="w-10 h-10 rounded-full bg-zinc-950 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-black uppercase text-red-500 ring-2 ring-zinc-800">
                        T{i+1}
                       </div>
                    ))}
                    {tournament.teamIds?.length > 4 && (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-black uppercase text-zinc-500 ring-2 ring-zinc-800">
                        +{tournament.teamIds.length - 4}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleTournamentSelect(tournament.id)}
                    className="flex items-center gap-1 text-zinc-100 font-black text-[10px] uppercase tracking-widest group-hover:gap-3 transition-all hover:text-red-500"
                  >
                    Live Dashboard
                    <ChevronRight className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-zinc-900 w-full max-w-xl rounded-[2.5rem] p-10 relative z-10 border border-zinc-800 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">Host Tournament</h2>
              
              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 text-red-500 text-[10px] font-black uppercase p-4 rounded-r-xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={createTournament} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-full">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">League Name</label>
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-zinc-700 font-bold" placeholder="e.g. Winter Champions League" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Overs Match</label>
                    <div className="relative">
                      <input required type="number" value={overs} onChange={(e) => setOvers(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                      <Settings className="absolute right-5 top-5 w-4 h-4 text-zinc-700" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Total Wickets</label>
                    <div className="relative">
                      <input required type="number" value={wickets} onChange={(e) => setWickets(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                      <Trophy className="absolute right-5 top-5 w-4 h-4 text-zinc-700" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Participating Squads ({selectedTeamIds.length})</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-56 overflow-y-auto pr-3 scrollbar-hide">
                    {teams.map(team => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => {
                          setSelectedTeamIds(prev => 
                            prev.includes(team.id) ? prev.filter(id => id !== team.id) : [...prev, team.id]
                          )
                        }}
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                          selectedTeamIds.includes(team.id) 
                            ? 'bg-red-500/10 border-red-500 text-red-400' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-sm font-black uppercase tracking-tight">{team.name}</span>
                        {selectedTeamIds.includes(team.id) && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                      </button>
                    ))}
                    {teams.length === 0 && (
                      <div className="col-span-full py-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 border-dashed">
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest leading-relaxed px-4">
                          No squads found.<br />Please create at least 2 squads in the Teams section first.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-5 rounded-2xl border border-zinc-800 font-bold text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all uppercase text-xs tracking-widest">Cancel</button>
                   <button type="submit" className="flex-1 px-4 py-5 rounded-2xl bg-red-600 text-white font-black hover:bg-red-500 transition-all shadow-xl shadow-red-500/10 uppercase text-xs tracking-widest">Create League</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
