import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Lock, Loader2, Sparkles, ChevronRight } from 'lucide-react';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const hiddenEmail = `${username.trim().toLowerCase().replace(/\s+/g, '')}@dnd.local`;

      if (isSignUp) {
        let signUpEmail = hiddenEmail;
        if (username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'mestre') {
          signUpEmail = `${username.trim().toLowerCase()}@admin.com`;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: signUpEmail,
          password,
          options: {
            data: { username: username.trim() }
          }
        });
        if (signUpError) throw signUpError;
        onAuthSuccess();
      } else {
        let signInEmail = hiddenEmail;
        if (username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'mestre') {
          signInEmail = `${username.trim().toLowerCase()}@admin.com`;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: signInEmail,
          password,
        });
        if (signInError) throw signInError;
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1527] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-[#15234b]/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/40 relative overflow-hidden group">
          {/* Subtle Decorative Borders */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          <div className="text-center relative z-10">
            <div className="mx-auto w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src="/logo.png" alt="D&D Friends Logo" className="relative w-full h-full object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </div>
            
            <div className="flex items-center justify-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 mx-auto w-fit">
              <Sparkles className="w-3 h-3" />
              Portal do Aventureiro
            </div>
            
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
              {isSignUp ? 'Nova Jornada' : 'Voltar à Mesa'}
            </h2>
            <p className="text-sm font-medium text-slate-400 tracking-tight">
              {isSignUp ? 'Crie seu destino em D&D Friends' : 'Sua mesa de RPG inteligente aguarda'}
            </p>
          </div>

          {error && (
            <div className="mt-8 bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-2xl text-xs font-bold text-center animate-in fade-in duration-300">
              {error}
            </div>
          )}

          <form className="mt-10 space-y-6 relative z-10" onSubmit={handleAuth}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nome do Jogador</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#0c1527]/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-[#0c1527] transition-all font-medium"
                    placeholder="Seu Nickname épico..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Chave de Acesso</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0c1527]/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-[#0c1527] transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl text-lg font-black text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? 'REGISTRAR AGORA' : 'ENTRAR NA TAVERNA'}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-10 text-center relative z-10 border-t border-white/5 pt-8">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-black text-slate-400 hover:text-blue-400 uppercase tracking-[0.1em] transition-all hover:scale-105"
            >
              {isSignUp ? (
                <span>JÁ TEM UMA CONTA? <span className="text-blue-500 ml-1 underline underline-offset-4">ENTRE AQUI</span></span>
              ) : (
                <span>NÃO TEM UMA CONTA? <span className="text-blue-500 ml-1 underline underline-offset-4">REGISTRE-SE AGORA</span></span>
              )}
            </button>
          </div>
        </div>
        
        {/* Footer info/credits */}
        <p className="mt-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] italic">
          ⚔️ Onde cada rolagem conta uma história ⚔️
        </p>
      </div>
    </div>
  );
}
