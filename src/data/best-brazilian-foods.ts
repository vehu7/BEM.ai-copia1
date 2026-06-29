// Melhores alimentos brasileiros por categoria

export interface BestFoodCategory {
  category: string
  icon: string
  description: string
  foods: {
    name: string
    benefits: string
    portion: string
    costLevel: 'baixo' | 'médio' | 'alto'
  }[]
}

export const BEST_BRAZILIAN_FOODS: BestFoodCategory[] = [
  {
    category: 'Grãos Integrais',
    icon: '🌾',
    description: 'Ricos em fibras e energia sustentável',
    foods: [
      {
        name: 'Arroz integral',
        benefits: 'Fibras, vitaminas B, saciedade prolongada',
        portion: '4 colheres de sopa (100g)',
        costLevel: 'baixo'
      },
      {
        name: 'Aveia',
        benefits: 'Beta-glucana para colesterol, fibras solúveis',
        portion: '3 colheres de sopa (30g)',
        costLevel: 'baixo'
      },
      {
        name: 'Quinoa',
        benefits: 'Proteína completa, sem glúten',
        portion: '3 colheres de sopa (50g)',
        costLevel: 'alto'
      }
    ]
  },
  {
    category: 'Leguminosas',
    icon: '🫘',
    description: 'Proteína vegetal acessível e completa',
    foods: [
      {
        name: 'Feijão (preto, carioca, vermelho)',
        benefits: 'Ferro, proteína, fibras, combinação perfeita com arroz',
        portion: '1 concha média (86g)',
        costLevel: 'baixo'
      },
      {
        name: 'Lentilha',
        benefits: 'Cozinha rápido, rica em ferro e folato',
        portion: '3 colheres de sopa (90g)',
        costLevel: 'baixo'
      },
      {
        name: 'Grão-de-bico',
        benefits: 'Proteína, versatilidade (hummus, saladas)',
        portion: '3 colheres de sopa (80g)',
        costLevel: 'médio'
      }
    ]
  },
  {
    category: 'Raízes e Tubérculos',
    icon: '🥔',
    description: 'Carboidratos complexos e vitaminas',
    foods: [
      {
        name: 'Batata-doce',
        benefits: 'Vitamina A, baixo índice glicêmico',
        portion: '1 unidade média (150g)',
        costLevel: 'baixo'
      },
      {
        name: 'Mandioca (aipim)',
        benefits: 'Energia, sem glúten, muito versátil',
        portion: '2 pedaços médios (100g)',
        costLevel: 'baixo'
      },
      {
        name: 'Inhame',
        benefits: 'Digestivo, anti-inflamatório natural',
        portion: '1 unidade média (100g)',
        costLevel: 'baixo'
      }
    ]
  },
  {
    category: 'Proteínas Animais',
    icon: '🍗',
    description: 'Essenciais para massa muscular',
    foods: [
      {
        name: 'Ovos',
        benefits: 'Proteína completa, colina, muito versáteis',
        portion: '2 unidades',
        costLevel: 'baixo'
      },
      {
        name: 'Peito de frango',
        benefits: 'Alto teor proteico, baixa gordura',
        portion: '1 filé médio (120g)',
        costLevel: 'médio'
      },
      {
        name: 'Sardinha em conserva',
        benefits: 'Ômega-3, cálcio (com espinhas), vitamina D',
        portion: '1 lata (130g)',
        costLevel: 'baixo'
      },
      {
        name: 'Músculo/Patinho',
        benefits: 'Ferro heme, proteína de qualidade',
        portion: '1 bife pequeno (100g)',
        costLevel: 'médio'
      }
    ]
  },
  {
    category: 'Frutas Nacionais',
    icon: '🍊',
    description: 'Vitaminas e antioxidantes regionais',
    foods: [
      {
        name: 'Banana',
        benefits: 'Potássio, energia rápida, prebióticos',
        portion: '1 unidade média',
        costLevel: 'baixo'
      },
      {
        name: 'Laranja/Mexerica',
        benefits: 'Vitamina C, fibras (se comer a polpa)',
        portion: '1 unidade',
        costLevel: 'baixo'
      },
      {
        name: 'Mamão',
        benefits: 'Papaína digestiva, vitamina A',
        portion: '1 fatia média (100g)',
        costLevel: 'baixo'
      },
      {
        name: 'Goiaba',
        benefits: 'Mais vitamina C que laranja, fibras',
        portion: '1 unidade média',
        costLevel: 'baixo'
      },
      {
        name: 'Açaí (polpa pura)',
        benefits: 'Antioxidantes, energia (sem açúcar adicionado)',
        portion: '100g polpa pura',
        costLevel: 'médio'
      }
    ]
  },
  {
    category: 'Verduras e Legumes',
    icon: '🥬',
    description: 'Micronutrientes essenciais',
    foods: [
      {
        name: 'Couve',
        benefits: 'Cálcio vegetal, ferro, vitamina K',
        portion: '2 folhas picadas',
        costLevel: 'baixo'
      },
      {
        name: 'Tomate',
        benefits: 'Licopeno (coração), vitamina C',
        portion: '1 unidade média',
        costLevel: 'baixo'
      },
      {
        name: 'Cenoura',
        benefits: 'Betacaroteno (visão), versátil',
        portion: '1 unidade média',
        costLevel: 'baixo'
      },
      {
        name: 'Abóbora',
        benefits: 'Vitamina A, fibras, baixa caloria',
        portion: '2 colheres de sopa (80g)',
        costLevel: 'baixo'
      }
    ]
  },
  {
    category: 'Laticínios',
    icon: '🥛',
    description: 'Cálcio e proteína',
    foods: [
      {
        name: 'Iogurte natural',
        benefits: 'Probióticos, proteína, cálcio',
        portion: '1 pote (170g)',
        costLevel: 'médio'
      },
      {
        name: 'Queijo minas frescal',
        benefits: 'Proteína, cálcio, menos gordura',
        portion: '2 fatias (50g)',
        costLevel: 'médio'
      },
      {
        name: 'Leite (integral ou desnatado)',
        benefits: 'Cálcio, vitamina D (fortificado)',
        portion: '1 copo (200ml)',
        costLevel: 'médio'
      }
    ]
  },
  {
    category: 'Oleaginosas',
    icon: '🥜',
    description: 'Gorduras boas em pequenas porções',
    foods: [
      {
        name: 'Amendoim',
        benefits: 'Proteína vegetal, vitamina E, acessível',
        portion: '1 punhado (30g)',
        costLevel: 'baixo'
      },
      {
        name: 'Castanha-do-pará',
        benefits: 'Selênio (1-2/dia suficiente), antioxidante',
        portion: '2 unidades',
        costLevel: 'médio'
      }
    ]
  }
]

// Dicas de compra inteligente
export const SMART_SHOPPING_TIPS = [
  {
    title: 'Compre da safra',
    description: 'Frutas e verduras da época custam até 50% menos e têm mais nutrientes'
  },
  {
    title: 'Ovos: proteína acessível',
    description: 'Uma das melhores fontes de proteína completa pelo menor custo'
  },
  {
    title: 'Leguminosas são aliadas',
    description: 'Feijões, lentilhas, grão-de-bico: proteína vegetal barata, nutritiva e versátil'
  },
  {
    title: 'Congele em porções',
    description: 'Compre proteínas e vegetais em quantidade e congele — economiza tempo e dinheiro'
  },
  {
    title: 'Mercados e feiras locais',
    description: 'Geralmente mais baratos que supermercados e com produtos mais frescos'
  },
  {
    title: 'Prefira integrais',
    description: 'Alimentos integrais (aveia, arroz integral, pão integral) têm mais fibras e saciam mais'
  },
  {
    title: 'Evite ultraprocessados',
    description: 'Biscoitos, embutidos e refeições prontas custam mais caro e oferecem menos nutrição'
  }
]
