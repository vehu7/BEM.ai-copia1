import type { FoodSubstitution } from '@/types'

/**
 * Lista de substituições inteligentes de alimentos
 * Permite que o usuário flexibilize o cardápio mantendo valores nutricionais similares
 */
export const FOOD_SUBSTITUTIONS: FoodSubstitution[] = [
  {
    original: 'Arroz branco',
    substitutes: [
      { name: 'Arroz integral', portion: '100g', calories: 123, protein: 2.6, carbs: 25.8, fat: 1, notes: 'Mais fibras e nutrientes' },
      { name: 'Quinoa', portion: '100g', calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, notes: 'Rica em proteínas' },
      { name: 'Macarrão integral', portion: '100g', calories: 124, protein: 5, carbs: 26, fat: 0.9, notes: 'Boa fonte de fibras' },
      { name: 'Batata doce', portion: '100g', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, notes: 'Baixo índice glicêmico' },
      { name: 'Mandioca cozida', portion: '100g', calories: 125, protein: 0.8, carbs: 30.1, fat: 0.3, notes: 'Sem glúten' }
    ]
  },
  {
    original: 'Frango grelhado',
    substitutes: [
      { name: 'Peito de peru', portion: '100g', calories: 111, protein: 24, carbs: 0, fat: 1.7, notes: 'Baixo teor de gordura' },
      { name: 'Filé de tilápia', portion: '100g', calories: 96, protein: 20.1, carbs: 0, fat: 1.7, notes: 'Rico em ômega-3' },
      { name: 'Atum em água', portion: '100g', calories: 116, protein: 25.5, carbs: 0, fat: 0.8, notes: 'Prático e proteico' },
      { name: 'Tofu', portion: '100g', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, notes: 'Opção vegetariana' },
      { name: 'Ovos cozidos', portion: '2 unidades', calories: 155, protein: 13, carbs: 1.1, fat: 10.6, notes: 'Versátil e nutritivo' }
    ]
  },
  {
    original: 'Pão francês',
    substitutes: [
      { name: 'Pão integral', portion: '2 fatias (50g)', calories: 120, protein: 5, carbs: 23, fat: 1.5, notes: 'Mais fibras' },
      { name: 'Tapioca', portion: '1 unidade (50g)', calories: 70, protein: 0.1, carbs: 18, fat: 0, notes: 'Sem glúten' },
      { name: 'Pão de aveia', portion: '2 fatias (50g)', calories: 130, protein: 6, carbs: 22, fat: 2, notes: 'Rica em beta-glucanas' },
      { name: 'Batata doce', portion: '100g', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, notes: 'Carboidrato complexo' },
      { name: 'Crepioca', portion: '1 unidade', calories: 150, protein: 8, carbs: 18, fat: 5, notes: 'Proteica e prática' }
    ]
  },
  {
    original: 'Leite integral',
    substitutes: [
      { name: 'Leite desnatado', portion: '200ml', calories: 68, protein: 6.8, carbs: 9.8, fat: 0.4, notes: 'Baixo teor de gordura' },
      { name: 'Leite de amêndoas', portion: '200ml', calories: 30, protein: 1, carbs: 1, fat: 2.5, notes: 'Opção vegana' },
      { name: 'Leite de aveia', portion: '200ml', calories: 80, protein: 2, carbs: 14, fat: 2, notes: 'Rico em fibras' },
      { name: 'Iogurte natural', portion: '170g', calories: 97, protein: 5.3, carbs: 7.4, fat: 5.1, notes: 'Probióticos' },
      { name: 'Leite de coco', portion: '200ml', calories: 45, protein: 0.4, carbs: 1.5, fat: 4.5, notes: 'Sem lactose' }
    ]
  },
  {
    original: 'Feijão preto',
    substitutes: [
      { name: 'Feijão carioca', portion: '100g', calories: 77, protein: 4.8, carbs: 13.6, fat: 0.5, notes: 'Tradicional brasileiro' },
      { name: 'Lentilha', portion: '100g', calories: 116, protein: 9, carbs: 20.1, fat: 0.4, notes: 'Rica em ferro' },
      { name: 'Grão-de-bico', portion: '100g', calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, notes: 'Versátil' },
      { name: 'Ervilha', portion: '100g', calories: 81, protein: 5.4, carbs: 14.5, fat: 0.4, notes: 'Leve e nutritiva' },
      { name: 'Soja cozida', portion: '100g', calories: 141, protein: 12.4, carbs: 11.1, fat: 6.2, notes: 'Alta em proteína' }
    ]
  },
  {
    original: 'Banana',
    substitutes: [
      { name: 'Maçã', portion: '1 unidade (130g)', calories: 68, protein: 0.3, carbs: 18.2, fat: 0.2, notes: 'Rica em fibras' },
      { name: 'Pera', portion: '1 unidade (150g)', calories: 87, protein: 0.5, carbs: 23.3, fat: 0.2, notes: 'Digestiva' },
      { name: 'Mamão papaya', portion: '1 fatia (100g)', calories: 43, protein: 0.5, carbs: 10.8, fat: 0.1, notes: 'Rica em vitamina C' },
      { name: 'Manga', portion: '1 unidade pequena (150g)', calories: 90, protein: 0.8, carbs: 22.9, fat: 0.3, notes: 'Doce e nutritiva' },
      { name: 'Melancia', portion: '1 fatia (200g)', calories: 60, protein: 1.2, carbs: 15.2, fat: 0.2, notes: 'Hidratante' }
    ]
  },
  {
    original: 'Azeite de oliva',
    substitutes: [
      { name: 'Óleo de coco', portion: '1 colher (10ml)', calories: 90, protein: 0, carbs: 0, fat: 10, notes: 'Resistente ao calor' },
      { name: 'Óleo de abacate', portion: '1 colher (10ml)', calories: 88, protein: 0, carbs: 0, fat: 10, notes: 'Rico em ômega-9' },
      { name: 'Abacate amassado', portion: '2 colheres (30g)', calories: 48, protein: 0.6, carbs: 2.6, fat: 4.4, notes: 'Gordura saudável' },
      { name: 'Manteiga ghee', portion: '1 colher (10g)', calories: 90, protein: 0, carbs: 0, fat: 10, notes: 'Sem lactose' },
      { name: 'Pasta de amendoim', portion: '1 colher (15g)', calories: 95, protein: 4, carbs: 3.5, fat: 8, notes: 'Proteica' }
    ]
  },
  {
    original: 'Alface',
    substitutes: [
      { name: 'Rúcula', portion: '1 xícara (40g)', calories: 10, protein: 1, carbs: 1.5, fat: 0.3, notes: 'Sabor marcante' },
      { name: 'Espinafre', portion: '1 xícara (40g)', calories: 9, protein: 1.2, carbs: 1.4, fat: 0.2, notes: 'Rico em ferro' },
      { name: 'Couve', portion: '1 xícara (40g)', calories: 17, protein: 1.4, carbs: 3.3, fat: 0.2, notes: 'Super nutritiva' },
      { name: 'Agrião', portion: '1 xícara (40g)', calories: 5, protein: 0.8, carbs: 0.4, fat: 0, notes: 'Refrescante' },
      { name: 'Acelga', portion: '1 xícara (40g)', calories: 8, protein: 0.8, carbs: 1.5, fat: 0.1, notes: 'Versátil' }
    ]
  },
  {
    original: 'Iogurte natural',
    substitutes: [
      { name: 'Iogurte grego', portion: '170g', calories: 100, protein: 10, carbs: 6, fat: 3.5, notes: 'Mais proteína' },
      { name: 'Coalhada', portion: '170g', calories: 70, protein: 4.5, carbs: 6, fat: 2.8, notes: 'Digestiva' },
      { name: 'Kefir', portion: '170g', calories: 85, protein: 5, carbs: 7, fat: 3.5, notes: 'Probiótico potente' },
      { name: 'Leite fermentado', portion: '170g', calories: 90, protein: 4, carbs: 12, fat: 2, notes: 'Bom para intestino' },
      { name: 'Iogurte de coco', portion: '170g', calories: 80, protein: 1, carbs: 8, fat: 5, notes: 'Opção vegana' }
    ]
  },
  {
    original: 'Queijo minas',
    substitutes: [
      { name: 'Queijo cottage', portion: '50g', calories: 52, protein: 6.5, carbs: 1.5, fat: 2, notes: 'Baixa gordura' },
      { name: 'Ricota', portion: '50g', calories: 86, protein: 5.5, carbs: 1.5, fat: 6.5, notes: 'Leve e cremosa' },
      { name: 'Queijo branco light', portion: '50g', calories: 90, protein: 8, carbs: 1, fat: 5.5, notes: 'Menos calorias' },
      { name: 'Requeijão light', portion: '50g', calories: 120, protein: 6, carbs: 2, fat: 10, notes: 'Cremoso' },
      { name: 'Tofu', portion: '50g', calories: 38, protein: 4, carbs: 1, fat: 2.4, notes: 'Opção vegana' }
    ]
  }
]

/**
 * Busca substituições para um alimento específico
 */
export function findSubstitutions(foodName: string): FoodSubstitution | undefined {
  const normalized = foodName.toLowerCase()
  return FOOD_SUBSTITUTIONS.find(sub =>
    sub.original.toLowerCase().includes(normalized) ||
    normalized.includes(sub.original.toLowerCase())
  )
}

/**
 * Retorna todas as categorias de substituições disponíveis
 */
export function getSubstitutionCategories(): string[] {
  return FOOD_SUBSTITUTIONS.map(sub => sub.original)
}
