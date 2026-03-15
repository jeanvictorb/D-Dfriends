export interface Character {
  id: number;
  name: string;
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
  user_id: string; // Updated to string since Supabase Auth uses UUID
  inventory: InventoryItem[];
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
