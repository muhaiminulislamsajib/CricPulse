import React, { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight, Hash, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchScorerProps {
  matchId: string | null;
  onFinish: () => void;
}

export function MatchScorer({ matchId, onFinish }: MatchScorerProps) {
  const { user } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [isSetup, setIsSetup] = useState(true);
  
  // Selection state for setup
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [overs, setOvers] = useState(20);
  const [wickets, setWickets] = useState(10);

  useEffect(() => {
    onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (matchId) {
      setIsSetup(false);
      onSnapshot(doc(db, 'matches', matchId), (d) => {
        if (d.exists()) setMatch({ id: d.id, ...d.data() });
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [matchId]);

  const [currentScore, setCurrentScore] = useState({
    runs: 0,
    wickets: 0,
    balls: 0,
    extras: 0,
  });

  const startMatch = async () => {
    if (!teamAId || !teamBId || teamAId === teamBId) return alert('Select two distinct teams');
    const teamA = teams.find(t => t.id === teamAId);
    const teamB = teams.find(t => t.id === teamBId);

    try {
      const matchData = {
        teamAId,
        teamBId,
        teamAName: teamA.name,
        teamBName: teamB.name,
        status: 'live',
        currentInnings: 1,
        overs,
        maxWickets: wickets,
        ownerId: user?.uid,
        score: {
          innings1: { runs: 0, wickets: 0, balls: 0, extras: 0 },
          innings2: { runs: 0, wickets: 0, balls: 0, extras: 0 },
        },
        createdAt: serverTimestamp(),
      };
      const d = await addDoc(collection(db, 'matches'), matchData);
      setMatch({ id: d.id, ...matchData });
      setIsSetup(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'matches');
    }
  };

  const handleBall = async (runs: number, isWicket = false, isExtra = false, extraType = '') => {
    if (!match) return;
    const inningsKey = `innings${match.currentInnings}` as 'innings1' | 'innings2';
    const currentInningsData = match.score[inningsKey];

    const updatedInnings = {
      ...currentInningsData,
      runs: currentInningsData.runs + runs + (isExtra ? 1 : 0),
      wickets: currentInningsData.wickets + (isWicket ? 1 : 0),
      balls: currentInningsData.balls + (isExtra ? 0 : 1),
      extras: currentInningsData.extras + (isExtra ? 1 : 0),
    };

    const nextScore = { ...match.score, [inningsKey]: updatedInnings };
    
    // Check for innings end
    let nextInnings = match.currentInnings;
    let nextStatus = match.status;
    let winner = match.winnerId || null;

    const totalBalls = match.overs * 6;
    if (updatedInnings.wickets >= match.maxWickets || updatedInnings.balls >= totalBalls) {
      if (match.currentInnings === 1) {
        nextInnings = 2;
      } else {
        nextStatus = 'completed';
        const i1 = match.score.innings1.runs;
        const i2 = updatedInnings.runs;
        if (i2 > i1) winner = match.teamBId;
        else if (i1 > i2) winner = match.teamAId;
        else winner = 'draw';
      }
    }

    // Innings 2 target check
    if (match.currentInnings === 2 && updatedInnings.runs > match.score.innings1.runs) {
      nextStatus = 'completed';
      winner = match.teamBId;
    }

    try {
      await updateDoc(doc(db, 'matches', match.id), {
        score: nextScore,
        currentInnings: nextInnings,
        status: nextStatus,
        winnerId: winner,
      });

      // Log ball
      await addDoc(collection(db, 'matches', match.id, 'balls'), {
        inningsNo: match.currentInnings,
        runs,
        isWicket,
        isExtra,
        extraType,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matches/${match.id}`);
    }
  };

  if (isSetup) {
    return (
      <div className="max-w-2xl mx-auto bg-zinc-900 rounded-[2.5rem] p-10 border border-zinc-800 shadow-2xl">
        <h2 className="text-4xl font-black mb-10 text-white uppercase tracking-tighter">Match Setup</h2>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Team A (Innings 1)</label>
              <select 
                value={teamAId} 
                onChange={e => setTeamAId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-red-500 font-bold text-zinc-100 appearance-none"
              >
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Team B</label>
              <select 
                value={teamBId} 
                onChange={e => setTeamBId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-red-500 font-bold text-zinc-100 appearance-none"
              >
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Format (Overs)</label>
              <input type="number" value={overs} onChange={e => setOvers(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Max Wickets</label>
              <input type="number" value={wickets} onChange={e => setWickets(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold" />
            </div>
          </div>
          <button 
            onClick={startMatch}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-red-500/10 text-lg uppercase tracking-widest active:scale-95"
            id="start-match-btn"
          >
            Launch Record
          </button>
        </div>
      </div>
    );
  }

  if (!match) return <div className="text-center py-20"><Loader2 className="w-12 h-12 animate-spin mx-auto text-red-500" /></div>;

  const currentInnings = match.score[`innings${match.currentInnings}` as 'innings1' | 'innings2'];
  const over = Math.floor(currentInnings.balls / 6);
  const ballInOver = currentInnings.balls % 6;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Scoreboard Card */}
      <div className="bg-zinc-900 rounded-[3rem] p-10 md:p-16 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-red-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
                  Innings {match.currentInnings}
                </span>
                {match.status === 'live' && (
                  <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Recording Live
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white mt-6 uppercase tracking-tighter flex flex-wrap items-center gap-x-6">
                <span>{match.currentInnings === 1 ? match.teamAName : match.teamBName}</span>
                <span className="text-zinc-700 font-medium">vs</span>
                <span>{match.currentInnings === 1 ? match.teamBName : match.teamAName}</span>
              </h1>
            </div>
            {match.status === 'completed' && (
              <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Summary</span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-12">
             <div className="flex items-baseline gap-4">
                <span className="text-8xl md:text-[11rem] font-black text-white leading-[0.8] tracking-tighter transition-all">
                  {currentInnings.runs}
                </span>
                <span className="text-5xl md:text-7xl font-medium text-zinc-600 leading-none">
                  /{currentInnings.wickets}
                </span>
             </div>
             <div className="pb-2 md:pb-10">
                <div className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-2">Current Progress</div>
                <div className="text-3xl md:text-5xl font-black text-zinc-300 font-mono tracking-tighter">
                  {over}.{ballInOver} <span className="text-zinc-700 text-2xl font-medium">/ {match.overs}</span>
                </div>
             </div>
          </div>

          {match.currentInnings === 2 && match.status === 'live' && (
            <div className="mt-10 bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex items-center gap-5">
              <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <Hash className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Innings Projection</p>
                <div className="text-white text-xl font-bold uppercase tracking-tight">
                  Need <span className="text-red-500 font-black">{match.score.innings1.runs + 1 - currentInnings.runs}</span> runs in <span className="text-red-500 font-black">{match.overs * 6 - currentInnings.balls}</span> legal deliveries
                </div>
              </div>
            </div>
          )}

          {match.status === 'completed' && (
             <div className="mt-10 bg-red-600 text-white font-black px-8 py-5 rounded-2xl text-2xl inline-block shadow-2xl shadow-red-600/20 uppercase tracking-widest">
               {match.winnerId === 'draw' ? 'MATCH DRAWN' : `${match.winnerId === match.teamAId ? match.teamAName : match.teamBName} VICTORIOUS`}
             </div>
          )}
        </div>

        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-red-600/5 rounded-full -translate-x-1/4 -translate-y-1/4 blur-[120px] pointer-events-none" />
      </div>

      {/* Control Panel */}
      {match.status === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-8">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
              Run Attribution
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 6].map(r => (
                <button 
                  key={r} 
                  onClick={() => handleBall(r)}
                  className={`aspect-square rounded-2xl text-3xl font-black transition-all flex items-center justify-center border active:scale-90 shadow-lg ${
                    r >= 4 ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-8">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
              Incidents & Penalties
            </h3>
            <div className="flex flex-col gap-5">
               <div className="grid grid-cols-2 gap-5">
                 <button 
                  onClick={() => handleBall(0, false, true, 'wide')}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 py-5 rounded-2xl font-black hover:bg-zinc-700 transition-all uppercase text-xs tracking-widest"
                >
                  Wide Ball
                </button>
                <button 
                  onClick={() => handleBall(0, false, true, 'noball')}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 py-5 rounded-2xl font-black hover:bg-zinc-700 transition-all uppercase text-xs tracking-widest"
                >
                  No Ball
                </button>
               </div>
              <button 
                onClick={() => handleBall(0, true)}
                className="w-full bg-red-900/20 border border-red-500/30 text-red-500 py-8 rounded-[2rem] font-black text-3xl hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-900/10 uppercase tracking-tighter"
              >
                Wicket / Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ball Log */}
      <div className="bg-zinc-900 rounded-[2rem] p-8 border border-zinc-800 shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-3">
            <Activity className="w-4 h-4 text-red-500" />
            Last Over Chronology
          </h3>
          <button 
            onClick={onFinish} 
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white px-5 py-2 border border-zinc-800 rounded-xl transition-colors"
          >
            Exit Scorer
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           <div className="flex-shrink-0 bg-red-600 w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg shadow-red-600/20 border-2 border-red-500/50">6</div>
           <div className="flex-shrink-0 bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center font-black text-zinc-300 border-2 border-zinc-700">1</div>
           <div className="flex-shrink-0 bg-red-600 w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg shadow-red-600/20 border-2 border-red-500/50">W</div>
           <div className="flex-shrink-0 bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center font-black text-zinc-400 border-2 border-zinc-700">0</div>
           <div className="flex-shrink-0 bg-zinc-950 w-12 h-12 rounded-full flex items-center justify-center font-black text-zinc-700 border-2 border-zinc-800 font-mono tracking-widest italic">. . .</div>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}
