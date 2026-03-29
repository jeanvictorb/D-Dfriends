import React, { useEffect, useRef, useState } from 'react';
import { Character, Room, RoomMessage } from '../types';
import { MessageSquare, Users, Sparkles, ScrollText, Send, Loader2, Dice5, Scroll, Play, Volume2, VolumeX, PlayCircle, Navigation } from 'lucide-react';
import CampaignSelector from './CampaignSelector';
import { Campaign, Scene } from '../data/campaigns';
import { supabase } from '../lib/supabase';
import CampaignMap from './CampaignMap';

interface Props {
  room: Room;
  backgroundUrl: string;
  messages: RoomMessage[];
  partyCharacters: Character[];
  currentCharacter: Character | null;
  onSendMessage: (text: string) => void;
  isAiThinking?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  playNarration: (text: string, id: string) => void;
  currentlyPlaying: string | null;
  onClose: () => void;
  isNarrator: (name: string) => boolean;
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
  currentCharacter,
  onSendMessage,
  isAiThinking = false,
  isMuted,
  onToggleMute,
  playNarration,
  currentlyPlaying,
  onClose,
  isNarrator,
  activeCampaign,
  discoveredSceneIds,
  currentSceneId,
  onSelectScene,
  onDiscoverScene,
  isMaster
}) => {
  const [inputText, setInputText] = useState('');
  const [showCampaigns, setShowCampaigns] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Smart Sync - Auto change scenes based on keywords
  useEffect(() => {
    if (!activeCampaign || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    
    if (isNarrator(lastMsg.player_name)) {
      activeCampaign.scenes.forEach(scene => {
        // If scene name is mentioned in the narration, and it's not the current one
        if (lastMsg.content.toLowerCase().includes(scene.name.toLowerCase()) && scene.id !== currentSceneId) {
          // Auto-discover and select
          if (!discoveredSceneIds.includes(scene.id) && isMaster) {
            onDiscoverScene(scene.id);
          }
          onSelectScene(scene);
        }
      });
    }

    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiThinking) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleStartCampaign = (campaign: Campaign) => {
    setShowCampaigns(false);
    onSendMessage(campaign.startMessage);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start p-4 md:p-8 overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-black z-[-3]" />
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out bg-cover bg-center z-[-2] scale-105 animate-ken-burns"
        style={{ backgroundImage: `url("${backgroundUrl || '/images/scenes/taverna.png'}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 z-[-1]" />
      
      {/* Header Info */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <div className="px-6 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{room.name}</h2>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[10px] font-bold text-blue-300/60 uppercase tracking-widest">{room.style}</span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <button 
            onClick={onToggleMute}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <button 
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-all text-[9px] font-black text-white/80 uppercase tracking-widest border border-white/10"
          >
            Sair do Teatro
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-20 pb-10 relative transition-all duration-700 min-h-0">
        {/* Left Panel: Party */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 h-full overflow-y-auto no-scrollbar pb-10">
          <div className="space-y-4">
            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-2 opacity-70">
              <Users className="w-4 h-4 text-blue-400" /> Aventureiros
            </h3>
            <div className="flex flex-col gap-3">
              {partyCharacters.map(char => (
                <div 
                  key={char.id}
                  className={`p-4 rounded-2xl border transition-all ${char.id === currentCharacter?.id ? 'bg-blue-600/20 border-blue-400/40 ring-1 ring-blue-400/20' : 'bg-white/5 border-white/10 opacity-60'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                      {char.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white uppercase truncate">{char.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 transition-all duration-500" 
                            style={{ width: `${(char.hp_current / char.hp_max) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{char.hp_current}/{char.hp_max}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Map Insight */}
          {activeCampaign && (
            <div className="space-y-4">
               <h3 className="text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-2 opacity-70">
                <Navigation className="w-4 h-4 text-amber-500" /> Jornada
              </h3>
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

          {/* Campaign Starter Card */}
          {room.is_ai_mode && (
            <div className="mt-4 p-0.5 rounded-[28px] bg-gradient-to-br from-amber-500/30 to-transparent">
              <button
                onClick={() => setShowCampaigns(true)}
                className="w-full p-5 rounded-[27px] bg-black/60 backdrop-blur-xl border border-white/5 hover:bg-black/80 flex flex-col gap-3 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Scroll className="w-12 h-12 text-amber-500 rotate-12" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <Play className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Campanhas</p>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white mb-1">Iniciar Nova História</p>
                  <p className="text-[9px] text-slate-400 leading-relaxed uppercase tracking-tighter">Escolha uma aventura pré-montada para começar.</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Center: Interactive Chat */}
        <div className="lg:col-span-9 h-full flex flex-col gap-6 relative min-h-0 pb-10">
          <div 
            id="theater-chat-container"
            className="flex-1 bg-white/[0.03] backdrop-blur-3xl rounded-[40px] border border-white/10 p-6 md:p-10 overflow-y-auto custom-scrollbar flex flex-col gap-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-70">
                <MessageSquare className="w-12 h-12 text-slate-400" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 text-center px-4">O silêncio precede a aventura...</p>
                {room.is_ai_mode && (
                  <button
                    onClick={() => setShowCampaigns(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/30 rounded-2xl font-black text-white text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-xl"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar Campanha com IA
                  </button>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={msg.id || i} 
                  className={`flex flex-col gap-2 animate-fade-in ${msg.player_name === currentCharacter?.name ? 'items-end' : 'items-start'}`}
                >
                  <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isNarrator(msg.player_name) ? 'text-amber-500' : 'text-blue-400'}`}>
                    {isNarrator(msg.player_name) && <ScrollText className="w-3.5 h-3.5" />}
                    {msg.player_name}
                    {isNarrator(msg.player_name) && (
                      <button 
                        onClick={() => playNarration(msg.content, msg.id)}
                        disabled={currentlyPlaying === msg.id}
                        className={`p-1 hover:bg-white/10 rounded-full transition-all ${currentlyPlaying === msg.id ? 'text-amber-300 scale-110' : 'text-amber-500/50 hover:text-amber-500'}`}
                        title="Replay Narration"
                      >
                        {currentlyPlaying === msg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlayCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className={`
                    relative p-6 md:p-10 rounded-[32px] w-full max-w-[98%] lg:max-w-[94%] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border transition-all overflow-visible min-h-fit
                    ${isNarrator(msg.player_name) 
                      ? 'bg-amber-950/25 backdrop-blur-3xl border-amber-500/30 text-amber-50/90 italic font-serif text-xl md:text-2xl leading-relaxed border-l-4 border-l-amber-500' 
                      : msg.type === 'dice'
                        ? 'bg-indigo-950/30 backdrop-blur-3xl border-indigo-500/40 text-indigo-100 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                        : msg.player_name === currentCharacter?.name 
                          ? 'bg-blue-600/30 backdrop-blur-3xl border-blue-400/30 text-white' 
                          : 'bg-white/[0.05] backdrop-blur-3xl border-white/10 text-slate-100'}
                  `}>
                    {msg.type === 'dice' ? (
                      <div className="flex items-center gap-3">
                        <Dice5 className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-60">Rolagem</p>
                          <p className="text-xl font-black">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {isAiThinking && (
              <div className="flex items-center gap-3 text-amber-400/50 animate-pulse italic font-serif">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm underline decoration-amber-500/20 underline-offset-4">O Mestre está tecendo o destino...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[24px] blur opacity-25 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[22px] p-2 pr-4 pl-6 shadow-2xl">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isAiThinking ? "Aguarde a narração..." : "O que você faz?"}
                disabled={isAiThinking}
                className="flex-1 bg-transparent border-none py-4 text-white placeholder:text-slate-600 focus:outline-none font-medium h-14"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isAiThinking}
                className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:grayscale text-white rounded-xl transition-all shadow-lg active:scale-95"
              >
                {isAiThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex justify-center mt-3 gap-6">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Dice5 className="w-3 h-3" /> Digite /roll d20 para dados
              </span>
              {room.is_ai_mode && (
                <button
                  type="button"
                  onClick={() => setShowCampaigns(true)}
                  className="text-[9px] font-bold text-indigo-400/60 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <Scroll className="w-3 h-3" /> Escolher Campanha
                </button>
              )}
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Mestre IA Ativo
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Campaign Selector Modal */}
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
