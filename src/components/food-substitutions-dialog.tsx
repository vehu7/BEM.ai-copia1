import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, List, Sparkles, Loader2 } from 'lucide-react'
import { FOOD_SUBSTITUTIONS } from '@/data/food-substitutions'
import type { SavedWeeklyMenu, FoodSubstitution } from '@/types'
import { useApp } from '@/contexts/AppContext'
import { generateSubstitutions } from '@/lib/substitutions-generator'
import { toast } from 'sonner'
import { useTranslation } from '@/contexts/LanguageContext'

interface FoodSubstitutionsDialogProps {
  menu?: SavedWeeklyMenu | null
  aiSubstitutions?: Array<{ original: string; alternatives: string[] }>
}

function getFoodString(food: string | { name?: string } | null | undefined): string {
  if (typeof food === 'string') return food
  return (food && typeof food.name === 'string') ? food.name : ''
}

// Extrai todos os alimentos únicos do cardápio
function extractMenuFoods(menu: SavedWeeklyMenu): string[] {
  const seen = new Set<string>()
  menu.days.forEach(day => {
    day.meals.forEach(meal => {
      meal.foods.forEach(food => {
        const raw = getFoodString(food)
        const cleaned = raw
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/\s*[-–]\s*\d+.*$/g, '')
          .replace(/\s*\d+\s*(g|ml|kg|un|unid|porção|colher|xícara|fatia|unidade)s?\b.*$/i, '')
          .trim()
        if (cleaned && cleaned.length > 2 && !seen.has(cleaned.toLowerCase())) {
          seen.add(cleaned.toLowerCase())
        }
      })
    })
  })
  const allFoodStrings = menu.days.flatMap(d => d.meals.flatMap(m => m.foods.map(getFoodString)))
  return Array.from(seen).map(f =>
    allFoodStrings.find(raw => raw.toLowerCase().startsWith(f)) ?? f
  ).map(f => f.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*[-–]\s*\d+.*$/g, '').trim())
}

// Encontra substituições relevantes para os alimentos do cardápio
function getSubstitutionsForMenu(menu: SavedWeeklyMenu): FoodSubstitution[] {
  const menuFoods = extractMenuFoods(menu)
  const results: FoodSubstitution[] = []
  const usedOriginals = new Set<string>()

  for (const menuFood of menuFoods) {
    const foodLower = menuFood.toLowerCase()
    const foodWords = foodLower.split(/\s+/).filter(w => w.length > 2)

    let bestMatch: typeof FOOD_SUBSTITUTIONS[0] | null = null
    let bestScore = 0

    for (const sub of FOOD_SUBSTITUTIONS) {
      const origWords = sub.original.toLowerCase().split(/\s+/)

      // Pontuação: quantas palavras da entrada batem com o original
      const matchCount = origWords.filter(ow =>
        foodWords.some(fw => fw.includes(ow) || ow.includes(fw))
      ).length

      const score = matchCount / Math.max(origWords.length, 1)

      if (score > bestScore && score >= 0.5) {
        bestScore = score
        bestMatch = sub
      }
    }

    // Também verifica se o alimento do menu é uma das substituições de outro alimento
    if (!bestMatch) {
      for (const sub of FOOD_SUBSTITUTIONS) {
        const isSubstitute = sub.substitutes.some(s => {
          const subWords = s.name.toLowerCase().split(/\s+/)
          return foodWords.some(fw => subWords.some(sw => sw.includes(fw) || fw.includes(sw)))
        })
        if (isSubstitute) {
          bestMatch = sub
          bestScore = 0.5
          break
        }
      }
    }

    if (bestMatch && !usedOriginals.has(bestMatch.original)) {
      usedOriginals.add(bestMatch.original)
      results.push({
        original: menuFood,
        substitutes: bestMatch.substitutes,
      })
    }
  }

  return results
}

