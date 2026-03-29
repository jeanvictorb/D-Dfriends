export interface Character {
  id?: number;
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
  user_id: number;
  created_at?: string;
}

export interface DiceEvent {
  player: string;
  dieType: string;
  naturalRoll: number;
  modifier: number;
  total: number;
  timestamp: string;
}
