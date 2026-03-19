import { Character } from '../types';
import { classData } from '../data/classData';

const NAMES = [
  'Althalos', 'Bryn', 'Caelum', 'Dara', 'Elora', 'Faelan', 'Goran', 'Hestia', 'Iana', 'Joren',
  'Kael', 'Lyra', 'Marek', 'Nyssa', 'Orin', 'Phaedra', 'Quill', 'Runa', 'Soren', 'Thalia',
  'Ursa', 'Valen', 'Wren', 'Xander', 'Yara', 'Zane', 'Aethelred', 'Beatrice', 'Caspian', 'Dahlia'
];

const SURNAMES = [
  'Stormborn', 'Ironfoot', 'Shadowstep', 'Lightbringer', 'Oakheart', 'Silverleaf', 'Stonebrow', 'Swiftwind', 'Nightgaunt', 'Goldmane'
];

const roll4d6DropLowest = () => {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls.slice(1).reduce((a, b) => a + b, 0);
};

export const generateRandomNPC = (): Partial<Character> => {
  const firstName = NAMES[Math.floor(Math.random() * NAMES.length)];
  const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const fullName = `${firstName} ${lastName}`;

  const randomClass = classData[Math.floor(Math.random() * classData.length)];
  const randomSubclass = randomClass.subclasses[Math.floor(Math.random() * randomClass.subclasses.length)];

  const stats = {
    strength: roll4d6DropLowest(),
    dexterity: roll4d6DropLowest(),
    constitution: roll4d6DropLowest(),
    intelligence: roll4d6DropLowest(),
    wisdom: roll4d6DropLowest(),
    charisma: roll4d6DropLowest()
  };

  // Determine hit die (heuristic based on class name)
  let hitDie = 8;
  if (['Bárbaro'].includes(randomClass.name)) hitDie = 12;
  else if (['Guerreiro', 'Paladino', 'Patrulheiro'].includes(randomClass.name)) hitDie = 10;
  else if (['Feiticeiro', 'Mago'].includes(randomClass.name)) hitDie = 6;

  const conMod = Math.floor((stats.constitution - 10) / 2);
  const hp = hitDie + conMod;

  return {
    name: `${fullName} (NPC)`,
    class_subclass: `${randomClass.name} (${randomSubclass.name})`,
    level: 1,
    ...stats,
    hp_current: hp,
    hp_max: hp,
    inventory: [],
    xp: 0,
    conditions: []
  };
};
