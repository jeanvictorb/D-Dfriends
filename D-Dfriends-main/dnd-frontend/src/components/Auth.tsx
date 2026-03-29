import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, User, Lock, Loader2 } from 'lucide-react';

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
        // Exception for existing admin/master
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel max-w-md w-full space-y-8 p-10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#2a4387]/20 rounded-full blur-3xl"></div>

        <div className="text-center relative z-10">
          <div className="mx-auto w-16 h-16 bg-[#15234b]/80 border border-[#2a4387]/50 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            {isSignUp ? 'Criar Conta' : 'Acessar Taverna'}
          </h2>
          <p className="text-sm font-medium text-slate-400">
            {isSignUp ? 'Junte-se à aventura hoje mesmo' : 'Bem-vindo de volta, aventureiro'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm font-medium text-center relative z-10">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Jogador</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-xl py-3 pl-10 pr-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Seu Nickname épico..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-xl py-3 pl-10 pr-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isSignUp ? 'Registrar' : 'Entrar'
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Registre-se agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
