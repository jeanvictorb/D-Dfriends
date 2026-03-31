import React from 'react';
import { Sword, Zap, Dice5, Users, ChevronRight, Play, Sparkles, Shield } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#0c1527] text-slate-200 selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c1527]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer transition-all hover:scale-105">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 bg-blue-600 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src="/logo.png" alt="D&D Friends Logo" className="relative w-full h-full object-contain drop-shadow-2xl" />
            </div>
            <span className="text-2xl font-black text-white italic tracking-tighter uppercase">
              D&D <span className="text-blue-500">Friends</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={onLogin}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={onStart}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Começar Aventura
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Sparkles className="w-4 h-4" />
            A Evolução do RPG de Mesa
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-8 tracking-tighter animate-fade-in" style={{ animationDelay: '0.1s' }}>
            SUA MESA DE RPG <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-600">INTELIGENTE</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Onde a imaginação encontra a Inteligência Artificial. Jogue com amigos, 
            sinta a emoção dos dados 3D e deixe nossa IA narrar suas aventuras épicas.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95 group"
            >
              <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              INICIAR JORNADA
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-5 bg-slate-800/50 hover:bg-slate-800 text-white border border-white/10 rounded-2xl font-bold text-lg transition-all hover:border-blue-500/50"
            >
              Conhecer Recursos
            </button>
          </div>

          {/* Hero Interface Preview - Glassmorphism Card */}
          <div className="mt-20 relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="absolute -inset-4 bg-blue-600/10 rounded-[3rem] blur-3xl -z-10 animate-pulse"></div>
            <div className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden aspect-video relative group transition-all hover:scale-[1.02] hover:border-blue-500/30">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1527] via-transparent to-transparent opacity-40 z-10"></div>
              
              <img 
                src="/images/cinematic_trailer.png" 
                alt="RPG Friends Cinematic Experience" 
                className="w-full h-full object-cover rounded-[2rem] opacity-90 transition-transform duration-1000 group-hover:scale-105"
              />

              {/* Decorative Corner Elements */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-white/20 rounded-tl-2xl"></div>
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-white/20 rounded-br-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[#080f1d] relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.4em] mb-4">RECURSOS ÉPICOS</h2>
            <h3 className="text-4xl font-black text-white uppercase italic">O Poder de um Mestre no seu Navegador</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-blue-400" />}
              title="Mestre IA Dinâmico"
              description="Nossa IA avançada cria histórias, diálogos e desafios em tempo real, adaptando-se a cada escolha dos jogadores."
            />
            <FeatureCard 
              icon={<Dice5 className="w-8 h-8 text-indigo-400" />}
              title="Dados 3D Físicos"
              description="Sinta a tensão em cada rolagem com o motor físico 3D integrado. Resultados sincronizados instantaneamente."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-blue-400" />}
              title="Multiplayer Realtime"
              description="Conecte-se com amigos. Chat, rolagens e fichas sincronizadas para uma experiência de mesa real."
            />
            <FeatureCard 
              icon={<Sword className="w-8 h-8 text-amber-500" />}
              title="Combate Tático"
              description="Gerencie iniciativas, vida e turnos com um dashboard simplificado e intuitivo para mestre e jogadores."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-blue-600" />}
              title="Fichas Automáticas"
              description="Sistema de ficha inteligente que calcula modificadores e perícias baseado no sistema D&D 5e."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-purple-400" />}
              title="Vozes Imersivas"
              description="Narração por voz com vozes premium e ambientação sonora que muda conforme o local da aventura."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-blue-600/5 -z-10"></div>
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase italic tracking-tighter">
            PRONTO PARA <span className="text-blue-500">ROLAR A INICIATIVA?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 font-medium">
            Junte-se gratuito hoje e comece sua primeira aventura em minutos. 
            Sem necessidade de instalação, diretamente no seu navegador.
          </p>
          <button 
            onClick={onStart}
            className="px-12 py-5 bg-white text-blue-900 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
          >
            CRIAR CONTA GRÁTIS
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-6 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-white tracking-widest uppercase">D&D Friends</span>
          </div>
          <p className="text-sm">© 2026 D&D Friends. Onde cada rolagem conta uma história.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string, description: string }> = ({ icon, title, description }) => (
  <div className="p-8 bg-[#15234b]/20 border border-white/5 rounded-3xl hover:bg-[#15234b]/40 transition-all hover:border-blue-500/30 group">
    <div className="w-16 h-16 bg-[#0c1527] rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-xl">
      {icon}
    </div>
    <h4 className="text-xl font-black text-white mb-4 uppercase italic tracking-tight">{title}</h4>
    <p className="text-slate-400 font-medium leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
