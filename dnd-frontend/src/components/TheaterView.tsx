import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic, Send, Volume2, VolumeX, Sparkles, Image, 
  Maximize2, Minimize2, Settings, List, RefreshCw, Book, MessageSquare, Users, ScrollText, Loader2, Dice5, Scroll, Play, PlayCircle, Navigation
} from 'lucide-react';
import { Character, Room, RoomMessage } from '../types';
import CampaignSelector from './CampaignSelector';
import { Campaign, Scene } from '../data/campaigns';
import CampaignMap from './CampaignMap';
import Atmosphere from './Atmosphere';
import { getClassIcon } from '../lib/classIcons';

interface Props {
  room: Room;
  backgroundUrl: string;
  messages: RoomMessage[];
  partyCharacters: Character[];
  character: Character | null;
  onSendMessage: (content: string) => Promise<void>;
  isAiThinking?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  playNarration: (text: string, id: string) => void;
  currentlyPlaying: string | null;
  onClose: () => void;
  isNarrator: (name: string) => boolean;
  onOpenDiary: () => void;
  activeCampaign?: Campaign | null;
  discoveredSceneIds: string[];
  currentSceneId: string;
  onSelectScene: (scene: Scene) => void;
  onDiscoverScene: (sceneId: string) => void;
  isMaster: boolean;
}

