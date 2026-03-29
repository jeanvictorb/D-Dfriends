export interface Room {
  id: string;
  name: string;
  code: string;
  style: string;
  is_ai_mode: boolean;
  current_scene?: string;
  created_by?: string;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  player_name: string;
  content: string;
  type: 'action' | 'narration' | 'dice';
  created_at: string;
}

export interface Character {
  id: number;
  name: string;
  image_url?: string;
  icon?: string; // Emoji icon for the character
  race: string;
  class_subclass: string;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hp_current: number;
  hp_max: number;
  ac: number;
  user_id: string;
  room_id?: string; // Link to the table/room
  inventory: InventoryItem[];
  xp: number;
  conditions: string[];
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  type?: string;
}

export interface Profile {
  id: string; // references auth.users(id)
  username: string;
  status: 'pending' | 'approved';
}

export interface DiceEvent {
  player: string;
  dieType: string;
  naturalRoll: number;
  modifier: number;
  total: number;
  timestamp: string;
}

export interface Token {
  id: string | number;
  name: string;
  x: number;
  y: number;
  color: string;
  icon?: string;
  type: 'player' | 'monster' | 'object';
  subType?: string;
  size?: number;
  hp?: { current: number; max: number };
  hidden?: boolean;
  discovered?: boolean;
}

export interface CombatItem {
  name: string;
  initiative: number;
  charId?: number;
  isTurn: boolean;
}
