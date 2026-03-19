import React from 'react';
import { 
  Shield, 
  Music, 
  Zap, 
  Flame, 
  Trees, 
  Swords, 
  Skull, 
  Ghost, 
  Compass, 
  Star,
  BookOpen
} from 'lucide-react';

export interface Subclass {
  name: string;
  description: string;
}

export interface Ability {
  name: string;
  level: number;
  description: string;
}

export interface ClassData {
  name: string;
  description: string;
  subclassesName: string;
  subclasses: Subclass[];
  abilities: Ability[];
  icon: React.ElementType;
  color: string;
}

export const classData: ClassData[] = [
  {
    name: 'Bárbaro',
    description: 'Um guerreiro selvagem que canaliza sua fúria em ataques devastadores e possui uma resistência sobrenatural a ferimentos.',
    subclassesName: 'Caminho Primitivo',
    icon: Flame,
    color: 'from-orange-600 to-red-700',
    subclasses: [
      { name: 'Caminho do Furioso', description: 'Foca na fúria pura, permitindo ataques extras e imunidade a medo enquanto enfurecido.' },
      { name: 'Caminho do Guerreiro Totêmico', description: 'Busca a orientação de espíritos animais (Urso, Águia, Lobo) para obter resistências e habilidades especiais.' }
    ],
    abilities: [
      { name: 'Fúria', level: 1, description: 'Em batalha, você luta com uma ferocidade primitiva. No seu turno, você pode entrar em fúria como uma ação bônus.' },
      { name: 'Defesa Sem Armadura', level: 1, description: 'Enquanto não estiver usando armadura, sua CA será 10 + Destreza + Constituição.' },
      { name: 'Ataque Descuidado', level: 2, description: 'Você pode abandonar toda a preocupação com a defesa para atacar com fúria desesperada.' },
      { name: 'Sentido de Perigo', level: 2, description: 'Você ganha uma percepção sobrenatural de quando as coisas não são o que parecem por perto.' },
      { name: 'Caminho Primitivo', level: 3, description: 'Você escolhe um caminho que molda a natureza da sua fúria.' }
    ]
  },
  {
    name: 'Bardo',
    description: 'Um mestre da música e da magia que utiliza sons e canções para inspirar seus aliados e manipular a realidade.',
    subclassesName: 'Colégios Bárdicos',
    icon: Music,
    color: 'from-purple-500 to-indigo-600',
    subclasses: [
      { name: 'Colégio do Conhecimento', description: 'Bardos que buscam a verdade em todos os lugares, ganhando mais perícias e magias de outras classes.' },
      { name: 'Colégio da Bravura', description: 'Bardos guerreiros que inspiram seus aliados no meio da batalha e podem usar armaduras médias e armas marciais.' }
    ],
    abilities: [
      { name: 'Inspiração Bárdica', level: 1, description: 'Você pode inspirar os outros através de palavras ou música. Use uma ação bônus para dar um dado de inspiração a um aliado.' },
      { name: 'Conjuração', level: 1, description: 'Você aprendeu a moldar o tecido da realidade de acordo com seus desejos e música.' },
      { name: 'Versatilidade', level: 2, description: 'Você pode adicionar metade do seu bônus de proficiência a qualquer teste de perícia que você não seja proficiente.' },
      { name: 'Canção de Descanso', level: 2, description: 'Você pode usar música ou oração calmantes para ajudar a revitalizar seus aliados feridos durante um descanso curto.' },
      { name: 'Colégio Bárdico', level: 3, description: 'Você escolhe um colégio onde aprimora suas artes e conhecimentos.' }
    ]
  },
  {
    name: 'Bruxo',
    description: 'Um buscador de conhecimentos ocultos que faz pactos com entidades poderosas para obter poderes extraordinários.',
    subclassesName: 'Patronos Transcendentais',
    icon: Skull,
    color: 'from-slate-700 to-slate-900',
    subclasses: [
      { name: 'A Arquifada', description: 'Pacto com uma criatura das fadas, focando em encantos, ilusões e truques mentais.' },
      { name: 'O Corruptor', description: 'Pacto com um demônio ou diabo, focado em destruição por fogo e vitalidade extra ao matar inimigos.' },
      { name: 'O Grande Antigo', description: 'Pacto com uma entidade cósmica, garantindo telepatia e controle sobre as mentes alheias.' }
    ],
    abilities: [
      { name: 'Patrono Transcendental', level: 1, description: 'Você faz um pacto com uma entidade de outro mundo que lhe concede poderes em troca de serviços.' },
      { name: 'Magia de Pacto', level: 1, description: 'Sua pesquisa arcana e a magia concedida pelo seu patrono lhe deram facilidade com magias.' },
      { name: 'Invocações Arcanas', level: 2, description: 'Você descobriu invocações arcanas, fragmentos de conhecimentos proibidos que imbuem você com uma capacidade mágica duradoura.' },
      { name: 'Dádiva do Pacto', level: 3, description: 'Seu patrono lhe concede uma recompensa por seus serviços fiéis.' }
    ]
  },
  {
    name: 'Clérigo',
    description: 'Um agente divino que atua como intermediário entre o mundo mortal e os deuses, curando aliados ou punindo infiéis.',
    subclassesName: 'Domínios Divinos',
    icon: Shield,
    color: 'from-amber-400 to-yellow-600',
    subclasses: [
      { name: 'Vida', description: 'Especialista em cura e preservação, garantindo bônus em todas as magias de recuperação de vida.' },
      { name: 'Luz', description: 'Focado no poder do sol e do fogo, punindo inimigos com magias radiantes e chamas.' },
      { name: 'Guerra', description: 'Clérigos combatentes que utilizam armas e armaduras pesadas para servir seus deuses no campo de batalha.' },
      { name: 'Enganação', description: 'Seguidores de deuses da trapaça, usando ilusões e furtividade para confundir oponentes.' }
    ],
    abilities: [
      { name: 'Domínio Divino', level: 1, description: 'Você escolhe um domínio relacionado à sua divindade.' },
      { name: 'Conjuração', level: 1, description: 'Como um canal para o poder divino, você pode conjurar magias de clérigo.' },
      { name: 'Canalizar Divindade', level: 2, description: 'Você ganha a habilidade de canalizar energia divina diretamente de sua divindade para alimentar efeitos mágicos.' },
      { name: 'Melhoria no Valor de Atributo', level: 4, description: 'Aumente um valor de atributo à sua escolha em 2, ou dois em 1.' }
    ]
  },
  {
    name: 'Druida',
    description: 'Um guardião da natureza que pode adotar formas animais e convocar forças elementais.',
    subclassesName: 'Círculos Druídicos',
    icon: Trees,
    color: 'from-green-600 to-emerald-800',
    subclasses: [
      { name: 'Círculo da Terra', description: 'Focado na conjuração de magias e na conexão com um terreno específico (Ártico, Deserto, Floresta, etc.).' },
      { name: 'Círculo da Lua', description: 'Especialista em Transformação Selvagem, permitindo assumir formas de feras muito mais poderosas em combate.' }
    ],
    abilities: [
      { name: 'Druídico', level: 1, description: 'Você conhece o Druídico, o idioma secreto dos druidas.' },
      { name: 'Conjuração', level: 1, description: 'Utilizando a essência divina da própria natureza, você pode conjurar magias.' },
      { name: 'Forma Selvagem', level: 2, description: 'Você pode usar sua ação para assumir magicamente a forma de uma fera que você já tenha visto antes.' },
      { name: 'Círculo Druídico', level: 2, description: 'Você escolhe a qual círculo de druidas você pertence.' }
    ]
  },
  {
    name: 'Feiticeiro',
    description: 'Um conjurador nato cuja magia provém de sua linhagem ou de um evento cósmico.',
    subclassesName: 'Origens de Feitiçaria',
    icon: Zap,
    color: 'from-cyan-400 to-blue-600',
    subclasses: [
      { name: 'Linhagem Dracônica', description: 'O poder do sangue de dragão corre em suas veias, garantindo maior resistência e afinidade com elementos.' },
      { name: 'Magia Selvagem', description: 'Sua magia é instável e caótica, podendo gerar efeitos imprevisíveis toda vez que você conjura um feitiço.' }
    ],
    abilities: [
      { name: 'Origem Feiticeira', level: 1, description: 'Escolha uma origem feiticeira, que descreve a fonte do seu poder mágico inato.' },
      { name: 'Conjuração', level: 1, description: 'Um evento no seu passado deixou uma marca em você, infundindo-o com poder mágico.' },
      { name: 'Fontes de Magia', level: 2, description: 'Você toca em uma fonte interna de magia. Essa fonte é representada por pontos de feitiçaria.' },
      { name: 'Metamagia', level: 3, description: 'Você ganha a habilidade de moldar suas magias para atender às suas necessidades.' }
    ]
  },
  {
    name: 'Guerreiro',
    description: 'Um especialista em combate e táticas marciais, mestre no uso de todas as armas e armaduras.',
    subclassesName: 'Arquétipos Marciais',
    icon: Swords,
    color: 'from-gray-600 to-gray-800',
    subclasses: [
      { name: 'Campeão', description: 'Foca na excelência física pura, aumentando suas chances de acertos críticos e proezas atléticas.' },
      { name: 'Mestre da Batalha', description: 'Um estrategista que usa manobras especiais para controlar o campo de batalha e ajudar aliados.' },
      { name: 'Cavaleiro Arcano', description: 'Combina habilidades marciais com magias de abjuração e evocação para se tornar uma ameaça versátil.' }
    ],
    abilities: [
      { name: 'Estilo de Luta', level: 1, description: 'Você adota um estilo particular de luta como sua especialidade (Arquearia, Combate com Duas Armas, etc).' },
      { name: 'Retomada de Fôlego', level: 1, description: 'Você possui uma reserva limitada de resistência que pode usar para proteger a si mesmo de danos (1d10 + nível de guerreiro).' },
      { name: 'Surto de Ação', level: 2, description: 'Você pode forçar o seu limite por um momento. No seu turno, você pode realizar uma ação adicional.' },
      { name: 'Arquétipo Marcial', level: 3, description: 'Você escolhe um arquétipo que se esforça para seguir no seu domínio das artes do combate.' },
      { name: 'Melhoria no Valor de Atributo', level: 4, description: 'Você pode aumentar um valor de atributo à sua escolha em 2, ou dois valores em 1.' },
      { name: 'Ataque Extra', level: 5, description: 'Você pode atacar duas vezes, ao invés de uma, sempre que realizar a ação de Ataque no seu turno.' }
    ]
  },
  {
    name: 'Ladino',
    description: 'Um mestre da furtividade e da perícia que utiliza a astúcia para obter vantagem sobre os inimigos.',
    subclassesName: 'Arquétipos de Ladino',
    icon: Ghost,
    color: 'from-indigo-800 to-purple-950',
    subclasses: [
      { name: 'Ladrão', description: 'Especialista em infiltração e uso rápido de objetos, além de ser extremamente ágil.' },
      { name: 'Assassino', description: 'Mestre no disfarce e em golpes fatais quando pega o inimigo desprevenido.' },
      { name: 'Trapaceiro Arcano', description: 'Utiliza ilusões e magias sutis para auxiliar em seus furtos e enganar oponentes.' }
    ],
    abilities: [
      { name: 'Ataque Furtivo', level: 1, description: 'Você sabe como atingir sutilmente e explorar a distração de um oponente (Dano extra se tiver vantagem).' },
      { name: 'Gíria de Ladrão', level: 1, description: 'Você conhece a gíria de ladrão, uma mistura de dialetos, gírias e códigos que permite esconder mensagens.' },
      { name: 'Ação Ardilosa', level: 2, description: 'Sua prontidão permite que você se mova e aja rapidamente. Você pode usar uma ação bônus para Correr, Desengajar ou Esconder.' },
      { name: 'Arquétipo de Ladino', level: 3, description: 'Você escolhe um arquétipo que emula o seu exercício de suas habilidades de ladino.' },
      { name: 'Melhoria no Valor de Atributo', level: 4, description: 'Você pode aumentar um valor de atributo à sua escolha em 2, ou dois valores em 1.' },
      { name: 'Esquiva Sobrenatural', level: 5, description: 'Quando um atacante que você pode ver atinge você com um ataque, você pode usar sua reação para reduzir o dano pela metade.' }
    ]
  },
  {
    name: 'Mago',
    description: 'Um estudioso da magia que dedica sua vida à compreensão das leis do multiverso.',
    subclassesName: 'Tradições Arcanas',
    icon: BookOpen,
    color: 'from-blue-700 to-blue-900',
    subclasses: [
      { name: 'Evocação', description: 'Especialista em criar efeitos de energia destrutiva, garantindo que aliados não sejam atingidos por suas explosões.' },
      { name: 'Abjuração', description: 'Focado em proteção e banimento, criando barreiras mágicas para absorver dano.' },
      { name: 'Ilusão', description: 'Mestre em enganar os sentidos, criando imagens e sons que parecem reais para quem os vê.' }
    ],
    abilities: [
      { name: 'Recuperação Arcana', level: 1, description: 'Você aprendeu a recuperar um pouco de sua energia mágica através do estudo do seu livro de magias.' },
      { name: 'Conjuração', level: 1, description: 'Você pode conjurar magias de mago. Você possui um livro de magias que contém suas fórmulas mágicas.' },
      { name: 'Tradição Arcana', level: 2, description: 'Você escolhe uma tradição arcana, moldando sua prática de magia através de uma das oito escolas.' },
      { name: 'Melhoria no Valor de Atributo', level: 4, description: 'Você pode aumentar um valor de atributo à sua escolha em 2, ou dois valores em 1.' },
      { name: 'Domínio de Magia', level: 18, description: 'Você atinge tamanho domínio sobre certas magias que pode conjurá-las à vontade.' }
    ]
  },
  {
    name: 'Monge',
    description: 'Um artista marcial que canaliza sua energia interior (Ki) para realizar feitos de agilidade incrível.',
    subclassesName: 'Tradições Monásticas',
    icon: Zap,
    color: 'from-orange-400 to-amber-600',
    subclasses: [
      { name: 'Caminho da Mão Aberta', description: 'Mestre no combate desarmado, capaz de derrubar ou empurrar inimigos com golpes de Ki.' },
      { name: 'Caminho da Sombra', description: 'Utiliza o Ki para se teleportar entre sombras e realizar atos de furtividade mágica.' },
      { name: 'Caminho dos Quatro Elementos', description: 'Canaliza o Ki para controlar o fogo, ar, terra e água como extensões de seu corpo.' }
    ],
    abilities: [
      { name: 'Defesa Sem Armadura', level: 1, description: 'Sua CA é 10 + Destreza + Sabedoria se não usar armadura ou escudo.' },
      { name: 'Artes Marciais', level: 1, description: 'Sua prática de artes marciais concede maestria no combate desarmado e com armas de monge.' },
      { name: 'Ki', level: 2, description: 'Você pode acessar uma reserva mística de energia chamada Ki, que permite realizar diversos feitos.' },
      { name: 'Movimento Sem Armadura', level: 2, description: 'Sua velocidade aumenta em 3 metros enquanto você não estiver usando armadura ou escudo.' },
      { name: 'Tradição Monástica', level: 3, description: 'Você escolhe uma tradição monástica para seguir em sua jornada espiritual.' }
    ]
  },
  {
    name: 'Paladino',
    description: 'Um guerreiro sagrado que faz juramentos solenes para servir como campeão da justiça.',
    subclassesName: 'Juramentos Sagrados',
    icon: Star,
    color: 'from-yellow-500 to-amber-700',
    subclasses: [
      { name: 'Juramento de Devoção', description: 'O paladino clássico, focado na justiça, virtude e proteção dos inocentes.' },
      { name: 'Juramento dos Anciões', description: 'Um guardião da luz e da alegria no mundo, conectado à natureza e à beleza.' },
      { name: 'Juramento da Vingança', description: 'Focado em punir criminosos e aniquilar aqueles que cruzaram o caminho da justiça.' }
    ],
    abilities: [
      { name: 'Sentido Divino', level: 1, description: 'A presença de um mal terrível ofende seus sentidos. Você pode detectar celestiais, fiéis ou mortos-vivos.' },
      { name: 'Mãos Curadoras', level: 1, description: 'Seu toque abençoado pode curar ferimentos. Você possui uma reserva de poder curativo que se regenera após um descanso longo.' },
      { name: 'Estilo de Luta', level: 2, description: 'Você adota um estilo de luta particular como sua especialidade.' },
      { name: 'Destruição Divina', level: 2, description: 'Quando você atinge uma criatura com um ataque corpo-a-corpo, você pode gastar um espaço de magia para causar dano radiante extra.' },
      { name: 'Juramento Sagrado', level: 3, description: 'Você faz um juramento que o liga para sempre à causa da justiça.' }
    ]
  },
  {
    name: 'Patrulheiro',
    description: 'Um mestre da sobrevivência e da caça que protege as fronteiras contra ameaças selvagens.',
    subclassesName: 'Arquétipos de Patrulheiro',
    icon: Compass,
    color: 'from-emerald-700 to-green-900',
    subclasses: [
      { name: 'Caçador', description: 'Especialista em enfrentar ameaças específicas, como hordas de inimigos ou gigantes poderosos.' },
      { name: 'Mestre das Bestas', description: 'Forma um vínculo sobrenatural com um companheiro animal que luta ao seu lado.' }
    ],
    abilities: [
      { name: 'Inimigo Favorito', level: 1, description: 'Você possui uma experiência significativa no estudo, rastreamento e até mesmo na conversa com um tipo específico de inimigo.' },
      { name: 'Explorador Natural', level: 1, description: 'Você é familiarizado com um tipo específico de ambiente natural e é adepto de viajar e sobreviver em tais regiões.' },
      { name: 'Estilo de Luta', level: 2, description: 'Você adota um estilo de luta particular como sua especialidade.' },
      { name: 'Consciência Primal', level: 3, description: 'Você pode usar sua ação e gastar um espaço de magia para focar sua consciência na região ao seu redor.' }
    ]
  }
];