const TheaterView: React.FC<Props> = ({ 
  room, 
  backgroundUrl, 
  messages, 
  partyCharacters, 
  character,
  onSendMessage,
  isAiThinking = false,
  isMuted,
  onToggleMute,
  playNarration,
  currentlyPlaying,
  onClose,
  isNarrator,
  onOpenDiary,
  activeCampaign,
  currentSceneId,
  discoveredSceneIds,
  onSelectScene,
  onDiscoverScene,
  isMaster
}) => {
  const [inputText, setInputText] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };
    
    // Immediate scroll
    scrollToBottom();
    
    // Delayed scroll to account for image loading or layout shifts from large text
    const timer = setTimeout(scrollToBottom, 100);
    const timerLong = setTimeout(scrollToBottom, 500); // Garante scroll para textos muito longos
    return () => { clearTimeout(timer); clearTimeout(timerLong); };
  }, [messages, isAiThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleStartCampaign = (campaign: Campaign) => {
    onSendMessage(`!!!START_CAMPAIGN:${campaign.id}`);
    setShowCampaigns(false);
  };

  if (!room || !character) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 overflow-hidden font-sans">
      
      {/* Background Layer with Effects */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 animate-ken-burns opacity-60 scale-110"
          style={{ backgroundImage: `url(${backgroundUrl || '/images/scenes/taverna.png'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-transparent" />
        
        {/* Environmental Atmosphere */}
        <Atmosphere variant={activeCampaign?.id.includes('caminho_aventureiro') ? 'fire' : 'neutral'} />
      </div>

      {/* Top Header Controls */}
      <div className="relative z-50 flex justify-between items-center p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30">
            <ScrollText className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic truncate max-w-[200px] md:max-w-md uppercase tracking-tighter">
              {room.name}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sessão Ativa</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">

          <button 
            onClick={onOpenDiary}
            className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl border border-amber-500/30 transition-all hover:scale-110 shadow-lg group relative"
            title="Diário da Campanha"
          >
            <Book className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Ver Diário</span>
          </button>

          <button 
            onClick={onToggleMute}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white transition-all shadow-xl"
            title={isMuted ? "Ativar Som" : "Mudar Som"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
          >
            Sair do Teatro
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-8 overflow-hidden">
        
        {/* Left Side: Party & Map */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 overflow-y-auto custom-scrollbar-thin pr-4 pb-20">
          <div className="bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Grupo de Heróis
            </h3>
            <div className="space-y-4">
              {partyCharacters.map(char => {
                const icon = getClassIcon(char.class_subclass);
                return (
                  <div key={char.id} className={`p-4 rounded-3xl border transition-all ${char.id === character?.id ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-black/40 border-white/5 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border"
                        style={{ backgroundColor: icon.color + '20', borderColor: icon.color + '40' }}
                      >
                        {icon.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white text-[11px] truncate uppercase tracking-wide">{char.name}</p>
                        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest truncate">{char.class_subclass}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${char.hp_current / char.hp_max < 0.3 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (char.hp_current / char.hp_max) * 100)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeCampaign && (
             <div className="bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 p-2 shadow-2xl overflow-hidden min-h-[300px]">
                <CampaignMap 
                  scenes={activeCampaign.scenes}
                  discoveredSceneIds={discoveredSceneIds}
                  currentSceneId={currentSceneId}
                  onSelectScene={onSelectScene}
                  onDiscoverScene={onDiscoverScene}
                  isMaster={isMaster}
                />
             </div>
          )}
        </div>

        {/* Center/Right: Chat Area */}
        <div className="lg:col-span-9 flex flex-col bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 scroll-smooth custom-scrollbar-thin pb-32"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                <Sparkles className="w-16 h-16 mb-4 animate-spin-slow" />
                <p className="font-black uppercase tracking-[0.3em] text-xs">O silêncio precede a sua história...</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const narrator = isNarrator(msg.player_name);
                return (
                  <div key={msg.id || i} className={`flex flex-col ${narrator ? 'items-center text-center px-4 md:px-16' : msg.player_name === character?.name ? 'items-end' : 'items-start'}`}>
                    <div className={`group relative p-6 md:p-8 rounded-[2.5rem] transition-all duration-500 ${
                      narrator 
                        ? 'bg-transparent border-none max-w-4xl' 
                        : msg.player_name === character?.name 
                          ? 'bg-indigo-600/20 border border-indigo-500/30 max-w-[85%] shadow-xl' 
                          : 'bg-white/5 border border-white/5 max-w-[85%] hover:border-white/10'
                    }`}>
                      {narrator && (
                        <div className="mb-6 flex flex-col items-center gap-6">
                           <button 
                            onClick={() => playNarration(msg.content, msg.id || i.toString())}
                            disabled={currentlyPlaying === msg.id}
                            className={`w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/10 text-white transition-all hover:scale-110 active:scale-95 group/play ${currentlyPlaying === msg.id ? 'animate-pulse' : ''}`}
                            title="Ouvir Narração"
                          >
                             {currentlyPlaying === msg.id ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8" />}
                          </button>
                        </div>
                      )}

                        <div className={`leading-relaxed tracking-wide whitespace-pre-wrap break-words ${
                          narrator 
                            ? 'text-2xl md:text-4xl font-black text-white italic drop-shadow-2xl font-serif' 
                            : 'text-base font-medium text-slate-200'
                        }`}>
                        {msg.type === 'dice' ? (
                          <div className="flex items-center gap-4 py-2">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
                              <Dice5 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-3xl font-black italic tracking-tighter text-indigo-400">ROLO DE DADO: {msg.content}</span>
                          </div>
                        ) : narrator ? (
                          <TypewriterText text={msg.content} speed={15} onUpdate={() => {
                            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                          }} />
                        ) : (
                          msg.content
                        )}
                      </div>

                      {!narrator && (
                        <div className={`mt-4 flex items-center gap-3 ${msg.player_name === character?.name ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10">
                            <span className="text-[10px] font-black text-white uppercase">{msg.player_name[0]}</span>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${msg.player_name === character?.name ? 'text-indigo-400' : 'text-slate-500'}`}>
                            {msg.player_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isAiThinking && (
              <div className="flex flex-col items-center gap-4 py-8 opacity-40">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200" />
                </div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">O Mestre está tecendo o destino...</span>
              </div>
            )}
          </div>

          {/* Bottom Chat Input */}
          <div className="p-8 bg-black/40 border-t border-white/5 relative z-20">
             {activeCampaign?.id === 'tutorial_caminho_aventureiro' && messages.length < 5 && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-400">
                  <Sparkles className="w-3 h-3" /> Dica: Descreva sua ação no chat!
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 max-w-5xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-4">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Seu destino aguarda sua voz..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium italic shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white px-8 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95 shadow-xl shadow-indigo-600/30"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              
              <div className="flex justify-center gap-8">
                {room.is_ai_mode && (
                  <button onClick={() => setShowCampaigns(true)} className="flex items-center gap-2 text-indigo-400/60 hover:text-indigo-300 transition-colors group">
                     <Scroll className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">Explorar Outras Crônicas</span>
                  </button>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <Dice5 className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Use /roll d20 para testes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCampaigns && (
        <CampaignSelector
          onSelectCampaign={handleStartCampaign}
          onClose={() => setShowCampaigns(false)}
        />
      )}
    </div>
  );
};

export default TheaterView;

const TypewriterText: React.FC<{ text: string; speed?: number; onUpdate?: () => void; onComplete?: () => void }> = ({ text, speed = 20, onUpdate, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
        if (onUpdate) onUpdate();
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onUpdate, onComplete]);

  return <span>{displayedText}</span>;
};
