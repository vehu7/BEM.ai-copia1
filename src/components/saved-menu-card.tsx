import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Trash2, ShoppingCart, Lightbulb, FileDown, Flame } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { toast } from 'sonner'
import { FoodSubstitutionsDialog } from '@/components/food-substitutions-dialog'
import { generateMenuPDF } from '@/lib/report-generator'
import type { MenuFood } from '@/types'
import { useTranslation } from '@/contexts/LanguageContext'

// Recalcula totais a partir dos alimentos (fonte da verdade: foods[].calories).
// Evita divergências entre o valor retornado pelo GPT (que pode estar incorreto)
// e o que é efetivamente mostrado ao usuário.
function foodCalories(food: MenuFood): number {
  if (typeof food === 'string') return 0
  return typeof food.calories === 'number' ? food.calories : 0
}
function foodMacro(food: MenuFood, key: 'protein' | 'carbs' | 'fat'): number {
  if (typeof food === 'string') return 0
  return typeof food[key] === 'number' ? food[key] : 0
}
function sumMealCalories(meal: { foods: MenuFood[] }): number {
  return Math.round(meal.foods.reduce((acc, f) => acc + foodCalories(f), 0))
}
function sumMealMacro(meal: { foods: MenuFood[] }, key: 'protein' | 'carbs' | 'fat'): number {
  return Math.round(meal.foods.reduce((acc, f) => acc + foodMacro(f, key), 0) * 10) / 10
}
function sumDayCalories(day: { meals: Array<{ foods: MenuFood[] }> }): number {
  return day.meals.reduce((acc, m) => acc + sumMealCalories(m), 0)
}

export function SavedMenuCard() {
  const { savedWeeklyMenu, clearWeeklyMenu } = useApp()
  const { t } = useTranslation()
  const ts = t.savedMenu

  if (!savedWeeklyMenu) {
    return null
  }

  const dashIdx = savedWeeklyMenu.title.indexOf(' - ')
  const rawGoal = dashIdx >= 0 ? savedWeeklyMenu.title.slice(dashIdx + 3) : savedWeeklyMenu.title
  // Remove prefixo redundante (ex: "Cardápio Semanal Personalizado para X" -> "Personalizado para X")
  const menuGoal = rawGoal.replace(/^card[áa]pio\s+semanal\s*-?\s*/i, '').trim() || rawGoal

  const handleClearMenu = () => {
    clearWeeklyMenu()
    toast.success(ts.mealRemovedTitle, {
      description: ts.mealRemovedDesc,
    })
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle className="text-base leading-tight">{ts.weeklyMenu}</CardTitle>
            {menuGoal && menuGoal !== ts.weeklyMenu && (
              <p className="text-sm font-medium text-primary leading-snug">{menuGoal}</p>
            )}
          </div>
        </div>
        {savedWeeklyMenu.description && (
          <CardDescription className="line-clamp-2 mt-3">{savedWeeklyMenu.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {ts.menuSummary
              .replace('{days}', String(savedWeeklyMenu.days.length))
              .replace('{items}', String(savedWeeklyMenu.shoppingList?.length || 0))}
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <CalendarDays className="w-4 h-4 mr-2" />
                {ts.viewFull}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[85vh] p-0 flex flex-col gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                <DialogTitle>{savedWeeklyMenu.title}</DialogTitle>
                <DialogDescription>{savedWeeklyMenu.description}</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-hidden px-6 pb-6">
                <ScrollArea className="h-full">
                <div className="space-y-6 pr-4">
                  {/* Cardápio por dia */}
                  {savedWeeklyMenu.days.map((day, dayIndex) => {
                    const dayTotal = sumDayCalories(day)
                    return (
                      <Card key={dayIndex}>
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="text-lg">{day.day}</CardTitle>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                              <Flame className="w-4 h-4" />
                              <span>{dayTotal} {ts.kcalUnit}</span>
                              <span className="text-xs text-muted-foreground font-normal">{ts.dayTotal}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {day.meals.map((meal, mealIndex) => {
                            const mealCal = sumMealCalories(meal)
                            const mealP = sumMealMacro(meal, 'protein')
                            const mealC = sumMealMacro(meal, 'carbs')
                            const mealF = sumMealMacro(meal, 'fat')
                            return (
                              <div key={mealIndex} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-sm">{meal.type}</h4>
                                  <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>{mealCal} {ts.kcalUnit}</span>
                                    <span>{ts.proteinLabel} {mealP}g</span>
                                    <span>{ts.carbsLabel} {mealC}g</span>
                                    <span>{ts.fatLabel} {mealF}g</span>
                                  </div>
                                </div>
                                <ul className="text-sm text-muted-foreground list-disc list-inside pl-2">
                                  {meal.foods.map((food, foodIndex) => (
                                    <li key={foodIndex}>
                                      {typeof food === 'string' ? food : (
                                        <>{food.name}{food.calories > 0 && <span className="ml-1 text-xs opacity-70">({food.calories} kcal)</span>}</>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    )
                  })}

                  {/* Dicas */}
                  {savedWeeklyMenu.tips && savedWeeklyMenu.tips.length > 0 && (
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          {ts.tipsTitle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {savedWeeklyMenu.tips.map((tip, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="text-primary font-bold">{index + 1}.</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lista de compras */}
                  {savedWeeklyMenu.shoppingList && savedWeeklyMenu.shoppingList.length > 0 && (
                    <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          {ts.shoppingListTitle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {savedWeeklyMenu.shoppingList.map((item, index) => (
                            <Badge key={index} variant="outline" className="justify-start">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Botões de ação */}
                  <div className="space-y-3 pt-4 border-t">
                    <FoodSubstitutionsDialog menu={savedWeeklyMenu} aiSubstitutions={savedWeeklyMenu.substitutions} />
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => generateMenuPDF(savedWeeklyMenu)}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      {ts.downloadPdf}
                    </Button>
                    <Button
                      onClick={handleClearMenu}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {ts.removeMenu}
                    </Button>
                  </div>
                </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
          <FoodSubstitutionsDialog menu={savedWeeklyMenu} aiSubstitutions={savedWeeklyMenu.substitutions} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMenuPDF(savedWeeklyMenu)}
            >
              <FileDown className="w-4 h-4 mr-1.5" />
              {ts.downloadPdf}
            </Button>
            <Button
              onClick={handleClearMenu}
              variant="ghost"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {ts.remove}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
