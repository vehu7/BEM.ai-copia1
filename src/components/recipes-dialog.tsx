import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChefHat, Clock, Users, Sparkles, ChevronRight, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { BRAZILIAN_RECIPES, type BrazilianRecipe } from '@/data/brazilian-recipes'
import { FIXED_RECIPES } from '@/data/fixed-recipes'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { useApp } from '@/contexts/AppContext'
import { generateRecipes, getCachedRecipes } from '@/lib/recipes-generator'

// Converte receitas fixas para o formato BrazilianRecipe
const FIXED_AS_BRAZILIAN: BrazilianRecipe[] = FIXED_RECIPES.map(r => ({
  id: r.id,
  name: r.title,
  description: r.ingredients.slice(0, 3).join(', ') + '...',
  prepTime: r.prepTime,
  servings: r.servings,
  estimatedCost: 'Acessivel',
  difficulty: 'fácil' as const,
  tags: r.tags,
  ingredients: r.ingredients,
  instructions: r.instructions,
  nutrition: r.nutrition,
}))

export function RecipesDialog() {
  const { user } = useApp()
  const [selectedRecipe, setSelectedRecipe] = useState<BrazilianRecipe | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [recipes, setRecipes] = useState<BrazilianRecipe[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [country, setCountry] = useState('Brasil')
  const [open, setOpen] = useState(false)

  const goal = user?.goal ?? 'saude_geral'

  const load = async (countryVal: string, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCachedRecipes(goal, countryVal)
      if (cached) { setRecipes(cached); return }
    }
    setLoading(true)
    try {
      const result = await generateRecipes(goal, countryVal)
      setRecipes(result)
    } catch {
      setRecipes(BRAZILIAN_RECIPES)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !recipes && !loading) load(country)
    if (!isOpen) setSelectedRecipe(null)
  }

  const handleRefresh = () => {
    setRecipes(null)
    setSelectedRecipe(null)
    load(country, true)
  }

  const displayRecipes = [...FIXED_AS_BRAZILIAN, ...(recipes ?? BRAZILIAN_RECIPES)]

  const filteredRecipes = displayRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil':   return 'bg-success/15 text-success'
      case 'média':   return 'bg-warning/15 text-warning'
      case 'difícil': return 'bg-chart-3/15 text-chart-3'
      default:        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-xl shadow-sm border border-border w-full active:scale-[0.98] transition-transform text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-chart-4/10">
            <ChefHat className="w-4 h-4 text-chart-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-foreground">Receitas Saudáveis</p>
            <p className="text-[10px] text-muted-foreground">Pratos deliciosos e nutritivos</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
        </button>
      </DialogTrigger>

      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden max-h-[92vh] sm:max-w-xl bg-card text-foreground"
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-border">
          {selectedRecipe ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform bg-muted"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-bold leading-tight truncate text-foreground">
                  {selectedRecipe.name}
                </DialogTitle>
                <DialogDescription className="text-[10px]">Detalhes da receita</DialogDescription>
              </div>
            </div>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-2 text-base text-foreground">
                <ChefHat className="w-4 h-4 text-chart-4" />
                Receitas Saudáveis
              </DialogTitle>
              <DialogDescription className="text-xs">
                Receitas práticas com informações nutricionais completas
              </DialogDescription>
              {/* Country + refresh */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="País de referência..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border outline-none text-foreground bg-muted"
                />
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors bg-chart-4/10 text-chart-4"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  Atualizar
                </button>
              </div>
            </>
          )}
        </DialogHeader>

        {/* Lista de receitas */}
        {!selectedRecipe && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-5 py-4 gap-3">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-chart-4" />
                <p className="text-xs text-muted-foreground">Buscando receitas para {country}...</p>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Buscar receita ou tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-shrink-0 text-sm bg-muted text-foreground border border-border"
                />
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-0.5">
                  {filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      className="w-full text-left rounded-xl overflow-hidden active:scale-[0.98] transition-transform border border-border"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <div className="px-3 py-2.5 bg-muted">
                        <p className="font-semibold text-xs text-foreground">{recipe.name}</p>
                        <p className="text-[10px] mt-0.5 line-clamp-1 text-muted-foreground">{recipe.description}</p>
                      </div>
                      <div className="px-3 py-2 space-y-1.5">
                        <div className="flex gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prepTime}min</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{recipe.servings} porções</span>
                          <span className="text-muted-foreground">{recipe.estimatedCost}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="font-semibold text-primary">{recipe.nutrition.calories} kcal</span>
                          <span className="text-chart-5">P:{recipe.nutrition.protein}g</span>
                          <span className="text-chart-3">C:{recipe.nutrition.carbs}g</span>
                          <span className="text-warning">G:{recipe.nutrition.fat}g</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getDifficultyStyle(recipe.difficulty)}`}>
                            {recipe.difficulty}
                          </span>
                          {recipe.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredRecipes.length === 0 && (
                    <p className="text-center text-xs py-8 text-muted-foreground">Nenhuma receita encontrada</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Detalhe da receita */}
        {selectedRecipe && (
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">
            <p className="text-xs leading-relaxed text-muted-foreground">{selectedRecipe.description}</p>

            {/* Info rápida */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-muted text-foreground">
                <Clock className="w-3 h-3 text-primary" />{selectedRecipe.prepTime} min
              </span>
              <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-muted text-foreground">
                <Users className="w-3 h-3 text-primary" />{selectedRecipe.servings} porções
              </span>
              <span className="text-[11px] px-2 py-1 rounded-lg bg-muted text-foreground">
                {selectedRecipe.estimatedCost}
              </span>
              <span className={`text-[11px] font-medium px-2 py-1 rounded-lg ${getDifficultyStyle(selectedRecipe.difficulty)}`}>
                {selectedRecipe.difficulty}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {selectedRecipe.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>

            {/* Nutrição */}
            <div className="rounded-xl p-3 border border-border">
              <p className="text-[11px] font-semibold mb-2.5 text-primary">Informação Nutricional (por porção)</p>
              <div className="flex justify-between text-center">
                {[
                  { v: selectedRecipe.nutrition.calories, l: 'kcal', c: 'text-primary' },
                  { v: `${selectedRecipe.nutrition.protein}g`, l: 'Prot.', c: 'text-chart-5' },
                  { v: `${selectedRecipe.nutrition.carbs}g`, l: 'Carbs', c: 'text-chart-3' },
                  { v: `${selectedRecipe.nutrition.fat}g`, l: 'Gord.', c: 'text-warning' },
                  { v: `${selectedRecipe.nutrition.fiber}g`, l: 'Fibras', c: 'text-primary' },
                ].map(item => (
                  <div key={item.l}>
                    <div className={`text-sm font-bold ${item.c}`}>{item.v}</div>
                    <div className="text-[9px] text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs ingredientes / preparo */}
            <Tabs defaultValue="ingredients">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
                <TabsTrigger value="instructions">Modo de Preparo</TabsTrigger>
              </TabsList>

              <TabsContent value="ingredients" className="mt-3">
                <div className="rounded-xl p-3 space-y-1.5 border border-border">
                  {selectedRecipe.ingredients.map((ingredient, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <span className="text-primary">•</span>
                      <span className="text-foreground">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="mt-3">
                <div className="rounded-xl p-3 space-y-3 border border-border">
                  {selectedRecipe.instructions.map((instruction, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5 bg-chart-4"
                      >
                        {i + 1}
                      </span>
                      <span className="text-xs leading-relaxed text-foreground">{instruction}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Dica */}
            {selectedRecipe.tips && (
              <div className="rounded-xl p-3 bg-chart-4/10 border border-chart-4/20">
                <div className="flex gap-2">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-chart-4" />
                  <div>
                    <p className="font-semibold text-[11px] mb-0.5 text-chart-4">Dica da Bem</p>
                    <p className="text-[11px] leading-relaxed text-chart-4">{selectedRecipe.tips}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
