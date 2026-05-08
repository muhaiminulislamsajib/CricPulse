import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Plus, Users, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function TeamList() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'teams'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'teams');
    });

    return unsubscribe;
  }, []);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to create a team');
    if (!newTeamName.trim()) return;

    try {
      const teamRef = await addDoc(collection(db, 'teams'), {
        name: newTeamName,
        ownerId: user.uid,
        playerNames: players,
        createdAt: serverTimestamp(),
      });

      // Create player documents
      for (const playerName of players) {
        await addDoc(collection(db, 'players'), {
          name: playerName,
          teamId: teamRef.id,
          teamName: newTeamName,
          ownerId: user.uid,
          careerStats: {
            matches: 0,
            runs: 0,
            wickets: 0,
            highestScore: 0,
          },
          createdAt: serverTimestamp(),
        });
      }

      setNewTeamName('');
      setPlayers([]);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teams');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Teams</h1>
          <p className="text-zinc-500 font-medium">Manage your squads and track performance</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black py-3 px-8 rounded-2xl transition-all shadow-xl shadow-red-500/10 uppercase text-xs tracking-widest"
          id="add-team-btn"
        >
          <Plus className="w-5 h-5" />
          Create New Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="col-span-full bg-zinc-900 p-12 rounded-[2rem] text-center border border-dashed border-zinc-800">
            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-1 uppercase">No teams found</h3>
            <p className="text-zinc-500">Create your first team to get started</p>
          </div>
        ) : (
          teams.map(team => (
            <motion.div
              layout
              key={team.id}
              className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 hover:border-red-500/30 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-zinc-950 w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-red-500" />
                </div>
                <span className="text-[10px] bg-zinc-950 px-2.5 py-1 rounded-full text-zinc-500 uppercase font-black tracking-widest border border-zinc-800">
                  {team.playerNames?.length || 0} Squad
                </span>
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tight">{team.name}</h3>
              <div className="flex flex-wrap gap-2">
                {team.playerNames?.slice(0, 5).map((p: string, i: number) => (
                  <span key={i} className="text-[10px] uppercase font-bold bg-zinc-950 px-2 py-1 rounded-lg text-zinc-400 border border-zinc-800">
                    {p}
                  </span>
                ))}
                {team.playerNames?.length > 5 && (
                  <span className="text-[10px] uppercase font-black bg-zinc-950 px-2 py-1 rounded-lg text-zinc-600 border border-zinc-800">
                    +{team.playerNames.length - 5}
                  </span>
                )}
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-zinc-800 shadow-2xl"
            >
              <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">Create Team</h2>
              <form onSubmit={createTeam} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Team Name</label>
                  <input
                    required
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-zinc-700"
                    placeholder="e.g. Royal Challengers"
                    id="team-name-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Add Players</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlayer())}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-zinc-700"
                      placeholder="Player Name"
                      id="player-name-input"
                    />
                    <button
                      type="button"
                      onClick={handleAddPlayer}
                      className="bg-zinc-800 text-red-500 w-14 rounded-2xl hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center"
                      id="add-player-btn"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 py-2">
                  {players.map((p, i) => (
                    <span key={i} className="bg-zinc-950 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 group border border-zinc-800 text-zinc-300">
                      {p}
                      <button 
                        type="button" 
                        onClick={() => setPlayers(players.filter((_, idx) => idx !== i))}
                        className="text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-4 rounded-2xl border border-zinc-800 font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all uppercase text-xs tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-500 transition-all shadow-xl shadow-red-500/10 uppercase text-xs tracking-widest"
                    id="save-team-btn"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
