export const SRD_DATA = {
  "dnd_classes": [
    {
      "name": "Bárbaro",
      "hit_die": "d12",
      "primary_ability": ["Força"],
      "saving_throws": ["Força", "Constituição"],
      "proficiencies": {
        "armor": ["Armaduras leves", "Armaduras médias", "Escudos"],
        "weapons": ["Armas simples", "Armas marciais"],
        "tools": [],
        "skills_choice": {
          "choose": 2,
          "options": ["Adestrar Animais", "Atletismo", "Intimidação", "Natureza", "Percepção", "Sobrevivência"]
        }
      },
      "starting_equipment": ["Machado grande ou arma marcial", "Duas machadinhas ou arma simples", "Pacote de explorador", "4 Azagaias"],
      "subclasses": [{ "name": "Caminho do Berserker" }, { "name": "Caminho do Totem Guerreiro" }]
    },
    {
      "name": "Bardo",
      "hit_die": "d8",
      "primary_ability": ["Carisma"],
      "saving_throws": ["Destreza", "Carisma"],
      "proficiencies": {
        "armor": ["Armaduras leves"],
        "weapons": ["Armas simples", "Bestas de mão", "Espadas longas", "Rapiárias", "Espadas curtas"],
        "tools": ["Três instrumentos musicais à escolha"],
        "skills_choice": { "choose": 3, "options": ["Todas"] }
      },
      "starting_equipment": ["Rapiária ou Espada longa ou Arma simples", "Pacote de diplomata ou Artista", "Lute ou Instrumento musical", "Armadura de couro", "Adaga"],
      "subclasses": [{ "name": "Colégio do Conhecimento" }, { "name": "Colégio do Valor" }]
    },
    {
      "name": "Bruxo",
      "hit_die": "d8",
      "primary_ability": ["Carisma"],
      "saving_throws": ["Sabedoria", "Carisma"],
      "proficiencies": {
        "armor": ["Armaduras leves"],
        "weapons": ["Armas simples"],
        "tools": [],
        "skills_choice": {
          "choose": 2,
          "options": ["Arcanismo", "Enganação", "História", "Intimidação", "Investigação", "Natureza", "Religião"]
        }
      },
      "starting_equipment": ["Besta leve e 20 virotes ou Arma simples", "Bolsa de componentes ou Foco arcano", "Pacote de estudioso ou Masmorreiro", "Armadura de couro", "Qualquer arma simples", "Duas adagas"],
      "subclasses": [{ "name": "O Ínfero" }, { "name": "O Arquifada" }, { "name": "O Grande Antigo" }]
    },
    {
      "name": "Clérigo",
      "hit_die": "d8",
      "primary_ability": ["Sabedoria"],
      "saving_throws": ["Sabedoria", "Carisma"],
      "proficiencies": {
        "armor": ["Armaduras leves", "Armaduras médias", "Escudos"],
        "weapons": ["Armas simples"],
        "tools": [],
        "skills_choice": {
          "choose": 2,
          "options": ["História", "Intuição", "Medicina", "Persuasão", "Religião"]
        }
      },
      "starting_equipment": ["Maça ou Martelo de guerra", "Cota de malha ou Couro ou Couro batido", "Besta leve e 20 virotes ou Arma simples", "Pacote de sacerdote ou Explorador", "Escudo", "Símbolo sagrado"],
      "subclasses": [{ "name": "Domínio da Vida" }, { "name": "Domínio da Luz" }, { "name": "Domínio da Tempestade" }]
    },
    {
      "name": "Druida",
      "hit_die": "d8",
      "primary_ability": ["Sabedoria"],
      "saving_throws": ["Inteligência", "Sabedoria"],
      "proficiencies": {
        "armor": ["Armaduras leves (não metálicas)", "Armaduras médias (não metálicas)", "Escudos (não metálicos)"],
        "weapons": ["Adagas", "Dardos", "Zaratanas", "Maças", "Cajados", "Cimitarras", "Foices", "Frondas", "Lanças"],
        "tools": ["Kit de Herbalismo"],
        "skills_choice": {
          "choose": 2,
          "options": ["Adestrar Animais", "Arcanismo", "Intuição", "Medicina", "Natureza", "Percepção", "Religião", "Sobrevivência"]
        }
      },
      "starting_equipment": ["Escudo de madeira ou Arma simples", "Cimitara ou Arma simples corpo-a-corpo", "Armadura de couro", "Pacote de explorador", "Foco druídico"],
      "subclasses": [{ "name": "Círculo da Terra" }, { "name": "Círculo da Lua" }]
    },
    {
      "name": "Feiticeiro",
      "hit_die": "d6",
      "primary_ability": ["Carisma"],
      "saving_throws": ["Constituição", "Carisma"],
      "proficiencies": {
        "armor": [],
        "weapons": ["Adagas", "Dardos", "Zaratanas", "Cajados", "Bestas leves"],
        "tools": [],
        "skills_choice": {
          "choose": 2,
          "options": ["Arcanismo", "Enganação", "Intimidação", "Intuição", "Persuasão", "Religião"]
        }
      },
      "starting_equipment": ["Besta leve e 20 virotes ou Arma simples", "Bolsa de componentes ou Foco arcano", "Pacote de masmorreiro ou Explorador", "Duas adagas"],
      "subclasses": [{ "name": "Linhagem Dracônica" }, { "name": "Magia Selvagem" }]
    },
    {
      "name": "Guerreiro",
      "hit_die": "d10",
      "primary_ability": ["Força", "Destreza"],
      "saving_throws": ["Força", "Constituição"],
      "proficiencies": {
        "armor": ["Todas as armaduras", "Escudos"],
        "weapons": ["Armas simples", "Armas marciais"],
        "tools": [],
        "skills_choice": {
          "choose": 2,
          "options": ["Acrobacia", "Adestrar Animais", "Atletismo", "História", "Intimidação", "Intuição", "Percepção", "Sobrevivência"]
        }
      },
      "starting_equipment": ["Cota de malha ou Couro, Arco longo e 20 flechas", "Arma marcial e Escudo ou Duas armas marciais", "Besta leve e 20 virotes ou Duas machadinhas", "Pacote de masmorreiro ou Explorador"],
      "subclasses": [{ "name": "Campeão" }, { "name": "Mestre de Batalha" }, { "name": "Cavaleiro Arcano" }]
    },
    {
      "name": "Ladino",
      "hit_die": "d8",
      "primary_ability": ["Destreza"],
      "saving_throws": ["Destreza", "Inteligência"],
      "proficiencies": {
        "armor": ["Armaduras leves"],
        "weapons": ["Armas simples", "Bestas de mão", "Espadas longas", "Rapiárias", "Espadas curtas"],
        "tools": ["Ferramentas de ladrão"],
        "skills_choice": {
          "choose": 4,
          "options": ["Acrobacia", "Atletismo", "Atuação", "Enganação", "Furtividade", "Intimidação", "Intuição", "Investigação", "Percepção", "Persuasão", "Prestidigitação"]
        }
      },
      "starting_equipment": ["Rapiária ou Espada curta", "Arco curto e 20 flechas ou Espada curta", "Pacote de assaltante ou Masmorreiro ou Explorador", "Armadura de couro", "Duas adagas", "Ferramentas de ladrão"],
      "subclasses": [{ "name": "Assassino" }, { "name": "Ladrão" }, { "name": "Trapaceiro Arcano" }]
    },
    {
      "name": "Mago",
      "hit_die": "d6",
      "primary_ability": ["Inteligência"],
      "saving_throws": ["Inteligência", "Sabedoria"],
      "proficiencies": {
        "armor": [],
        "weapons": ["Adagas", "Dardos", "Zaratanas", "Cajados", "Bestas leves"],
        "tools": [],
        "skills_choice": {
          "choose": 2,
          "options": ["Arcanismo", "História", "Intuição", "Investigação", "Medicina", "Religião"]
        }
      },
      "starting_equipment": ["Cajado ou Adaga", "Bolsa de componentes ou Foco arcano", "Pacote de estudioso ou Explorador", "Grimório"],
      "subclasses": [{ "name": "Escola de Evocação" }, { "name": "Escola de Abjuração" }, { "name": "Escola de Necromancia" }]
    },
    {
      "name": "Monge",
      "hit_die": "d8",
      "primary_ability": ["Destreza", "Sabedoria"],
      "saving_throws": ["Força", "Destreza"],
      "proficiencies": {
        "armor": [],
        "weapons": ["Armas simples", "Espadas curtas"],
        "tools": ["Um tipo de ferramenta de artesão ou instrumento musical"],
        "skills_choice": {
          "choose": 2,
          "options": ["Acrobacia", "Atletismo", "Furtividade", "História", "Intuição", "Religião"]
        }
      },
      "starting_equipment": ["Espada curta ou Arma simples", "Pacote de masmorreiro ou Explorador", "10 Dardos"],
      "subclasses": [{ "name": "Caminho da Mão Aberta" }, { "name": "Caminho da Sombra" }, { "name": "Caminho dos Quatro Elementos" }]
    },
    {
      "name": "Paladino",
      "hit_die": "d10",
      "primary_ability": ["Força", "Carisma"],
      "saving_throws": ["Sabedoria", "Carisma"],
      "proficiencies": {
        "armor": ["Todas as armaduras", "Escudos"],
        "weapons": ["Armas simples", "Armas marciais"],
        "tools": [],
        "skills_choice": {
          "choose": 2,
          "options": ["Atletismo", "Intimidação", "Intuição", "Medicina", "Persuasão", "Religião"]
        }
      },
      "starting_equipment": ["Arma marcial e Escudo ou Duas armas marciais", "Cinco azagaias ou Arma simples corpo-a-corpo", "Pacote de sacerdote ou Explorador", "Cota de malha", "Símbolo sagrado"],
      "subclasses": [{ "name": "Juramento de Devoção" }, { "name": "Juramento dos Anciãos" }, { "name": "Juramento de Vingança" }]
    },
    {
      "name": "Patrulheiro",
      "hit_die": "d10",
      "primary_ability": ["Destreza", "Sabedoria"],
      "saving_throws": ["Força", "Destreza"],
      "proficiencies": {
        "armor": ["Armaduras leves", "Armaduras médias", "Escudos"],
        "weapons": ["Armas simples", "Armas marciais"],
        "tools": [],
        "skills_choice": {
          "choose": 3,
          "options": ["Adestrar Animais", "Atletismo", "Furtividade", "Intuição", "Investigação", "Natureza", "Percepção", "Sobrevivência"]
        }
      },
      "starting_equipment": ["Armadura de escala ou Couro", "Duas espadas curtas ou Duas armas simples corpo-a-corpo", "Pacote de masmorreiro ou Explorador", "Arco longo e 20 flechas"],
      "subclasses": [{ "name": "Cunhador" }, { "name": "Mestre das Feras" }]
    },
    {
      "name": "Artífice",
      "hit_die": "d8",
      "primary_ability": ["Inteligência"],
      "saving_throws": ["Constituição", "Inteligência"],
      "proficiencies": {
        "armor": ["Armaduras leves", "Armaduras médias", "Escudos"],
        "weapons": ["Armas simples", "Armas de fogo (opcional)"],
        "tools": ["Ferramentas de ladrão", "Ferramentas de funileiro", "Um tipo de ferramenta de artesão"],
        "skills_choice": {
          "choose": 2,
          "options": ["Arcanismo", "História", "Investigação", "Medicina", "Natureza", "Percepção", "Prestidigitação"]
        }
      },
      "starting_equipment": ["Duas armas simples", "Besta leve e 20 virotes", "Armadura de cravejada ou Escala", "Ferramentas de ladrão e Pacote de masmorreiro"],
      "subclasses": [{ "name": "Alquimista" }, { "name": "Armeiro" }, { "name": "Artilheiro" }, { "name": "Serralheiro de Combate" }]
    }
  ]
};
