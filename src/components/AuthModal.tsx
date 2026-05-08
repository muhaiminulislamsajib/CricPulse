import React, { useState } from 'react';
import { loginWithEmail, signupWithEmail, loginWithGoogle } from '../firebase';
import { X, Mail, Lock, User, Loader2, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl overflow-visible"
          >
            <button 
              onClick={onClose} 
              className="absolute -right-2 -top-2 w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all border border-zinc-700 shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
    
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/20 rotate-3">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none mb-2">
                {isLogin ? 'Sign In' : 'Join Squad'}
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                {isLogin ? 'Access your dashboard' : 'Start your cricket career'}
              </p>
            </div>
    
            {error && (
              <div className="bg-red-500/10 border-l-4 border-red-500 text-red-500 text-[10px] font-black uppercase p-4 rounded-r-xl mb-6 animate-shake">
                <span className="flex-1">{error}</span>
              </div>
            )}
    
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text" 
                      placeholder="e.g. MS Dhoni"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-red-500 focus:bg-zinc-900 transition-all placeholder:text-zinc-800"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
    
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-red-500 focus:bg-zinc-900 transition-all placeholder:text-zinc-800"
                    required
                  />
                </div>
              </div>
    
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-red-500 focus:bg-zinc-900 transition-all placeholder:text-zinc-800"
                    required
                  />
                </div>
              </div>
    
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 text-sm shadow-xl shadow-red-600/20 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In Now' : 'Join Now')}
              </button>
            </form>
    
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black text-zinc-600 px-6 bg-zinc-900 mx-auto w-fit">
                Fast Access
              </div>
            </div>
    
            <button 
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-zinc-950 border-2 border-zinc-800 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all hover:bg-white hover:text-black hover:border-white active:scale-95 flex items-center justify-center gap-3 text-xs"
            >
              <Chrome className="w-4 h-4" />
              Continue with Google
            </button>
    
            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors"
              >
                {isLogin ? (
                  <>Don't have an account? <span className="text-white underline underline-offset-4 decoration-red-500">Sign up</span></>
                ) : (
                  <>Already a member? <span className="text-white underline underline-offset-4 decoration-red-500">Sign in</span></>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