export function FoodSubstitutionsDialog({ menu, aiSubstitutions }: FoodSubstitutionsDialogProps) {
  const { user } = useApp()
  const { t } = useTranslation()
  const ts = t.substitutions
  const useAiSubs = !!aiSubstitutions && aiSubstitutions.length > 0

  const staticSubstitutions: FoodSubstitution[] = useMemo(
    () => (menu ? getSubstitutionsForMenu(menu) : FOOD_SUBSTITUTIONS),
    [menu]
  )

  const [dynamicSubs, setDynamicSubs] = useState<FoodSubstitution[]>([])
  const [loading, setLoading] = useState(false)

  // Nomes dos alimentos do cardápio que ainda não têm substituição
  const missingFoods = useMemo(() => {
    if (!menu) return []
    const known = new Set<string>([
      ...staticSubstitutions.map(s => s.original.toLowerCase()),
      ...dynamicSubs.map(s => s.original.toLowerCase()),
    ])
    return extractMenuFoods(menu).filter(f => !known.has(f.toLowerCase()))
  }, [menu, staticSubstitutions, dynamicSubs])

  const handleGenerateMore = async () => {
    if (!user) return
    if (missingFoods.length === 0) return
    setLoading(true)
    try {
      const result = await generateSubstitutions(missingFoods.slice(0, 12), user)
      setDynamicSubs(prev => {
        const byKey = new Map<string, FoodSubstitution>()
        for (const s of prev) byKey.set(s.original.toLowerCase(), s)
        for (const s of result) byKey.set(s.original.toLowerCase(), s)
        return Array.from(byKey.values())
      })
      if (result.length === 0) {
        toast.info(ts.toastNoneFound)
      } else {
        toast.success(ts.toastGenerated.replace('{count}', String(result.length)))
      }
    } catch {
      toast.error(ts.toastError)
    } finally {
      setLoading(false)
    }
  }

  const allSubstitutions: FoodSubstitution[] = [...staticSubstitutions, ...dynamicSubs]
  const hasSubstitutions = useAiSubs ? aiSubstitutions.length > 0 : allSubstitutions.length > 0
  const hasMenu = !!menu || useAiSubs
  const canGenerateMore = !!menu && !!user && missingFoods.length > 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <List className="w-4 h-4 mr-2" />
          {ts.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>{ts.title}</DialogTitle>
          <DialogDescription>
            {hasMenu ? ts.descriptionWithMenu : ts.descriptionWithout}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {/* Botão para gerar substituições extras via IA */}
              {canGenerateMore && !useAiSubs && (
                <Card className="border-primary/40 bg-primary/5">
                  <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ts.generateMore}</p>
                      <p className="text-xs text-muted-foreground">
                        {ts.generateMoreDesc
                          .replace('{count}', String(missingFoods.length))
                          .replace('{plural}', missingFoods.length !== 1 ? 's' : '')}
                      </p>
                    </div>
                    <Button size="sm" onClick={handleGenerateMore} disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {loading ? ts.generating : ts.generateButton}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!hasSubstitutions && hasMenu && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {ts.noneFound}
                </div>
              )}

              {/* AI-generated substitutions (nome apenas, vindo do cardápio gerado inicialmente) */}
              {useAiSubs && aiSubstitutions.map((sub, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {sub.original}
                      <Badge variant="outline" className="text-xs">{ts.inYourMenu}</Badge>
                    </CardTitle>
                    <CardDescription>{ts.canBeReplacedBy}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {sub.alternatives.map((alt, ai) => (
                        <div key={ai} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                          <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="font-medium">{alt}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Substituições completas (estáticas + geradas dinamicamente) */}
              {!useAiSubs && allSubstitutions.map((substitution, index) => {
                const isGenerated = dynamicSubs.some(d => d.original === substitution.original)
                return (
                  <Card key={`${substitution.original}-${index}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {substitution.original}
                        {hasMenu && <Badge variant="outline">{ts.inYourMenu}</Badge>}
                        {isGenerated && (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20 gap-1">
                            <Sparkles className="w-3 h-3" />
                            {ts.generatedByAi}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{ts.canBeReplacedBy}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {substitution.substitutes.map((sub, subIndex) => (
                        <div key={subIndex} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{sub.name}</span>
                              <span className="text-xs text-muted-foreground">{sub.portion}</span>
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>{sub.calories} kcal</span>
                              <span>{t.savedMenu.proteinLabel} {sub.protein}g</span>
                              <span>{t.savedMenu.carbsLabel} {sub.carbs}g</span>
                              <span>{t.savedMenu.fatLabel} {sub.fat}g</span>
                            </div>
                            {sub.notes && (
                              <p className="text-xs text-primary italic">{sub.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
