export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  style: string;
  icon: string;
  description: string;
  openingNarration: string;
  /** Primeira mensagem que o Mestre IA envia assim que a campanha começa */
  startMessage: string;
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'maldição_do_rei_morto',
    title: 'A Maldição do Rei Morto',
    subtitle: 'Épico • Horror Gótico',
    style: 'Sombrio',
    icon: '💀',
    description:
      'O reino de Valdoria está sendo consumido por uma névoa maldita. O Rei Aldric, morto há décadas, despertou como um lich poderoso e está erguendo seus exércitos mortos-vivos. Vocês foram convocados como a última esperança.',
    openingNarration:
      'A Maldição do Rei Morto — Capítulo I: A Névoa Carmesim',
    startMessage:
      'INÍCIO DE CAMPANHA: A Maldição do Rei Morto. Apresente a abertura épica da campanha, descrevendo a vila de Shadowfen coberta por uma névoa vermelha, cadáveres que se movem pelas ruas e um ancião sobrevivente que tenta alertar os heróis sobre o Rei Lich Aldric. Termine pedindo ao jogador como ele reage ao ver a névoa chegar.',
  },
  {
    id: 'tesouro_do_mar_tempestuoso',
    title: 'O Tesouro do Mar Tempestuoso',
    subtitle: 'Épico • Aventura Marítima',
    style: 'Épico',
    icon: '🏴‍☠️',
    description:
      'Um mapa rasgado leva ao lendário galeão El Dracão Dourado, afundado há 300 anos com um tesouro capaz de comprar reinos inteiros. Mas piratas, sereias e tempestades mágicas guardam os segredos das profundezas.',
    openingNarration:
      'O Tesouro do Mar Tempestuoso — Capítulo I: O Mapa Rasgado',
    startMessage:
      'INÍCIO DE CAMPANHA: O Tesouro do Mar Tempestuoso. Narre a cena de abertura: o herói está na Taverna do Porto Enferrujado, em Saltpool, quando um marinheiro moribundo cai à sua mesa segurando metade de um mapa com coordenadas de um tesouro. Descreva o porto, o cheiro de maresia, outros piratas curiosos de longe e o moribundo que sussurra "El Dracão... é real". Termine pedindo ao jogador o que ele faz.',
  },
  {
    id: 'floresta_dos_fae',
    title: 'A Floresta dos Fae',
    subtitle: 'Fantástico • Mistério',
    style: 'Épico',
    icon: '🌿',
    description:
      'Crianças estão desaparecendo perto da Floresta de Arenvale. Os aldeões dizem que os Fae — seres mágicos da natureza — estão levando-as. Mas a verdade pode ser mais sombria, ou mais mágica, do que qualquer um imagina.',
    openingNarration:
      'A Floresta dos Fae — Capítulo I: O Choro na Neblina',
    startMessage:
      'INÍCIO DE CAMPANHA: A Floresta dos Fae. Narre a chegada do herói à pequena aldeia de Millhaven: casas com janelas trancadas, rostos assustados, e a prefeita Elara — uma elfa envelhecida — pedindo ajuda urgente. Três crianças desapareceram na última semana. Ao anoitecer, risos infantis são ouvidos vindo da floresta. Descreva a cena atmosférica e pergunte ao jogador como ele se aproxima da floresta.',
  },
  {
    id: 'dungeon_do_mago_louco',
    title: 'A Dungeon do Mago Louco',
    subtitle: 'Clássico • Exploração',
    style: 'Épico',
    icon: '🧙',
    description:
      'A Torre de Marvex, o arquimago que enlouqueceu séculos atrás, ressurgiu do nada no centro do deserto. Cheia de armadilhas, puzzles mágicos e monstros bizarros, promete riquezas inimagináveis para quem chegar ao topo.',
    openingNarration:
      'A Dungeon do Mago Louco — Piso 1: O Salão das Ilusões',
    startMessage:
      'INÍCIO DE CAMPANHA: A Dungeon do Mago Louco. Narre a chegada à Torre de Marvex: uma estrutura absurda de 50 andares que desafia a gravidade, com janelas em ângulos impossíveis e luzes coloridas piscando no interior. Na entrada, um gárgula de pedra acorda e diz: "Bem-vindo ao Teste de Marvex. Sobreviventes ganham tudo. Tolos ganham uma lápide divertida." Descreva o primeiro andar — um salão de espelhos onde as imagens refletidas se movem independentemente — e pergunte ao jogador como ele entra.',
  },
  {
    id: 'guerra_dos_dragões',
    title: 'A Guerra dos Dragões',
    subtitle: 'Épico • Batalha em Larga Escala',
    style: 'Battle Royale',
    icon: '🐉',
    description:
      'Dois dragões ancestrais — Ignarax o Vermelho e Crystaria a Azul — declararam guerra, e os reinos mortais estão no meio-fio. Vocês foram recrutados para uma missão impossível: encontrar o Ovo Primordial que pode encerrar a guerra.',
    openingNarration:
      'A Guerra dos Dragões — Capítulo I: Cinzas do Horizonte',
    startMessage:
      'INÍCIO DE CAMPANHA: A Guerra dos Dragões. Narre a cena de abertura dramática: o herói está no acampamento do Exército da Aliança quando o horizonte se ilumina — a cidade de Ironhold está em chamas, atacada por Ignarax. O General Theron convoca os melhores exploradores para uma missão suicida: infiltrar o covil do dragão para roubar informações sobre o Ovo Primordial. Descreva o barulho das asas, o calor das chamas ao longe e o olhar desesperado dos soldados. Pergunte ao jogador se ele aceita a missão.',
  },
  {
    id: 'mistério_da_cidade',
    title: 'O Mistério de Ravenport',
    subtitle: 'Investigação • Noir Fantástico',
    style: 'Sombrio',
    icon: '🔍',
    description:
      'Na cidade portuária de Ravenport, nobres estão sendo encontrados mortos com um símbolo misterioso gravado na pele. A Guarda da Cidade está perdida. Apenas um detetive corajoso — ou louco — pode desvendar a conspiração.',
    openingNarration:
      'O Mistério de Ravenport — Caso I: A Marca do Corvo',
    startMessage:
      'INÍCIO DE CAMPANHA: O Mistério de Ravenport. Narre a cena de abertura: madrugada chuvosa, o herói é acordado por um mensageiro da Guarda com um envelope lacrado. Dentro, uma convocação urgente do Capitão Harrow para a mansão Blackthorn, onde o terceiro nobre em duas semanas foi encontrado morto. A cena do crime tem um corvo negro pintado na parede com sangue. Descreva o clima noir, a chuva nas ruas de paralelepípedo e o nervosismo incomum dos guardas. Pergunte ao jogador como ele chega à mansão.',
  },
];
