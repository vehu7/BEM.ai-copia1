// Receitas brasileiras saudáveis com informações nutricionais

export interface BrazilianRecipe {
  id: string
  name: string
  description: string
  prepTime: number // minutos
  servings: number
  estimatedCost: string // em R$
  difficulty: 'fácil' | 'média' | 'difícil'
  tags: string[]
  ingredients: string[]
  instructions: string[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  tips?: string
}

export const BRAZILIAN_RECIPES: BrazilianRecipe[] = [
  {
    id: 'arroz-feijao-classico',
    name: 'Arroz com Feijão Clássico',
    description: 'Dupla brasileira perfeita: proteína completa e nutritiva',
    prepTime: 30,
    servings: 4,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Básico', 'Econômico', 'Proteína Completa', 'Vegano'],
    ingredients: [
      '2 xícaras de arroz integral',
      '1 xícara de feijão carioca (cozido)',
      '1 cebola pequena',
      '2 dentes de alho',
      '1 colher de sopa de óleo',
      'Sal a gosto'
    ],
    instructions: [
      'Refogue o alho e cebola no óleo',
      'Adicione o arroz e refogue por 2 minutos',
      'Adicione água (2,5x o volume do arroz) e sal',
      'Cozinhe em fogo baixo por 30-40 minutos (arroz integral)',
      'Para o feijão: refogue alho, adicione feijão cozido e tempere'
    ],
    nutrition: {
      calories: 380,
      protein: 14,
      carbs: 68,
      fat: 5,
      fiber: 12
    },
    tips: 'Arroz + feijão = proteína completa (aminoácidos essenciais). Cozinhe feijão em grande quantidade e congele em porções.'
  },
  {
    id: 'omelete-tapioca',
    name: 'Omelete com Tapioca',
    description: 'Café da manhã proteico e sem glúten',
    prepTime: 10,
    servings: 1,
    estimatedCost: 'R$ 3-5',
    difficulty: 'fácil',
    tags: ['Café da Manhã', 'Proteico', 'Sem Glúten', 'Rápido'],
    ingredients: [
      '2 ovos',
      '3 colheres de sopa de goma de tapioca',
      '1 fatia de queijo branco',
      'Tomate e orégano',
      'Sal a gosto'
    ],
    instructions: [
      'Bata os ovos com sal',
      'Em frigideira antiaderente, espalhe a tapioca',
      'Quando começar a grudar, vire',
      'Adicione os ovos mexidos por cima',
      'Finalize com queijo, tomate e orégano'
    ],
    nutrition: {
      calories: 285,
      protein: 22,
      carbs: 28,
      fat: 9,
      fiber: 2
    },
    tips: 'Ótimo pré ou pós-treino. Tapioca absorve rápido, ovos liberam proteína gradualmente.'
  },
  {
    id: 'frango-batata-doce',
    name: 'Frango Grelhado com Batata-Doce',
    description: 'Clássico da musculação brasileira',
    prepTime: 25,
    servings: 2,
    estimatedCost: 'R$ 10-15',
    difficulty: 'fácil',
    tags: ['Proteico', 'Ganho de Massa', 'Fitness'],
    ingredients: [
      '2 filés de frango (240g)',
      '2 batatas-doce médias',
      'Limão, alho e temperos',
      '1 colher de chá de azeite'
    ],
    instructions: [
      'Tempere o frango com limão, alho e sal (30min antes)',
      'Cozinhe as batatas-doce com casca (20min fervura ou 8min pressão)',
      'Grelhe o frango em frigideira antiaderente (5-7min cada lado)',
      'Sirva com salada verde'
    ],
    nutrition: {
      calories: 385,
      protein: 42,
      carbs: 38,
      fat: 6,
      fiber: 5
    },
    tips: 'Prepare vários filés de uma vez e congele. Batata-doce pode ser assada no forno (45min a 200°C) para textura mais cremosa.'
  },
  {
    id: 'vitamina-aveia-banana',
    name: 'Vitamina de Aveia com Banana',
    description: 'Energia rápida e sustentável para o dia',
    prepTime: 5,
    servings: 1,
    estimatedCost: 'R$ 2-4',
    difficulty: 'fácil',
    tags: ['Café da Manhã', 'Pré-Treino', 'Rápido', 'Vegetariano'],
    ingredients: [
      '1 banana madura',
      '3 colheres de sopa de aveia',
      '200ml de leite (ou vegetal)',
      '1 colher de chá de mel (opcional)',
      'Canela a gosto'
    ],
    instructions: [
      'Bata todos os ingredientes no liquidificador',
      'Adicione gelo se preferir gelado',
      'Beba imediatamente (aveia engrossa rápido)'
    ],
    nutrition: {
      calories: 285,
      protein: 12,
      carbs: 48,
      fat: 5,
      fiber: 7
    },
    tips: 'Ideal 30-60min antes do treino. Adicione pasta de amendoim (1 colher) para mais proteína e calorias.'
  },
  {
    id: 'salada-grao-de-bico',
    name: 'Salada de Grão-de-Bico',
    description: 'Proteína vegetal completa e refrescante',
    prepTime: 15,
    servings: 3,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Vegano', 'Proteico', 'Salada', 'Verão'],
    ingredients: [
      '1 lata de grão-de-bico (ou 1,5 xícara cozido)',
      '2 tomates',
      '1 pepino',
      '1/2 cebola roxa',
      'Suco de 1 limão',
      'Azeite, sal e hortelã'
    ],
    instructions: [
      'Escorra e lave o grão-de-bico',
      'Pique os vegetais em cubos pequenos',
      'Misture tudo',
      'Tempere com limão, azeite, sal e hortelã',
      'Deixe descansar 10min na geladeira'
    ],
    nutrition: {
      calories: 195,
      protein: 10,
      carbs: 28,
      fat: 5,
      fiber: 8
    },
    tips: 'Dura 3 dias na geladeira. Adicione atum para mais proteína ou sirva com pão integral.'
  },
  {
    id: 'escondidinho-frango',
    name: 'Escondidinho de Frango com Mandioca',
    description: 'Comfort food brasileiro mais saudável',
    prepTime: 40,
    servings: 6,
    estimatedCost: 'R$ 18-25',
    difficulty: 'média',
    tags: ['Almoço', 'Conforto', 'Freezer'],
    ingredients: [
      '500g de peito de frango desfiado',
      '800g de mandioca',
      '1 cebola',
      '2 tomates',
      '1 xícara de leite',
      '2 colheres de sopa de requeijão light',
      'Temperos: alho, sal, pimenta, cheiro-verde'
    ],
    instructions: [
      'Cozinhe e desfie o frango (tempere bem)',
      'Refogue cebola e tomate, adicione frango',
      'Cozinhe mandioca e amasse com leite e requeijão',
      'Monte: frango no fundo, purê de mandioca por cima',
      'Asse 20min a 180°C até dourar'
    ],
    nutrition: {
      calories: 285,
      protein: 24,
      carbs: 32,
      fat: 6,
      fiber: 3
    },
    tips: 'Congele em porções individuais. Substitua por batata-doce para menos carboidratos.'
  },
  {
    id: 'cuscuz-ovo',
    name: 'Cuscuz Nordestino com Ovo',
    description: 'Café da manhã regional nutritivo e econômico',
    prepTime: 15,
    servings: 2,
    estimatedCost: 'R$ 3-6',
    difficulty: 'fácil',
    tags: ['Café da Manhã', 'Regional', 'Econômico'],
    ingredients: [
      '1 xícara de flocos de milho para cuscuz',
      '1 xícara de água',
      '2 ovos',
      'Sal a gosto',
      'Manteiga (opcional)'
    ],
    instructions: [
      'Misture flocos de milho com água e sal',
      'Coloque na cuscuzeira e cozinhe 5-8min',
      'Enquanto isso, cozinhe os ovos (cozido ou mexido)',
      'Sirva o cuscuz com ovos e manteiga'
    ],
    nutrition: {
      calories: 275,
      protein: 16,
      carbs: 38,
      fat: 7,
      fiber: 4
    },
    tips: 'Sem cuscuzeira? Use uma peneira sobre água fervente. Adicione queijo coalho para mais proteína.'
  },
  {
    id: 'sopa-lentilha',
    name: 'Sopa de Lentilha com Legumes',
    description: 'Proteína vegetal, ferro e conforto',
    prepTime: 35,
    servings: 6,
    estimatedCost: 'R$ 10-15',
    difficulty: 'fácil',
    tags: ['Vegano', 'Conforto', 'Ferro', 'Inverno'],
    ingredients: [
      '2 xícaras de lentilha',
      '2 cenouras',
      '2 batatas',
      '1 cebola',
      '2 dentes de alho',
      '1 tomate',
      'Sal, cominho e pimenta'
    ],
    instructions: [
      'Refogue cebola e alho',
      'Adicione tomate e lentilha',
      'Adicione 1,5L de água e legumes picados',
      'Cozinhe 25-30min até lentilha amolecer',
      'Tempere e finalize com cheiro-verde'
    ],
    nutrition: {
      calories: 210,
      protein: 14,
      carbs: 36,
      fat: 2,
      fiber: 12
    },
    tips: 'Lentilha não precisa deixar de molho. Rico em ferro (consuma com suco de laranja para melhor absorção).'
  },
  {
    id: 'pudim-chia',
    name: 'Pudim de Chia com Frutas',
    description: 'Sobremesa saudável rica em ômega-3',
    prepTime: 10,
    servings: 2,
    estimatedCost: 'R$ 6-10',
    difficulty: 'fácil',
    tags: ['Sobremesa', 'Café da Manhã', 'Vegetariano', 'Ômega-3'],
    ingredients: [
      '4 colheres de sopa de chia',
      '300ml de leite (ou vegetal)',
      '1 colher de sopa de mel',
      'Frutas: manga, morango ou banana',
      'Canela'
    ],
    instructions: [
      'Misture chia, leite, mel e canela',
      'Deixe descansar 15min (mexa uma vez)',
      'Leve à geladeira por pelo menos 2h (ou overnight)',
      'Sirva com frutas picadas por cima'
    ],
    nutrition: {
      calories: 185,
      protein: 8,
      carbs: 22,
      fat: 7,
      fiber: 10
    },
    tips: 'Prepare à noite para café da manhã. Chia tem ômega-3, fibras e sacia muito. Dura 5 dias na geladeira.'
  },
  {
    id: 'farofa-proteica',
    name: 'Farofa Proteica com Ovos',
    description: 'Acompanhamento brasileiro rico em proteína',
    prepTime: 20,
    servings: 4,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Acompanhamento', 'Proteico', 'Regional'],
    ingredients: [
      '1 xícara de farinha de mandioca',
      '3 ovos',
      '1 cebola',
      '100g de bacon ou linguiça (opcional)',
      'Cheiro-verde',
      '1 colher de sopa de manteiga'
    ],
    instructions: [
      'Frite o bacon (se usar) até dourar',
      'Refogue a cebola na gordura',
      'Adicione os ovos e mexa até cozinhar',
      'Adicione farinha de mandioca aos poucos',
      'Finalize com cheiro-verde'
    ],
    nutrition: {
      calories: 245,
      protein: 12,
      carbs: 28,
      fat: 10,
      fiber: 2
    },
    tips: 'Versão mais leve: use apenas ovos e cebola. Adicione cenoura ralada e uvas-passas para versão adocicada.'
  },
  {
    id: 'wrap-frango-light',
    name: 'Wrap de Frango Light',
    description: 'Refeição rápida, proteica e portátil',
    prepTime: 10,
    servings: 1,
    estimatedCost: 'R$ 5-8',
    difficulty: 'fácil',
    tags: ['Rápido', 'Proteico', 'Almoço', 'Dieta', 'Fitness'],
    ingredients: [
      '1 tortilha integral',
      '100g de peito de frango grelhado (pré-cozido)',
      'Alface e tomate',
      '1 colher de sopa de iogurte natural',
      'Temperos: limão, sal, pimenta'
    ],
    instructions: [
      'Desfie ou corte o frango em tiras',
      'Aqueça a tortilha por 30 segundos',
      'Monte: alface, frango, tomate e iogurte',
      'Enrole como um burrito',
      'Pronto para comer!'
    ],
    nutrition: {
      calories: 320,
      protein: 35,
      carbs: 32,
      fat: 6,
      fiber: 5
    },
    tips: 'Prepare frangos grelhados no domingo para a semana toda. Substitua iogurte por guacamole para mais gorduras boas.'
  },
  {
    id: 'smoothie-proteico-verde',
    name: 'Smoothie Proteico Verde',
    description: 'Bebida nutritiva completa em 3 minutos',
    prepTime: 3,
    servings: 1,
    estimatedCost: 'R$ 4-7',
    difficulty: 'fácil',
    tags: ['Rápido', 'Café da Manhã', 'Vegetariano', 'Dieta', 'Detox'],
    ingredients: [
      '1 xícara de espinafre ou couve',
      '1/2 banana',
      '1 scoop de whey protein (ou 2 colheres de sopa de aveia)',
      '200ml de água ou leite',
      '1 colher de sopa de linhaça',
      'Gelo a gosto'
    ],
    instructions: [
      'Coloque todos os ingredientes no liquidificador',
      'Bata por 1 minuto até ficar homogêneo',
      'Beba imediatamente'
    ],
    nutrition: {
      calories: 245,
      protein: 28,
      carbs: 24,
      fat: 6,
      fiber: 8
    },
    tips: 'Espinafre não altera o sabor! Congele bananas maduras em pedaços para smoothies mais cremosos.'
  },
  {
    id: 'atum-abacate-rapido',
    name: 'Atum com Abacate Rápido',
    description: 'Proteína + gordura boa em 5 minutos',
    prepTime: 5,
    servings: 1,
    estimatedCost: 'R$ 6-10',
    difficulty: 'fácil',
    tags: ['Rápido', 'Proteico', 'Almoço', 'Lanche', 'Dieta', 'Ômega-3'],
    ingredients: [
      '1 lata de atum (em água)',
      '1/2 abacate',
      'Suco de 1/2 limão',
      'Tomate cereja',
      'Sal e pimenta',
      'Torradas integrais (opcional)'
    ],
    instructions: [
      'Escorra o atum',
      'Amasse o abacate com um garfo',
      'Misture atum, abacate e limão',
      'Tempere com sal e pimenta',
      'Sirva com tomates e torradas'
    ],
    nutrition: {
      calories: 285,
      protein: 28,
      carbs: 12,
      fat: 16,
      fiber: 7
    },
    tips: 'Atum tem ômega-3 e o abacate traz saciedade. Prepare em potes para levar ao trabalho.'
  },
  {
    id: 'iogurte-proteico-granola',
    name: 'Iogurte Proteico com Granola Caseira',
    description: 'Café da manhã nutritivo pronto em 2 minutos',
    prepTime: 2,
    servings: 1,
    estimatedCost: 'R$ 3-6',
    difficulty: 'fácil',
    tags: ['Rápido', 'Café da Manhã', 'Vegetariano', 'Proteico'],
    ingredients: [
      '200g de iogurte grego natural',
      '2 colheres de sopa de granola',
      '1 colher de sopa de mel',
      'Frutas vermelhas (morango, mirtilo)',
      '1 colher de sopa de castanhas picadas'
    ],
    instructions: [
      'Coloque o iogurte em uma tigela',
      'Adicione a granola por cima',
      'Regue com mel',
      'Finalize com frutas e castanhas'
    ],
    nutrition: {
      calories: 315,
      protein: 22,
      carbs: 36,
      fat: 10,
      fiber: 4
    },
    tips: 'Iogurte grego tem 2x mais proteína que o normal. Faça granola caseira (aveia + mel + forno) para economizar.'
  },
  {
    id: 'salada-caesar-light',
    name: 'Salada Caesar Proteica Light',
    description: 'Salada completa e saciante em 10 minutos',
    prepTime: 10,
    servings: 1,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Rápido', 'Proteico', 'Almoço', 'Dieta', 'Salada'],
    ingredients: [
      '2 xícaras de alface romana',
      '120g de frango grelhado',
      '2 colheres de sopa de parmesão ralado',
      '1 ovo cozido',
      'Molho: 1 colher de iogurte + mostarda + limão',
      'Croutons integrais (opcional)'
    ],
    instructions: [
      'Corte a alface em tiras',
      'Fatie o frango grelhado',
      'Prepare o molho misturando iogurte, mostarda e limão',
      'Monte a salada: alface + frango + ovo + parmesão',
      'Regue com o molho e adicione croutons'
    ],
    nutrition: {
      calories: 365,
      protein: 42,
      carbs: 18,
      fat: 14,
      fiber: 4
    },
    tips: 'Use frango assado de churrascaria para economizar tempo. Molho de iogurte é mais saudável que caesar tradicional.'
  },
  {
    id: 'omelete-microondas',
    name: 'Omelete no Micro-ondas',
    description: 'Proteína rápida em 3 minutos (sem fogão!)',
    prepTime: 3,
    servings: 1,
    estimatedCost: 'R$ 2-4',
    difficulty: 'fácil',
    tags: ['Rápido', 'Proteico', 'Café da Manhã', 'Lanche'],
    ingredients: [
      '2 ovos',
      '2 colheres de sopa de leite',
      'Queijo muçarela picado',
      'Tomate e orégano',
      'Sal e pimenta'
    ],
    instructions: [
      'Bata os ovos com leite, sal e pimenta em uma caneca de micro-ondas',
      'Adicione queijo e tomate picados',
      'Leve ao micro-ondas por 1min30s a 2min (potência alta)',
      'Deixe descansar 30 segundos',
      'Desenforme e sirva'
    ],
    nutrition: {
      calories: 245,
      protein: 20,
      carbs: 4,
      fat: 17,
      fiber: 1
    },
    tips: 'Perfeito para quem não tem tempo. Use canecas de vidro ou cerâmica (nunca metal). Varie os recheios!'
  },
  {
    id: 'pasta-atum-cottage',
    name: 'Pasta de Atum com Cottage',
    description: 'Lanche proteico em 5 minutos',
    prepTime: 5,
    servings: 2,
    estimatedCost: 'R$ 6-10',
    difficulty: 'fácil',
    tags: ['Rápido', 'Proteico', 'Lanche', 'Dieta'],
    ingredients: [
      '1 lata de atum',
      '4 colheres de sopa de queijo cottage',
      '1 colher de sopa de iogurte natural',
      'Cebolinha, sal e pimenta',
      'Biscoitos integrais ou vegetais crus'
    ],
    instructions: [
      'Escorra bem o atum',
      'Misture atum, cottage e iogurte',
      'Tempere com cebolinha, sal e pimenta',
      'Sirva com biscoitos integrais ou cenoura/pepino'
    ],
    nutrition: {
      calories: 165,
      protein: 26,
      carbs: 6,
      fat: 5,
      fiber: 2
    },
    tips: 'Perfeito para levar ao trabalho em pote. Cottage tem mais proteína e menos gordura que cream cheese.'
  },
  {
    id: 'crepioca-simples',
    name: 'Crepioca Express',
    description: 'Híbrido de crepe + tapioca em 5 minutos',
    prepTime: 5,
    servings: 1,
    estimatedCost: 'R$ 2-4',
    difficulty: 'fácil',
    tags: ['Rápido', 'Proteico', 'Café da Manhã', 'Sem Glúten'],
    ingredients: [
      '1 ovo',
      '2 colheres de sopa de tapioca',
      'Recheio: queijo, peito de peru, tomate',
      'Sal e orégano'
    ],
    instructions: [
      'Bata o ovo com a tapioca e sal',
      'Despeje em frigideira antiaderente quente',
      'Quando solidificar, adicione o recheio',
      'Dobre ao meio e sirva'
    ],
    nutrition: {
      calories: 235,
      protein: 16,
      carbs: 26,
      fat: 8,
      fiber: 1
    },
    tips: 'Sem frigideira? Faça no micro-ondas (1min30s). Versão doce: banana + canela + mel.'
  },
  {
    id: 'frango-quinoa-legumes',
    name: 'Frango Grelhado com Quinoa e Legumes',
    description: 'Refeição completa e equilibrada',
    prepTime: 20,
    servings: 1,
    estimatedCost: 'R$ 10-14',
    difficulty: 'fácil',
    tags: ['Básico', 'Proteico', 'Completa', 'Rápida'],
    ingredients: [
      '150g de filé de frango',
      '1/2 xícara de quinoa cozida',
      '1/2 xícara de brócolis cozido no vapor',
      '1/2 cenoura ralada',
      '1 colher de chá de azeite de oliva',
      'Sal, pimenta e ervas finas a gosto'
    ],
    instructions: [
      'Tempere o frango com sal, pimenta e ervas finas',
      'Grelhe o frango em uma frigideira antiaderente até dourar',
      'Cozinhe a quinoa conforme as instruções da embalagem',
      'Refogue os legumes no azeite rapidamente ou cozinhe no vapor',
      'Monte o prato com o frango, a quinoa e os legumes'
    ],
    nutrition: {
      calories: 350,
      protein: 35,
      carbs: 25,
      fat: 8,
      fiber: 5
    },
    tips: 'Quinoa é rica em proteína vegetal e aminoácidos essenciais. Prepare em maior quantidade e guarde para outras refeições.'
  },
  {
    id: 'tilapia-pure-abobora',
    name: 'Tilápia Assada com Purê de Abóbora',
    description: 'Peixe leve com acompanhamento nutritivo',
    prepTime: 25,
    servings: 1,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Básico', 'Econômico', 'Proteico', 'Rápida'],
    ingredients: [
      '150g de filé de tilápia',
      '1 colher de chá de azeite de oliva',
      'Suco de 1/2 limão',
      'Sal, pimenta e ervas finas a gosto',
      '1 xícara de abóbora cozida',
      '1 colher de sopa de leite desnatado'
    ],
    instructions: [
      'Tempere a tilápia com sal, pimenta, limão e ervas finas',
      'Asse em forno pré-aquecido a 200°C por 15-20 minutos',
      'Amasse a abóbora cozida e misture com o leite até formar um purê',
      'Sirva a tilápia com o purê como acompanhamento'
    ],
    nutrition: {
      calories: 280,
      protein: 30,
      carbs: 15,
      fat: 7,
      fiber: 3
    },
    tips: 'Abóbora é rica em vitamina A e fibras. A tilápia é uma opção de peixe econômica e rica em proteínas.'
  },
  {
    id: 'bowl-frango-arroz-feijao',
    name: 'Bowl de Frango com Arroz Integral e Feijão Preto',
    description: 'Bowl nutritivo e completo',
    prepTime: 30,
    servings: 1,
    estimatedCost: 'R$ 10-14',
    difficulty: 'fácil',
    tags: ['Completa', 'Econômico', 'Proteico'],
    ingredients: [
      '100g de peito de frango grelhado (em cubos ou desfiado)',
      '1/2 xícara de arroz integral cozido',
      '1/2 xícara de feijão preto cozido',
      '1 colher de chá de azeite de oliva',
      '1/2 xícara de couve refogada com alho'
    ],
    instructions: [
      'Grelhe o frango em cubos ou desfiado, temperando com sal, pimenta e páprica',
      'Cozinhe o arroz integral e o feijão preto separadamente',
      'Refogue a couve no azeite com alho',
      'Monte o bowl com o arroz, o feijão, o frango e a couve'
    ],
    nutrition: {
      calories: 400,
      protein: 38,
      carbs: 40,
      fat: 8,
      fiber: 8
    },
    tips: 'Arroz integral + feijão formam proteína completa. Prepare em maior quantidade no domingo para a semana.'
  },
  {
    id: 'carne-moida-abobrinha-batata-doce',
    name: 'Carne Moída com Abobrinha e Batata-Doce',
    description: 'Refeição balanceada e saborosa',
    prepTime: 25,
    servings: 1,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Básico', 'Econômico', 'Proteico', 'Rápida'],
    ingredients: [
      '150g de carne moída magra (patinho ou alcatra)',
      '1 colher de chá de azeite de oliva',
      '1 abobrinha pequena cortada em rodelas',
      '1 batata-doce média cozida e fatiada',
      'Sal, pimenta e cominho a gosto'
    ],
    instructions: [
      'Refogue a carne moída no azeite com sal, pimenta e cominho',
      'Grelhe as rodelas de abobrinha em uma frigideira antiaderente até dourar',
      'Sirva a carne moída com a abobrinha e a batata-doce como acompanhamento'
    ],
    nutrition: {
      calories: 350,
      protein: 32,
      carbs: 30,
      fat: 9,
      fiber: 4
    },
    tips: 'Batata-doce tem baixo índice glicêmico e fornece energia sustentável. Abobrinha é rica em fibras.'
  },
  {
    id: 'salmao-arroz-couve-flor',
    name: 'Salmão Grelhado com Arroz de Couve-Flor',
    description: 'Opção low-carb com ômega-3',
    prepTime: 20,
    servings: 1,
    estimatedCost: 'R$ 15-20',
    difficulty: 'fácil',
    tags: ['Básico', 'Proteico', 'Rápida', 'Ômega-3'],
    ingredients: [
      '150g de filé de salmão',
      '1 colher de chá de azeite de oliva',
      'Suco de 1/2 limão',
      'Sal e pimenta a gosto',
      '1 xícara de couve-flor ralada (ou processada)',
      '1 dente de alho picado'
    ],
    instructions: [
      'Tempere o salmão com sal, pimenta e limão',
      'Grelhe o salmão em uma frigideira antiaderente até dourar',
      'Refogue a couve-flor ralada no azeite com alho por 3-5 minutos',
      'Sirva o salmão com o "arroz" de couve-flor'
    ],
    nutrition: {
      calories: 320,
      protein: 35,
      carbs: 5,
      fat: 15,
      fiber: 2
    },
    tips: 'Salmão é rico em ômega-3 que ajuda na saúde cardiovascular. Couve-flor é uma ótima alternativa low-carb ao arroz.'
  },
  {
    id: 'frango-curry-leite-coco',
    name: 'Frango ao Curry com Leite de Coco e Arroz Integral',
    description: 'Sabor exótico e nutritivo',
    prepTime: 30,
    servings: 1,
    estimatedCost: 'R$ 12-16',
    difficulty: 'fácil',
    tags: ['Completa', 'Proteico', 'Econômico'],
    ingredients: [
      '150g de peito de frango cortado em cubos',
      '1 colher de chá de azeite de oliva',
      '1 colher de chá de curry em pó',
      '1/2 xícara de leite de coco light',
      '1/2 xícara de arroz integral cozido',
      '1 colher de sopa de coentro picado (opcional)'
    ],
    instructions: [
      'Refogue o frango no azeite até dourar',
      'Adicione o curry e misture bem',
      'Acrescente o leite de coco e cozinhe por mais 5 minutos',
      'Sirva o frango ao curry com o arroz integral e finalize com coentro, se desejar'
    ],
    nutrition: {
      calories: 400,
      protein: 36,
      carbs: 35,
      fat: 12,
      fiber: 4
    },
    tips: 'Curry é anti-inflamatório natural. Use leite de coco light para reduzir calorias sem perder sabor.'
  },
  {
    id: 'omelete-espinafre-cottage',
    name: 'Omelete Recheada com Espinafre e Queijo Cottage',
    description: 'Café da manhã proteico e leve',
    prepTime: 15,
    servings: 1,
    estimatedCost: 'R$ 5-8',
    difficulty: 'fácil',
    tags: ['Básico', 'Econômico', 'Rápida', 'Proteico'],
    ingredients: [
      '3 ovos inteiros',
      '1 xícara de espinafre refogado',
      '2 colheres de sopa de queijo cottage',
      'Sal e pimenta a gosto'
    ],
    instructions: [
      'Bata os ovos e tempere com sal e pimenta',
      'Aqueça uma frigideira antiaderente e despeje os ovos batidos',
      'Adicione o espinafre refogado e o queijo cottage por cima',
      'Dobre ao meio e cozinhe até firmar'
    ],
    nutrition: {
      calories: 250,
      protein: 22,
      carbs: 3,
      fat: 15,
      fiber: 1
    },
    tips: 'Espinafre é rico em ferro e vitaminas. Cottage tem alta proteína e baixa gordura.'
  },
  {
    id: 'almondegas-frango-molho-tomate',
    name: 'Almôndegas de Frango com Molho de Tomate',
    description: 'Proteína magra em formato divertido',
    prepTime: 30,
    servings: 2,
    estimatedCost: 'R$ 10-15',
    difficulty: 'fácil',
    tags: ['Básico', 'Econômico', 'Proteico'],
    ingredients: [
      '300g de peito de frango moído',
      '1 clara de ovo',
      '2 colheres de sopa de farelo de aveia',
      'Sal, pimenta e orégano a gosto',
      '1 xícara de molho de tomate caseiro'
    ],
    instructions: [
      'Misture o frango moído com a clara, o farelo de aveia e os temperos até formar uma massa homogênea',
      'Modele bolinhas e coloque-as em uma panela com o molho de tomate',
      'Cozinhe em fogo baixo por 15-20 minutos, mexendo ocasionalmente',
      'Sirva com arroz integral, purê de batata-doce ou legumes'
    ],
    nutrition: {
      calories: 300,
      protein: 40,
      carbs: 15,
      fat: 8,
      fiber: 3
    },
    tips: 'Prepare em quantidade e congele porções individuais. Farelo de aveia ajuda a dar liga sem adicionar gordura.'
  },
  {
    id: 'omelete-claras-frango',
    name: 'Omelete de Claras com Frango Desfiado',
    description: 'Alta proteína e baixa gordura',
    prepTime: 10,
    servings: 1,
    estimatedCost: 'R$ 5-8',
    difficulty: 'fácil',
    tags: ['Básico', 'Rápida', 'Proteico'],
    ingredients: [
      '4 claras de ovo',
      '1 ovo inteiro',
      '100g de frango desfiado (cozido ou grelhado)',
      '1 colher de sopa de queijo cottage ou ricota',
      'Sal e pimenta a gosto',
      'Cebolinha picada (opcional)'
    ],
    instructions: [
      'Bata as claras e o ovo inteiro em uma tigela, adicionando sal e pimenta',
      'Aqueça uma frigideira antiaderente e despeje a mistura de ovos',
      'Adicione o frango desfiado e o queijo cottage por cima',
      'Cozinhe em fogo baixo até firmar e dobre ao meio',
      'Finalize com cebolinha picada'
    ],
    nutrition: {
      calories: 200,
      protein: 30,
      carbs: 2,
      fat: 5,
      fiber: 0
    },
    tips: 'Perfeito para quem quer maximizar proteína. Use frango sobras de outras refeições.'
  },
  {
    id: 'panqueca-banana-whey',
    name: 'Panqueca de Banana com Whey Protein',
    description: 'Café da manhã proteico e doce',
    prepTime: 15,
    servings: 1,
    estimatedCost: 'R$ 4-7',
    difficulty: 'fácil',
    tags: ['Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '1 banana madura',
      '2 claras de ovo',
      '1 scoop de whey protein (sabor baunilha ou neutro)',
      '1 colher de sopa de aveia (opcional)'
    ],
    instructions: [
      'Amasse a banana e misture com as claras, o whey e a aveia até formar uma massa homogênea',
      'Aqueça uma frigideira antiaderente e despeje pequenas porções da massa',
      'Cozinhe por 2 minutos de cada lado ou até dourar',
      'Sirva com pasta de amendoim ou iogurte natural por cima'
    ],
    nutrition: {
      calories: 250,
      protein: 20,
      carbs: 25,
      fat: 5,
      fiber: 3
    },
    tips: 'Banana madura deixa mais doce naturalmente. Prepare a massa na noite anterior para café da manhã rápido.'
  },
  {
    id: 'bowl-atum-abacate',
    name: 'Bowl de Atum com Abacate',
    description: 'Lanche rápido rico em ômega-3',
    prepTime: 10,
    servings: 1,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Básico', 'Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '1 lata de atum em água (escorrido)',
      '1/2 abacate amassado',
      '1 colher de sopa de azeite de oliva',
      'Suco de 1/2 limão',
      'Sal, pimenta e páprica a gosto',
      '1 colher de sopa de salsinha ou coentro picado'
    ],
    instructions: [
      'Misture o atum com o abacate em uma tigela',
      'Tempere com azeite, limão, sal, pimenta e páprica',
      'Finalize com salsinha ou coentro',
      'Sirva com torradas integrais ou como recheio de wraps'
    ],
    nutrition: {
      calories: 300,
      protein: 25,
      carbs: 5,
      fat: 18,
      fiber: 4
    },
    tips: 'Atum tem ômega-3 e o abacate traz gorduras boas. Prepare em potes para levar ao trabalho.'
  },
  {
    id: 'tacos-alface-carne',
    name: 'Tacos de Alface com Carne Moída',
    description: 'Opção low-carb e criativa',
    prepTime: 15,
    servings: 1,
    estimatedCost: 'R$ 6-10',
    difficulty: 'fácil',
    tags: ['Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '200g de carne moída magra (patinho ou frango moído)',
      '1 colher de chá de azeite',
      '1 dente de alho picado',
      'Sal, pimenta e cominho a gosto',
      'Folhas grandes de alface americana',
      '1 colher de sopa de iogurte natural (opcional)'
    ],
    instructions: [
      'Refogue a carne moída no azeite com alho e os temperos',
      'Lave bem as folhas de alface e use-as como "tacos"',
      'Recheie as folhas com a carne moída e finalize com iogurte natural, se desejar'
    ],
    nutrition: {
      calories: 280,
      protein: 30,
      carbs: 5,
      fat: 10,
      fiber: 2
    },
    tips: 'Alface substitui tortilha reduzindo carboidratos. Adicione tomate e cebola picados para mais sabor.'
  },
  {
    id: 'shake-proteico-pos-treino',
    name: 'Shake Proteico Pós-Treino',
    description: 'Recuperação muscular rápida',
    prepTime: 5,
    servings: 1,
    estimatedCost: 'R$ 5-8',
    difficulty: 'fácil',
    tags: ['Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '1 scoop de whey protein (sabor de sua preferência)',
      '200ml de leite desnatado ou bebida vegetal (amêndoa, coco, etc.)',
      '1 colher de sopa de pasta de amendoim',
      '1/2 banana congelada',
      'Gelo a gosto'
    ],
    instructions: [
      'Bata todos os ingredientes no liquidificador até ficar cremoso',
      'Sirva imediatamente'
    ],
    nutrition: {
      calories: 250,
      protein: 30,
      carbs: 10,
      fat: 5,
      fiber: 1
    },
    tips: 'Consuma até 30 minutos após o treino para melhor absorção. Banana congelada deixa cremoso sem precisar de sorvete.'
  },
  {
    id: 'muffin-ovo-legumes',
    name: 'Muffin de Ovo com Legumes',
    description: 'Café da manhã prático para a semana',
    prepTime: 20,
    servings: 4,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Econômico', 'Rápida', 'Proteico'],
    ingredients: [
      '4 ovos inteiros',
      '1/2 xícara de peito de frango desfiado ou presunto magro picado',
      '1/2 xícara de legumes picados (cenoura, brócolis, abobrinha)',
      'Sal e pimenta a gosto'
    ],
    instructions: [
      'Bata os ovos e misture com o frango e os legumes',
      'Tempere com sal e pimenta',
      'Despeje a mistura em formas de muffin ou em forminhas de silicone',
      'Asse em forno pré-aquecido a 180°C por 15-20 minutos'
    ],
    nutrition: {
      calories: 150,
      protein: 6,
      carbs: 2,
      fat: 8,
      fiber: 1
    },
    tips: 'Prepare vários no domingo e guarde na geladeira. Aqueça no micro-ondas para café da manhã rápido durante a semana.'
  },
  {
    id: 'chips-grao-de-bico',
    name: 'Chips de Grão-de-Bico Crocante',
    description: 'Snack saudável e crocante',
    prepTime: 30,
    servings: 2,
    estimatedCost: 'R$ 4-7',
    difficulty: 'fácil',
    tags: ['Vegano', 'Econômico', 'Lanche'],
    ingredients: [
      '1 xícara de grão-de-bico cozido',
      '1 colher de sopa de azeite de oliva',
      '1/2 colher de chá de páprica defumada',
      '1/2 colher de chá de alho em pó',
      'Sal e pimenta a gosto'
    ],
    instructions: [
      'Seque bem o grão-de-bico com papel toalha para retirar o excesso de umidade',
      'Misture o grão-de-bico com o azeite, a páprica, o alho em pó, o sal e a pimenta',
      'Espalhe o grão-de-bico temperado em uma assadeira, formando uma camada única',
      'Asse em forno pré-aquecido a 200°C por 20-30 minutos, mexendo de vez em quando, até que os grãos fiquem crocantes',
      'Deixe esfriar antes de servir'
    ],
    nutrition: {
      calories: 200,
      protein: 10,
      carbs: 20,
      fat: 5,
      fiber: 6
    },
    tips: 'Substitui salgadinhos industrializados. Varie os temperos: curry, ervas finas ou pimenta caiena.'
  },
  {
    id: 'smoothie-proteico-morango',
    name: 'Smoothie Proteico de Morango',
    description: 'Bebida refrescante e proteica',
    prepTime: 5,
    servings: 1,
    estimatedCost: 'R$ 5-8',
    difficulty: 'fácil',
    tags: ['Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '1 scoop de whey protein (sabor baunilha ou morango)',
      '200ml de leite desnatado ou bebida vegetal (amêndoa, coco, etc.)',
      '1/2 xícara de morangos congelados',
      '1 colher de chá de chia ou linhaça (opcional)',
      'Gelo a gosto'
    ],
    instructions: [
      'Bata todos os ingredientes no liquidificador até obter uma textura cremosa',
      'Sirva imediatamente em um copo gelado'
    ],
    nutrition: {
      calories: 200,
      protein: 25,
      carbs: 10,
      fat: 3,
      fiber: 2
    },
    tips: 'Morangos congelados deixam mais cremoso e dispensam gelo. Chia adiciona ômega-3 e fibras.'
  },
  {
    id: 'tofu-grelhado-gergelim',
    name: 'Tofu Grelhado com Molho de Soja e Gergelim',
    description: 'Proteína vegetal versátil',
    prepTime: 15,
    servings: 1,
    estimatedCost: 'R$ 6-10',
    difficulty: 'fácil',
    tags: ['Vegano', 'Econômico'],
    ingredients: [
      '200g de tofu firme',
      '1 colher de sopa de molho de soja (shoyu light)',
      '1 colher de chá de azeite de oliva',
      '1 colher de chá de gergelim torrado',
      'Cebolinha picada a gosto'
    ],
    instructions: [
      'Corte o tofu em fatias ou cubos',
      'Aqueça uma frigideira antiaderente com azeite e grelhe o tofu até dourar dos dois lados',
      'Regue com o molho de soja e finalize com gergelim e cebolinha',
      'Sirva com arroz integral ou legumes cozidos no vapor'
    ],
    nutrition: {
      calories: 250,
      protein: 20,
      carbs: 5,
      fat: 15,
      fiber: 2
    },
    tips: 'Pressione o tofu com papel toalha antes de grelhar para retirar água e deixar mais crocante.'
  },
  {
    id: 'espetinhos-carne-vegetais',
    name: 'Espetinhos de Carne com Vegetais',
    description: 'Proteína grelhada com legumes',
    prepTime: 20,
    servings: 2,
    estimatedCost: 'R$ 12-18',
    difficulty: 'fácil',
    tags: ['Rápida', 'Proteico', 'Econômico'],
    ingredients: [
      '200g de carne magra (patinho, alcatra ou filé de frango) cortada em cubos',
      '1/2 pimentão (verde, vermelho ou amarelo) cortado em pedaços',
      '1/2 cebola cortada em pedaços',
      'Sal, pimenta e ervas finas a gosto',
      'Palitos de churrasco'
    ],
    instructions: [
      'Tempere os cubos de carne com sal, pimenta e ervas finas',
      'Monte os espetinhos alternando carne, pimentão e cebola',
      'Grelhe em uma frigideira antiaderente ou churrasqueira até o ponto desejado',
      'Sirva com molho de iogurte ou salada'
    ],
    nutrition: {
      calories: 300,
      protein: 25,
      carbs: 5,
      fat: 10,
      fiber: 2
    },
    tips: 'Deixe a carne marinando por 30 minutos para mais sabor. Vegetais grelhados são ricos em antioxidantes.'
  },
  {
    id: 'salada-grao-bico-ovo-frango',
    name: 'Salada de Grão-de-Bico com Ovo e Frango',
    description: 'Salada completa e saciante',
    prepTime: 20,
    servings: 1,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Completa', 'Econômico'],
    ingredients: [
      '1 xícara de grão-de-bico cozido',
      '100g de peito de frango grelhado e desfiado',
      '2 ovos cozidos (picados)',
      '1/2 xícara de tomate-cereja cortado ao meio',
      '1 colher de sopa de azeite de oliva',
      'Suco de 1/2 limão',
      'Sal, pimenta e orégano a gosto'
    ],
    instructions: [
      'Misture o grão-de-bico, o frango, os ovos e o tomate em uma tigela',
      'Tempere com azeite, limão, sal, pimenta e orégano',
      'Sirva como prato principal ou acompanhamento'
    ],
    nutrition: {
      calories: 350,
      protein: 30,
      carbs: 25,
      fat: 10,
      fiber: 6
    },
    tips: 'Proteína completa em uma salada! Prepare para marmita adicionando o molho somente na hora de comer.'
  },
  {
    id: 'hamburguer-frango-fit',
    name: 'Hambúrguer de Frango Fit',
    description: 'Versão saudável do hambúrguer',
    prepTime: 20,
    servings: 2,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Básico', 'Econômico', 'Proteico'],
    ingredients: [
      '200g de peito de frango moído',
      '1 colher de sopa de farelo de aveia',
      '1 dente de alho picado',
      'Sal, pimenta e páprica defumada a gosto',
      '1 colher de sopa de salsinha picada'
    ],
    instructions: [
      'Misture todos os ingredientes até formar uma massa homogênea',
      'Molde hambúrgueres no tamanho desejado',
      'Grelhe em uma frigideira antiaderente até dourar dos dois lados',
      'Sirva com salada ou pão integral'
    ],
    nutrition: {
      calories: 200,
      protein: 25,
      carbs: 3,
      fat: 5,
      fiber: 1
    },
    tips: 'Congele porções individuais para ter sempre à mão. Farelo de aveia dá liga e adiciona fibras.'
  },
  {
    id: 'wrap-ovo-atum',
    name: 'Wrap de Ovo com Recheio de Atum',
    description: 'Lanche proteico e criativo',
    prepTime: 15,
    servings: 1,
    estimatedCost: 'R$ 5-8',
    difficulty: 'fácil',
    tags: ['Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '2 ovos inteiros',
      '1 lata de atum em água (escorrido)',
      '1 colher de sopa de iogurte natural ou maionese light',
      'Sal e pimenta a gosto',
      'Folhas de alface e rodelas de tomate'
    ],
    instructions: [
      'Bata os ovos e faça uma "panqueca" fina em uma frigideira antiaderente. Reserve',
      'Misture o atum com o iogurte, sal e pimenta',
      'Recheie a panqueca de ovo com o atum, alface e tomate',
      'Enrole como um wrap e sirva'
    ],
    nutrition: {
      calories: 250,
      protein: 30,
      carbs: 2,
      fat: 10,
      fiber: 1
    },
    tips: 'Perfeito para levar na marmita. A base de ovo substitui o pão reduzindo carboidratos.'
  },
  {
    id: 'arroz-couve-flor-carne',
    name: 'Arroz de Couve-Flor com Carne',
    description: 'Opção low-carb nutritiva',
    prepTime: 20,
    servings: 1,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Básico', 'Econômico', 'Proteico'],
    ingredients: [
      '1 xícara de couve-flor ralada (ou processada)',
      '150g de carne moída magra (patinho ou alcatra)',
      '1 colher de chá de azeite de oliva',
      '1 dente de alho picado',
      'Sal, pimenta e cominho a gosto'
    ],
    instructions: [
      'Refogue a carne moída no azeite com alho e temperos até dourar. Reserve',
      'Na mesma frigideira, refogue a couve-flor ralada por 3-5 minutos, até ficar macia',
      'Misture a carne moída com a couve-flor e sirva como substituto de arroz'
    ],
    nutrition: {
      calories: 300,
      protein: 35,
      carbs: 8,
      fat: 10,
      fiber: 3
    },
    tips: 'Couve-flor tem apenas 25 calorias por xícara. Ótima opção para reduzir carboidratos sem perder volume.'
  },
  {
    id: 'crepioca-frango',
    name: 'Crepioca de Frango',
    description: 'Café da manhã ou lanche proteico',
    prepTime: 15,
    servings: 1,
    estimatedCost: 'R$ 4-7',
    difficulty: 'fácil',
    tags: ['Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '1 ovo inteiro',
      '1 clara de ovo',
      '1 colher de sopa de tapioca',
      '50g de frango desfiado',
      '1 colher de sopa de queijo cottage ou ricota',
      'Sal e pimenta a gosto'
    ],
    instructions: [
      'Misture o ovo, a clara e a tapioca até formar uma massa homogênea',
      'Aqueça uma frigideira antiaderente e despeje a massa, espalhando bem',
      'Adicione o frango desfiado e o queijo por cima',
      'Dobre ao meio e cozinhe por mais 1-2 minutos'
    ],
    nutrition: {
      calories: 250,
      protein: 28,
      carbs: 10,
      fat: 6,
      fiber: 1
    },
    tips: 'Use sobras de frango grelhado. Cottage adiciona cremosidade e proteína extra.'
  },
  {
    id: 'salmao-espinafre',
    name: 'Salmão Grelhado com Espinafre Refogado',
    description: 'Refeição rica em ômega-3 e ferro',
    prepTime: 20,
    servings: 1,
    estimatedCost: 'R$ 15-20',
    difficulty: 'fácil',
    tags: ['Completa', 'Proteico'],
    ingredients: [
      '150g de filé de salmão',
      '1 colher de chá de azeite de oliva',
      'Suco de 1/2 limão',
      'Sal e pimenta a gosto',
      '1 xícara de espinafre fresco',
      '1 dente de alho picado'
    ],
    instructions: [
      'Tempere o salmão com sal, pimenta e limão',
      'Grelhe em uma frigideira antiaderente com azeite por 3-4 minutos de cada lado',
      'Na mesma frigideira, refogue o alho e o espinafre até murchar',
      'Sirva o salmão com o espinafre como acompanhamento'
    ],
    nutrition: {
      calories: 320,
      protein: 35,
      carbs: 3,
      fat: 15,
      fiber: 2
    },
    tips: 'Salmão + espinafre = ômega-3 + ferro. Combinação perfeita para saúde cardiovascular e energia.'
  },
  {
    id: 'pate-cottage-atum',
    name: 'Patê de Cottage com Atum',
    description: 'Lanche rápido e proteico',
    prepTime: 10,
    servings: 2,
    estimatedCost: 'R$ 6-10',
    difficulty: 'fácil',
    tags: ['Básica', 'Rápida', 'Econômico', 'Proteico'],
    ingredients: [
      '1 lata de atum em água (escorrido)',
      '3 colheres de sopa de queijo cottage',
      '1 colher de chá de azeite de oliva',
      'Suco de 1/2 limão',
      'Sal, pimenta e ervas finas a gosto'
    ],
    instructions: [
      'Misture todos os ingredientes em uma tigela até formar um patê',
      'Sirva com torradas integrais, palitos de cenoura ou como recheio de sanduíches'
    ],
    nutrition: {
      calories: 150,
      protein: 15,
      carbs: 2,
      fat: 5,
      fiber: 0
    },
    tips: 'Cottage tem mais proteína e menos gordura que cream cheese. Perfeito para lanches rápidos.'
  },
  {
    id: 'abobrinha-recheada-carne',
    name: 'Abobrinha Recheada com Carne Moída',
    description: 'Prato completo e criativo',
    prepTime: 30,
    servings: 2,
    estimatedCost: 'R$ 8-12',
    difficulty: 'fácil',
    tags: ['Completa', 'Econômico'],
    ingredients: [
      '1 abobrinha média',
      '150g de carne moída magra',
      '1 colher de chá de azeite de oliva',
      '1 dente de alho picado',
      'Sal, pimenta e orégano a gosto',
      '1 colher de sopa de queijo parmesão ralado (opcional)'
    ],
    instructions: [
      'Corte a abobrinha ao meio no sentido do comprimento e retire o miolo com uma colher',
      'Refogue a carne moída no azeite com alho e temperos',
      'Recheie as metades da abobrinha com a carne e polvilhe o queijo parmesão por cima',
      'Asse em forno pré-aquecido a 200°C por 20 minutos'
    ],
    nutrition: {
      calories: 280,
      protein: 25,
      carbs: 10,
      fat: 8,
      fiber: 3
    },
    tips: 'Use o miolo da abobrinha picado na carne moída para não desperdiçar. Congela bem!'
  },
  {
    id: 'iogurte-proteico-sementes',
    name: 'Iogurte Proteico com Sementes e Frutas',
    description: 'Café da manhã completo e nutritivo',
    prepTime: 5,
    servings: 1,
    estimatedCost: 'R$ 5-8',
    difficulty: 'fácil',
    tags: ['Rápida', 'Proteico'],
    ingredients: [
      '1 pote de iogurte natural ou grego (sem açúcar)',
      '1 scoop de whey protein (sabor baunilha ou neutro)',
      '1 colher de sopa de chia ou linhaça',
      '1/2 xícara de frutas picadas (morango, mirtilo ou banana)',
      '1 colher de chá de mel (opcional)'
    ],
    instructions: [
      'Misture o whey protein com o iogurte até ficar homogêneo',
      'Adicione as frutas, a chia ou linhaça e finalize com mel, se desejar',
      'Sirva como café da manhã ou lanche'
    ],
    nutrition: {
      calories: 200,
      protein: 20,
      carbs: 15,
      fat: 3,
      fiber: 3
    },
    tips: 'Chia absorve líquido e aumenta a saciedade. Prepare na noite anterior (overnight) para textura cremosa.'
  }
]

// Filtros disponíveis
export const RECIPE_FILTERS = {
  tags: [
    'Básico',
    'Econômico',
    'Rápido',
    'Proteico',
    'Vegano',
    'Vegetariano',
    'Sem Glúten',
    'Café da Manhã',
    'Almoço',
    'Jantar',
    'Lanche',
    'Sobremesa',
    'Pré-Treino',
    'Pós-Treino',
    'Conforto',
    'Verão',
    'Inverno',
    'Regional',
    'Fitness',
    'Ganho de Massa',
    'Dieta',
    'Detox',
    'Ômega-3'
  ],
  difficulty: ['fácil', 'média', 'difícil']
}
