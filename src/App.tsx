import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testConnection } from './firebase';
import { Home } from './components/Home';
import { TournamentList } from './components/TournamentList';
import { TeamList } from './components/TeamList';
import { MatchScorer } from './components/MatchScorer';
import { Navbar } from './components/Navbar';
import { motion, AnimatePresence } from 'motion/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'tournaments' | 'teams' | 'scoring'>('home');
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const navigateTo = (newView: 'home' | 'tournaments' | 'teams' | 'scoring', matchId?: string) => {
    if (matchId) setActiveMatchId(matchId);
    setView(newView);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
        <Navbar currentView={view} onViewChange={navigateTo} />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {view === 'home' && <Home onStartScoring={() => navigateTo('scoring')} onExploreTournaments={() => navigateTo('tournaments')} />}
              {view === 'tournaments' && <TournamentList />}
              {view === 'teams' && <TeamList />}
              {view === 'scoring' && <MatchScorer matchId={activeMatchId} onFinish={() => setView('home')} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
