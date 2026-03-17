// Class icons mapping for D&D 5e classes
// Uses emoji + a themed color per class

export const CLASS_ICONS: Record<string, { emoji: string; color: string; bg: string }> = {
  'Bárbaro':    { emoji: '🪓', color: '#ef4444', bg: 'bg-red-900/40 border-red-500/40' },
  'Bardo':      { emoji: '🎵', color: '#a855f7', bg: 'bg-purple-900/40 border-purple-500/40' },
  'Bruxo':      { emoji: '👁️', color: '#8b5cf6', bg: 'bg-violet-900/40 border-violet-500/40' },
  'Clérigo':    { emoji: '✝️', color: '#f59e0b', bg: 'bg-amber-900/40 border-amber-500/40' },
  'Druida':     { emoji: '🌿', color: '#22c55e', bg: 'bg-green-900/40 border-green-500/40' },
  'Feiticeiro': { emoji: '✨', color: '#f97316', bg: 'bg-orange-900/40 border-orange-500/40' },
  'Guerreiro':  { emoji: '⚔️', color: '#94a3b8', bg: 'bg-slate-700/40 border-slate-500/40' },
  'Ladino':     { emoji: '🗡️', color: '#64748b', bg: 'bg-slate-800/40 border-slate-600/40' },
  'Mago':       { emoji: '📖', color: '#3b82f6', bg: 'bg-blue-900/40 border-blue-500/40' },
  'Monge':      { emoji: '👊', color: '#fb923c', bg: 'bg-orange-900/40 border-orange-400/40' },
  'Paladino':   { emoji: '🛡️', color: '#facc15', bg: 'bg-yellow-900/40 border-yellow-500/40' },
  'Patrulheiro':{ emoji: '🏹', color: '#4ade80', bg: 'bg-emerald-900/40 border-emerald-500/40' },
  'Artífice':   { emoji: '⚙️', color: '#06b6d4', bg: 'bg-cyan-900/40 border-cyan-500/40' },
};

export function getClassIcon(className: string) {
  // Extract just the base class name (before subclass in parentheses)
  const base = className.split(' (')[0].trim();
  return CLASS_ICONS[base] ?? { emoji: '⚔️', color: '#94a3b8', bg: 'bg-slate-700/40 border-slate-500/40' };
}
