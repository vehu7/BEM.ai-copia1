import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Camera, Search, Barcode, Star, Clock, Apple, Coffee, UtensilsCrossed, Cookie, Trash2, AlertCircle, Sparkles, X, Plus, ImageIcon, ScanLine, ChevronDown, ChevronUp, BookOpen, Loader2, CheckCircle2, Pencil } from 'lucide-react'
import type { Meal, FoodItem, MenuFood } from '@/types'
import { BRAZILIAN_FOODS } from '@/data/brazilian-foods'
import { toast } from 'sonner'
import { BestFoodsDialog } from '@/components/best-foods-dialog'
import { RecipesDialog } from '@/components/recipes-dialog'
import { DietRecommendationDialog } from '@/components/diet-recommendation-dialog'
import { SavedMenuCard } from '@/components/saved-menu-card'
import { SubstitutionCalculator } from '@/components/substitution-calculator'
import { generateMealFeedback } from '@/lib/meal-feedback'
import { analyzeFoodPhoto, fetchProductByCosmos, readEANFromPhoto } from '@/lib/gemini'
import { estimateFoodNutrition, saveCustomFoodDb, loadCustomFoodsDb } from '@/lib/custom-food'
import { generateRecipes, getCachedRecipes } from '@/lib/recipes-generator'
import { Html5Qrcode } from 'html5-qrcode'
import { useTranslation } from '@/contexts/LanguageContext'
import type { TranslationKeys } from '@/lib/i18n'

type MealTypeValue = Meal['type']
const MEAL_TYPES: { value: MealTypeValue; key: keyof TranslationKeys['alimentacao']['mealTypes']; icon: typeof Coffee }[] = [
  { value: 'cafe', key: 'cafe', icon: Coffee },
  { value: 'lanche_manha', key: 'lanche_manha', icon: Cookie },
  { value: 'almoco', key: 'almoco', icon: UtensilsCrossed },
  { value: 'lanche_tarde', key: 'lanche_tarde', icon: Cookie },
  { value: 'jantar', key: 'jantar', icon: UtensilsCrossed },
  { value: 'ceia', key: 'ceia', icon: Apple },
]

const FAVORITE_FOODS_KEY = 'favorite_foods'
const RECENT_FOODS_KEY = 'recent_foods'

type FoodUnit = 'unidade' | 'colher' | 'gramas'

const extractPortionGrams = (portion: string): number | null => {
  const m = portion.match(/(\d+(?:[.,]\d+)?)\s*g\b/i)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

const calcMultiplier = (food: { portion: string }, unit: FoodUnit, value: number): number => {
  if (unit === 'unidade') return value
  const portionGrams = extractPortionGrams(food.portion)
  if (!portionGrams || portionGrams <= 0) return value
  if (unit === 'colher') return (value * 15) / portionGrams
  if (unit === 'gramas') return value / portionGrams
  return value
}

function dietMealToFoodItems(
  foods: MenuFood[],
  mealTotals: { calories: number; protein: number; carbs: number; fat: number; fiber?: number }
): FoodItem[] {
  const n = foods.length || 1
  return foods.map((food, i) => {
    const foodName = typeof food === 'string' ? food : food.name

    if (typeof food === 'object' && food.calories > 0) {
      return {
        id: `diet-${i}-${Date.now()}`,
        name: food.name,
        category: 'outro' as const,
        portion: '1 porção',
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber ?? 0,
        isBrazilian: false,
        isHealthy: true,
      }
    }

    const found = BRAZILIAN_FOODS.find(f =>
      f.name.toLowerCase() === foodName.toLowerCase() ||
      foodName.toLowerCase().includes(f.name.toLowerCase()) ||
      f.name.toLowerCase().includes(foodName.toLowerCase())
    )
    if (found) return { ...found, id: `diet-${i}-${found.id}` }

    return {
      id: `diet-${i}-${Date.now()}`,
      name: foodName,
      category: 'outro' as const,
      portion: '1 porção',
      calories: Math.round(mealTotals.calories / n),
      protein: Math.round((mealTotals.protein / n) * 10) / 10,
      carbs: Math.round((mealTotals.carbs / n) * 10) / 10,
      fat: Math.round((mealTotals.fat / n) * 10) / 10,
      fiber: Math.round(((mealTotals.fiber ?? 0) / n) * 10) / 10,
      isBrazilian: false,
      isHealthy: true,
    }
  })
}

// Helper: chave diaria para metas ja premiadas
function getTodayKey(suffix: string): string {
  return 'bem_' + suffix + '_' + new Date().toISOString().slice(0, 10)
}

export function Alimentacao() {
  const { user, todayMeals, addMeal, removeMeal, savedWeeklyMenu, awardXP } = useApp()
  const { t } = useTranslation()
  const ta = t.alimentacao

  // Unit options traduzidas (usadas em Selects de quantidade/medida)
  const UNIT_OPTIONS: Array<{ value: FoodUnit; label: string }> = [
    { value: 'unidade', label: ta.unit },
    { value: 'colher', label: ta.tablespoon },
    { value: 'gramas', label: ta.grams },
  ]

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMealType, setSelectedMealType] = useState<Meal['type']>('cafe')
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([])
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false)
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<FoodItem | null>(null)
  const [barcodeQuantity, setBarcodeQuantity] = useState(1)
  const [foodQuantities, setFoodQuantities] = useState<Record<string, number>>({})
  const [isPhotoSourceOpen, setIsPhotoSourceOpen] = useState(false)
  const [showMicros, setShowMicros] = useState(false)
  const [photoScannedFoods, setPhotoScannedFoods] = useState<FoodItem[]>([])
  const [photoFoodQuantities, setPhotoFoodQuantities] = useState<Record<string, number>>({})
  const [photoImageUrl, setPhotoImageUrl] = useState<string | null>(null)
  const [photoMealType, setPhotoMealType] = useState<Meal['type']>('cafe')
  const [isBarcodeSheetOpen, setIsBarcodeSheetOpen] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false)
  const [foodUnits, setFoodUnits] = useState<Record<string, FoodUnit>>({})
  const [photoFoodUnits, setPhotoFoodUnits] = useState<Record<string, FoodUnit>>({})
  const [barcodeUnit, setBarcodeUnit] = useState<FoodUnit>('unidade')
  const [barcodeEditMode, setBarcodeEditMode] = useState(false)
  const [barcodeEdited, setBarcodeEdited] = useState<Record<string, number>>({})
  const [isPhotoAddItemOpen, setIsPhotoAddItemOpen] = useState(false)
  const [photoAddSearch, setPhotoAddSearch] = useState('')
  // Alimentos customizados (DB compartilhado)
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([])
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false)
  const [customFoodName, setCustomFoodName] = useState('')
  const [customFoodPortion, setCustomFoodPortion] = useState('')
  const [isCalculatingNutrition, setIsCalculatingNutrition] = useState(false)
  const [calculatedCustomFood, setCalculatedCustomFood] = useState<FoodItem | null>(null)
  // Registro via cardápio/dieta
  // Edição de refeição já registrada
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [editMealType, setEditMealType] = useState<Meal['type']>('cafe')
  const [editMealFoods, setEditMealFoods] = useState<FoodItem[]>([])
  const [editFoodQtys, setEditFoodQtys] = useState<Record<number, number>>({})
  const [editFoodUnits, setEditFoodUnits] = useState<Record<number, FoodUnit>>({})
  const [editAddSearch, setEditAddSearch] = useState('')
  const [isEditAddOpen, setIsEditAddOpen] = useState(false)
  // Registro via cardápio/dieta
  const [isDietDialogOpen, setIsDietDialogOpen] = useState(false)
  const [dietSelectedDay, setDietSelectedDay] = useState(0)
  const [dietSelectedMealIdx, setDietSelectedMealIdx] = useState<number | null>(null)
  const [dietFoodEnabled, setDietFoodEnabled] = useState<Record<number, boolean>>({})
  const [dietFoodValues, setDietFoodValues] = useState<Record<number, number>>({})
  const [dietFoodUnits, setDietFoodUnits] = useState<Record<number, FoodUnit>>({})
  const [dietMealType, setDietMealType] = useState<Meal['type']>('cafe')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const barcodeFileInputRef = useRef<HTMLInputElement>(null)

  // Carregar alimentos customizados do banco compartilhado
  useEffect(() => {
    loadCustomFoodsDb().then(foods => setCustomFoods(foods)).catch(() => {})
  }, [])

  // Pré-gera receitas em background para que o dialog abra instantaneamente
  useEffect(() => {
    if (!user) return
    const goal = user.goal ?? 'saude_geral'
    const country = 'Brasil'
    if (!getCachedRecipes(goal, country)) {
      generateRecipes(goal, country).catch(() => {})
    }
  }, [user])

  // Carregar favoritos e recentes
  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITE_FOODS_KEY)
    const storedRecents = localStorage.getItem(RECENT_FOODS_KEY)

    if (storedFavorites) {
      try {
        setFavoriteFoods(JSON.parse(storedFavorites))
      } catch (e) {
        console.error('Erro ao carregar favoritos:', e)
      }
    }

    if (storedRecents) {
      try {
        setRecentFoods(JSON.parse(storedRecents))
      } catch (e) {
        console.error('Erro ao carregar recentes:', e)
      }
    }
  }, [])

  const allFoods = [...BRAZILIAN_FOODS, ...customFoods]
  const filteredFoods = allFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addFoodToSelection = (food: FoodItem, quantity: number = 1) => {
    const foodWithQuantity = { ...food, customQuantity: quantity }
    setSelectedFoods([...selectedFoods, foodWithQuantity])

    // Adicionar aos recentes
    const updatedRecents = [food, ...recentFoods.filter(f => f.id !== food.id)].slice(0, 10)
    setRecentFoods(updatedRecents)
    localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(updatedRecents))
  }

  const updateFoodQuantity = (index: number, quantity: number) => {
    const updated = [...selectedFoods]
    updated[index] = { ...updated[index], customQuantity: quantity }
    setSelectedFoods(updated)
  }

  const removeFoodFromSelection = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index))
  }

  const toggleFavorite = (foodId: string) => {
    const isFavorite = favoriteFoods.includes(foodId)
    const updated = isFavorite
      ? favoriteFoods.filter(id => id !== foodId)
      : [...favoriteFoods, foodId]

    setFavoriteFoods(updated)
    localStorage.setItem(FAVORITE_FOODS_KEY, JSON.stringify(updated))

    toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
  }

  const getQuantity = (foodId: string) => {
    return foodQuantities[foodId] || 1
  }

  const setQuantity = (foodId: string, quantity: number) => {
    setFoodQuantities(prev => ({ ...prev, [foodId]: quantity }))
  }

  const saveMeal = async () => {
    if (selectedFoods.length === 0) return

    const alreadyLogged = todayMeals.some(m => m.type === selectedMealType)
    if (alreadyLogged) {
      toast.warning('Refeição já registrada', {
        description: `Você já registrou uma refeição neste horário hoje. Verifique se não é um registro duplicado.`,
        duration: 6000,
      })
    }

    // Calcular totais considerando a quantidade customizada de cada alimento
    const totalCalories = selectedFoods.reduce((sum, food) => {
      const quantity = food.customQuantity || 1
      return sum + (food.calories * quantity)
    }, 0)
    const totalProtein = selectedFoods.reduce((sum, food) => {
      const quantity = food.customQuantity || 1
      return sum + (food.protein * quantity)
    }, 0)
    const totalCarbs = selectedFoods.reduce((sum, food) => {
      const quantity = food.customQuantity || 1
      return sum + (food.carbs * quantity)
    }, 0)
    const totalFat = selectedFoods.reduce((sum, food) => {
      const quantity = food.customQuantity || 1
      return sum + (food.fat * quantity)
    }, 0)

    const meal: Meal = {
      id: crypto.randomUUID(),
      date: new Date(),
      type: selectedMealType,
      foods: selectedFoods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat
    }

    addMeal(meal)

    // Gerar feedback da BEM com IA
    await generateAIFeedback(meal)

    // XP por registrar refeição
    awardXP('REGISTER_MEAL')
    setTimeout(() => { toast.success('+10 XP ganhos!', { icon: '⚡' }) }, 800)

    // XP por meta calórica do dia (só uma vez por dia)
    const newCalories = todayMeals.reduce((s, m) => s + m.totalCalories, 0) + meal.totalCalories
    if (user?.targetCalories && newCalories >= user.targetCalories && !localStorage.getItem(getTodayKey('calorie_goal'))) {
      localStorage.setItem(getTodayKey('calorie_goal'), '1')
      awardXP('HIT_CALORIE_GOAL')
      setTimeout(() => { toast.success('+25 XP — Meta calórica atingida!', { icon: '🎯' }) }, 1600)
    }
    // XP por meta de proteína (>=90%) só uma vez por dia
    const newProtein = todayMeals.reduce((s, m) => s + m.totalProtein, 0) + meal.totalProtein
    if (user?.targetProtein && newProtein >= user.targetProtein * 0.9 && !localStorage.getItem(getTodayKey('protein_goal'))) {
      localStorage.setItem(getTodayKey('protein_goal'), '1')
      awardXP('HIT_PROTEIN_GOAL')
      setTimeout(() => { toast.success('+20 XP — Meta de proteína atingida!', { icon: '💪' }) }, 2400)
    }

    setSelectedFoods([])
    setFoodQuantities({})
    setIsDialogOpen(false)
  }

  const generateAIFeedback = async (meal: Meal) => {
    if (!user) return

    try {
      // Usar sistema de feedback offline inteligente
      const feedback = generateMealFeedback(meal, user)

      toast.success('Refeição registrada!', {
        description: feedback,
        duration: 8000
      })
    } catch (error) {
      console.error('Erro ao gerar feedback:', error)
      toast.success('Refeição registrada!')
    }
  }

  const updatePhotoFoodQuantity = (foodId: string, qty: number) => {
    setPhotoFoodQuantities(prev => ({ ...prev, [foodId]: Math.max(1, qty) }))
  }

  const saveDietMeal = async (foodItems: FoodItem[], enabledMap: Record<number, boolean>, valuesMap: Record<number, number>, unitsMap: Record<number, FoodUnit>) => {
    const alreadyLogged = todayMeals.some(m => m.type === dietMealType)
    if (alreadyLogged) {
      toast.warning('Refeição já registrada', {
        description: `Você já registrou uma refeição neste horário hoje. Verifique se não é um registro duplicado.`,
        duration: 6000,
      })
    }

    const enabledFoods = foodItems
      .map((food, i) => ({ food, enabled: enabledMap[i] !== false, value: valuesMap[i] || 1, unit: unitsMap[i] || 'unidade' as FoodUnit }))
      .filter(x => x.enabled)
    if (enabledFoods.length === 0) return

    const foodsWithQty = enabledFoods.map(({ food, value, unit }) => ({
      ...food,
      customQuantity: calcMultiplier(food, unit, value),
    }))
    const totalCalories = Math.round(foodsWithQty.reduce((s, f) => s + f.calories * (f.customQuantity || 1), 0))
    const totalProtein = Math.round(foodsWithQty.reduce((s, f) => s + f.protein * (f.customQuantity || 1), 0))
    const totalCarbs = Math.round(foodsWithQty.reduce((s, f) => s + f.carbs * (f.customQuantity || 1), 0))
    const totalFat = Math.round(foodsWithQty.reduce((s, f) => s + f.fat * (f.customQuantity || 1), 0))

    const meal: Meal = {
      id: crypto.randomUUID(),
      date: new Date(),
      type: dietMealType,
      foods: foodsWithQty,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    }
    setIsDietDialogOpen(false)
    setDietSelectedMealIdx(null)
    setDietFoodEnabled({})
    setDietFoodValues({})
    setDietFoodUnits({})
    addMeal(meal)
    await generateAIFeedback(meal)
    awardXP('REGISTER_MEAL')
    setTimeout(() => { toast.success('+10 XP ganhos!', { icon: '⚡' }) }, 800)
  }

  const openEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setEditMealType(meal.type)
    setEditMealFoods([...meal.foods])
    const qtys: Record<number, number> = {}
    const units: Record<number, FoodUnit> = {}
    meal.foods.forEach((f, i) => {
      qtys[i] = f.customQuantity || 1
      units[i] = 'unidade'
    })
    setEditFoodQtys(qtys)
    setEditFoodUnits(units)
  }

  const saveEditedMeal = async () => {
    if (!editingMeal || editMealFoods.length === 0) return
    const foodsWithQty = editMealFoods.map((food, i) => {
      const mult = calcMultiplier(food, editFoodUnits[i] || 'unidade', editFoodQtys[i] || 1)
      return { ...food, customQuantity: mult }
    })
    const totalCalories = Math.round(foodsWithQty.reduce((s, f) => s + f.calories * (f.customQuantity || 1), 0))
    const totalProtein  = Math.round(foodsWithQty.reduce((s, f) => s + f.protein  * (f.customQuantity || 1), 0))
    const totalCarbs    = Math.round(foodsWithQty.reduce((s, f) => s + f.carbs    * (f.customQuantity || 1), 0))
    const totalFat      = Math.round(foodsWithQty.reduce((s, f) => s + f.fat      * (f.customQuantity || 1), 0))
    const updatedMeal: Meal = {
      ...editingMeal,
      type: editMealType,
      foods: foodsWithQty,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    }
    removeMeal(editingMeal.id)
    addMeal(updatedMeal)
    setEditingMeal(null)
    setEditMealFoods([])
    setEditFoodQtys({})
    setEditFoodUnits({})
    toast.success('Refeição atualizada!')
  }

  const handleCalculateCustomFood = async () => {
    if (!customFoodName.trim() || !customFoodPortion.trim()) return
    setIsCalculatingNutrition(true)
    setCalculatedCustomFood(null)
    try {
      const nutrition = await estimateFoodNutrition(customFoodName.trim(), customFoodPortion.trim())
      const newFood: FoodItem = {
        id: `custom-${crypto.randomUUID()}`,
        name: customFoodName.trim(),
        category: 'outro',
        portion: customFoodPortion.trim(),
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        sodium: nutrition.sodium ?? undefined,
        sugar: nutrition.sugar ?? undefined,
        isBrazilian: false,
        isHealthy: true,
      }
      setCalculatedCustomFood(newFood)
    } catch (err: unknown) {
      toast.error('Erro ao calcular', { description: err instanceof Error ? err.message : 'Tente novamente.' })
    } finally {
      setIsCalculatingNutrition(false)
    }
  }

  const handleAddCalculatedFood = async (food: FoodItem) => {
    // Adiciona à seleção
    addFoodToSelection(food, 1)
    // Salva no banco compartilhado
    if (user) {
      await saveCustomFoodDb(food, user.id)
      setCustomFoods(prev => [food, ...prev])
    }
    // Reseta o form
    setCalculatedCustomFood(null)
    setCustomFoodName('')
    setCustomFoodPortion('')
    setShowCustomFoodForm(false)
    toast.success('Alimento adicionado!', { description: 'Disponível para todos os usuários.' })
  }

  const removePhotoFood = (foodId: string) => {
    setPhotoScannedFoods(prev => prev.filter(f => f.id !== foodId))
    setPhotoFoodQuantities(prev => { const n = { ...prev }; delete n[foodId]; return n })
    setPhotoFoodUnits(prev => { const n = { ...prev }; delete n[foodId]; return n })
  }

  const savePhotoMeal = async () => {
    if (photoScannedFoods.length === 0) return
    const foodsWithQty = photoScannedFoods.map(food => ({
      ...food,
      customQuantity: calcMultiplier(food, photoFoodUnits[food.id] || 'unidade', photoFoodQuantities[food.id] || 1),
    }))
    const totalCalories = Math.round(foodsWithQty.reduce((s, f) => s + f.calories * (f.customQuantity || 1), 0))
    const totalProtein = Math.round(foodsWithQty.reduce((s, f) => s + f.protein * (f.customQuantity || 1), 0))
    const totalCarbs = Math.round(foodsWithQty.reduce((s, f) => s + f.carbs * (f.customQuantity || 1), 0))
    const totalFat = Math.round(foodsWithQty.reduce((s, f) => s + f.fat * (f.customQuantity || 1), 0))
    const meal: Meal = {
      id: crypto.randomUUID(),
      date: new Date(),
      type: photoMealType,
      foods: foodsWithQty,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    }
    setPhotoScannedFoods([])
    setPhotoImageUrl(null)
    setPhotoFoodQuantities({})
    addMeal(meal)
    await generateAIFeedback(meal)
    awardXP('REGISTER_MEAL')
    setTimeout(() => { toast.success('+10 XP ganhos!', { icon: '⚡' }) }, 800)
  }

  const addScannedProductToMeal = async () => {
    if (!scannedProduct) return
    // Aplica valores editados sobre o produto original
    const effective: FoodItem = {
      ...scannedProduct,
      calories:     barcodeEdited.calories     ?? scannedProduct.calories,
      protein:      barcodeEdited.protein      ?? scannedProduct.protein,
      carbs:        barcodeEdited.carbs        ?? scannedProduct.carbs,
      fat:          barcodeEdited.fat          ?? scannedProduct.fat,
      fiber:        barcodeEdited.fiber        ?? scannedProduct.fiber,
      sodium:       barcodeEdited.sodium       !== undefined ? barcodeEdited.sodium       : scannedProduct.sodium,
      sugar:        barcodeEdited.sugar        !== undefined ? barcodeEdited.sugar        : scannedProduct.sugar,
      saturatedFat: barcodeEdited.saturatedFat !== undefined ? barcodeEdited.saturatedFat : scannedProduct.saturatedFat,
    }
    const multiplier = calcMultiplier(effective, barcodeUnit, barcodeQuantity)
    const foodWithQty = { ...effective, customQuantity: multiplier }
    const meal: Meal = {
      id: (crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })),
      date: new Date(),
      type: selectedMealType,
      foods: [foodWithQty],
      totalCalories: Math.round(effective.calories * multiplier),
      totalProtein:  Math.round(effective.protein  * multiplier),
      totalCarbs:    Math.round(effective.carbs    * multiplier),
      totalFat:      Math.round(effective.fat      * multiplier),
    }
    setIsBarcodeDialogOpen(false)
    setScannedProduct(null)
    setBarcodeQuantity(1)
    setBarcodeUnit('unidade')
    setBarcodeEditMode(false)
    setBarcodeEdited({})
    addMeal(meal)
    await generateAIFeedback(meal)
    awardXP('REGISTER_MEAL')
    setTimeout(() => { toast.success('+10 XP ganhos!', { icon: '⚡' }) }, 800)
  }

  const analyzePhoto = async (file: File) => {
    setIsAnalyzingPhoto(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })

      // Guarda preview da imagem
      const objectUrl = URL.createObjectURL(file)
      setPhotoImageUrl(objectUrl)

      const results = await analyzeFoodPhoto(imageData, user)

      const foodItems: FoodItem[] = results.map((result, i) => ({
        id: `photo-${Date.now()}-${i}`,
        name: result.name,
        category: 'outro' as const,
        portion: result.portion,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        sodium: result.sodium,
        sugar: result.sugar,
        saturatedFat: result.saturatedFat,
        omega3: result.omega3,
        cholesterol: result.cholesterol,
        isBrazilian: false,
        isHealthy: true,
      }))

      setPhotoScannedFoods(foodItems)
      const initQty: Record<string, number> = {}
      const initUnits: Record<string, FoodUnit> = {}
      foodItems.forEach(f => { initQty[f.id] = 1; initUnits[f.id] = 'unidade' })
      setPhotoFoodQuantities(initQty)
      setPhotoFoodUnits(initUnits)
      setPhotoMealType(selectedMealType)

      // Salva no banco os alimentos novos (não existentes na lista atual)
      if (user) {
        const existingNames = new Set(allFoods.map(f => f.name.toLowerCase().trim()))
        const newFoods = foodItems.filter(f => !existingNames.has(f.name.toLowerCase().trim()))
        if (newFoods.length > 0) {
          const saved: FoodItem[] = []
          for (const food of newFoods) {
            const dbFood: FoodItem = { ...food, id: `custom-photo-${crypto.randomUUID()}` }
            await saveCustomFoodDb(dbFood, user.id)
            saved.push(dbFood)
          }
          setCustomFoods(prev => [...saved, ...prev])
        }
      }
    } catch (error: any) {
      setPhotoImageUrl(null)
      console.error('Erro ao processar foto:', error)
      toast.error('Erro ao analisar foto', {
        description: error.message || 'Não foi possível analisar a foto. Tente novamente.',
        duration: 6000
      })
    } finally {
      setIsAnalyzingPhoto(false)
    }
  }

  const lookupBarcode = async (code: string) => {
    if (!code.trim()) return
    setIsLookingUpBarcode(true)
    try {
      const result = await fetchProductByCosmos(code.trim())
      const foodItem: FoodItem = {
        id: `barcode-${Date.now()}`,
        name: result.name,
        category: 'outro',
        portion: result.portion,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        sodium: result.sodium,
        sugar: result.sugar,
        saturatedFat: result.saturatedFat,
        omega3: result.omega3,
        cholesterol: result.cholesterol,
        isBrazilian: true,
        isHealthy: true,
        barcode: result.barcode,
      }
      setIsBarcodeSheetOpen(false)
      setManualBarcode('')
      setScannedProduct(foodItem)
      setIsBarcodeDialogOpen(true)

      // Salva no banco se for um produto novo
      if (user) {
        const existingNames = new Set(allFoods.map(f => f.name.toLowerCase().trim()))
        if (!existingNames.has(foodItem.name.toLowerCase().trim())) {
          const dbFood: FoodItem = { ...foodItem, id: `custom-barcode-${crypto.randomUUID()}` }
          await saveCustomFoodDb(dbFood, user.id)
          setCustomFoods(prev => [dbFood, ...prev])
        }
      }
    } catch {
      toast.error('Produto não encontrado', {
        description: 'Este código não está na base de dados. Tente buscar pelo nome do alimento.',
        duration: 6000
      })
    } finally {
      setIsLookingUpBarcode(false)
    }
  }

  const handleBarcodeFile = async (file: File) => {
    setIsAnalyzingPhoto(true)
    setIsBarcodeSheetOpen(false)
    try {
      // Tenta decodificar com html5-qrcode (rápido)
      let decoded: string | null = null
      try {
        const hiddenId = 'qr-hidden-scanner'
        let el = document.getElementById(hiddenId)
        if (!el) {
          el = document.createElement('div')
          el.id = hiddenId
          el.style.display = 'none'
          document.body.appendChild(el)
        }
        const scanner = new Html5Qrcode(hiddenId)
        decoded = await scanner.scanFile(file, false)
        scanner.clear()
      } catch {
        // html5-qrcode falhou — vai para OpenAI Vision
      }

      if (!decoded) {
        // html5-qrcode falhou — usa OpenAI Vision para ler o EAN da foto
        const imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        decoded = await readEANFromPhoto(imageData)
      }

      // Com o EAN (de qualquer origem), busca via Cosmos
      await lookupBarcode(decoded!)
    } catch {
      setIsBarcodeSheetOpen(true)
      toast.error('Não foi possível identificar o código de barras', {
        description: 'Tente outra foto ou digite o número manualmente.',
        duration: 4000
      })
    } finally {
      setIsAnalyzingPhoto(false)
    }
  }

  const handlePhotoCapture = () => {
    setIsPhotoSourceOpen(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    analyzePhoto(file)
  }

  const handleBarcodeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    handleBarcodeFile(file)
  }

  const getMealIcon = (type: Meal['type']) => {
    const meal = MEAL_TYPES.find(m => m.value === type)
    return meal ? meal.icon : Apple
  }

  const getMealLabel = (type: Meal['type']) => {
    const meal = MEAL_TYPES.find(m => m.value === type)
    return meal ? ta.mealTypes[meal.key] : type
  }

  const totalCaloriesToday = todayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0)
  const totalProteinToday = todayMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
  const totalCarbsToday = todayMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
  const totalFatToday = todayMeals.reduce((sum, meal) => sum + meal.totalFat, 0)

  const allFoodsToday = todayMeals.flatMap(meal =>
    meal.foods.map(f => ({ ...f, qty: f.customQuantity || 1 }))
  )
  const totalFiberToday = allFoodsToday.reduce((s, f) => s + (f.fiber || 0) * f.qty, 0)
  const totalSodiumToday = allFoodsToday.reduce((s, f) => s + (f.sodium || 0) * f.qty, 0)
  const totalSugarToday = allFoodsToday.reduce((s, f) => s + (f.sugar || 0) * f.qty, 0)
  const totalSatFatToday = allFoodsToday.reduce((s, f) => s + (f.saturatedFat || 0) * f.qty, 0)
  const totalOmega3Today = allFoodsToday.reduce((s, f) => s + (f.omega3 || 0) * f.qty, 0)
  const totalCholesterolToday = allFoodsToday.reduce((s, f) => s + (f.cholesterol || 0) * f.qty, 0)
  const hasMicroData = totalSodiumToday > 0 || totalSugarToday > 0 || totalSatFatToday > 0

  const targetCalories = user?.targetCalories || 2000
  const targetProtein = user?.targetProtein || 120
  const targetCarbs = user?.targetCarbs || 200
  const targetFat = user?.targetFat || 60
  const targetFiber = user?.targetFiber || 25

  const caloriesPercentage = Math.min((totalCaloriesToday / targetCalories) * 100, 100)

  const remainingCalories = Math.max(0, targetCalories - totalCaloriesToday)

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-bold">{ta.title}</h1>
            <p className="text-sm text-muted-foreground">{ta.subtitle}</p>
          </div>
          <img src="/mascots/koala-nutricao.webp" alt="a BEM — sua assistente de nutrição" className="w-20 h-20 object-contain drop-shadow-md" />
        </div>

        {/* Resumo calórico */}
        <div className="rounded-2xl p-5 bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{ta.caloriesToday}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-bold text-primary">{totalCaloriesToday}</span>
                <span className="text-sm text-muted-foreground">/ {targetCalories} kcal</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{ta.remaining}</p>
              <p className={`text-xl font-bold ${remainingCalories === 0 ? 'text-primary' : 'text-foreground'}`}>
                {remainingCalories} kcal
              </p>
            </div>
          </div>
          <Progress value={caloriesPercentage} className="h-2" />

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center bg-chart-5/10 rounded-xl py-2.5">
              <div className="text-lg font-bold text-chart-5">{Math.round(totalProteinToday)}g</div>
              <div className="text-xs text-chart-5 mt-0.5">{ta.protein}</div>
              <div className="text-[9px] text-muted-foreground">/{targetProtein}g</div>
            </div>
            <div className="text-center bg-chart-3/10 rounded-xl py-2.5">
              <div className="text-lg font-bold text-chart-3">{Math.round(totalCarbsToday)}g</div>
              <div className="text-xs text-chart-3 mt-0.5">{ta.carbs}</div>
              <div className="text-[9px] text-muted-foreground">/{targetCarbs}g</div>
            </div>
            <div className="text-center bg-warning/10 rounded-xl py-2.5">
              <div className="text-lg font-bold text-warning">{Math.round(totalFatToday)}g</div>
              <div className="text-xs text-warning mt-0.5">{ta.fat}</div>
              <div className="text-[9px] text-muted-foreground">/{targetFat}g</div>
            </div>
            <div className="text-center bg-success/10 rounded-xl py-2.5">
              <div className="text-lg font-bold text-success">{Math.round(totalFiberToday)}g</div>
              <div className="text-xs text-success mt-0.5">{ta.fiber}</div>
              <div className="text-[9px] text-muted-foreground">/{targetFiber}g</div>
            </div>
          </div>

          {/* Micronutrientes (quando há dados de IA) */}
          {hasMicroData && (
            <div>
              <button
                onClick={() => setShowMicros(v => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground w-full justify-between py-1"
              >
                <span className="font-medium">Micronutrientes</span>
                {showMicros ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showMicros && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {totalSodiumToday > 0 && (
                    <div className="text-center bg-destructive/10 rounded-xl py-2.5 px-1">
                      <div className="text-sm font-bold text-destructive">{Math.round(totalSodiumToday)}mg</div>
                      <div className="text-xs text-destructive mt-0.5">Sódio</div>
                      <div className="text-[9px] text-muted-foreground">máx 2300mg</div>
                    </div>
                  )}
                  {totalSugarToday > 0 && (
                    <div className="text-center bg-chart-4/10 rounded-xl py-2.5 px-1">
                      <div className="text-sm font-bold text-chart-4">{Math.round(totalSugarToday * 10) / 10}g</div>
                      <div className="text-xs text-chart-4 mt-0.5">Açúcar</div>
                      <div className="text-[9px] text-muted-foreground">máx 25g</div>
                    </div>
                  )}
                  {totalSatFatToday > 0 && (
                    <div className="text-center bg-warning/10 rounded-xl py-2.5 px-1">
                      <div className="text-sm font-bold text-warning">{Math.round(totalSatFatToday * 10) / 10}g</div>
                      <div className="text-xs text-warning mt-0.5">Gord. Sat.</div>
                      <div className="text-[9px] text-muted-foreground">máx 20g</div>
                    </div>
                  )}
                  {totalOmega3Today > 0 && (
                    <div className="text-center bg-info/10 rounded-xl py-2.5 px-1">
                      <div className="text-sm font-bold text-info">{Math.round(totalOmega3Today * 100) / 100}g</div>
                      <div className="text-xs text-info mt-0.5">Ômega-3</div>
                      <div className="text-[9px] text-muted-foreground">mín 1.1g</div>
                    </div>
                  )}
                  {totalCholesterolToday > 0 && (
                    <div className="text-center bg-accent rounded-xl py-2.5 px-1">
                      <div className="text-sm font-bold text-secondary">{Math.round(totalCholesterolToday)}mg</div>
                      <div className="text-xs text-secondary mt-0.5">Colesterol</div>
                      <div className="text-[9px] text-muted-foreground">máx 300mg</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Alertas GLP-1 */}
          {user?.medication && user.medication !== 'nenhum' && totalCaloriesToday < targetCalories * 0.5 && (
            <div className="flex gap-2 p-3 bg-destructive/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive text-sm">Atenção: Ingestão baixa</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Você está usando {user.medication}. Mantenha proteína e nutrição adequadas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Destaque: Cardápio com IA — sempre no topo */}
        <div className="rounded-2xl p-4 pt-5 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 shadow-md">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 mb-3 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide shadow-sm">
            <Sparkles className="w-3 h-3" />
            Cardápio com IA
          </div>
          <div className="space-y-3">
            {savedWeeklyMenu ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Seu cardápio personalizado de {savedWeeklyMenu.days.length} dias está pronto.
                Toque para visualizar, registrar refeições ou gerar substituições.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Crie um plano alimentar semanal calibrado para seu perfil, suas metas e a cultura brasileira.
              </p>
            )}
            <DietRecommendationDialog />
            <SavedMenuCard />
          </div>
        </div>

        {/* Registro de Refeições */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase px-2">Registro de Refeições</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) { setShowCustomFoodForm(false); setCalculatedCustomFood(null); setCustomFoodName(''); setCustomFoodPortion('') }
          }}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl shadow-sm active:scale-95 transition-transform bg-primary/10">
                <Search className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium text-primary">Buscar</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[85vh] p-0 flex flex-col gap-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>Adicionar Alimentos</DialogTitle>
                <DialogDescription>Busque, favorite ou use seus recentes</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="search" className="flex-1 flex flex-col overflow-hidden px-6 pb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="search">Buscar</TabsTrigger>
                  <TabsTrigger value="favorites">Favoritos</TabsTrigger>
                  <TabsTrigger value="recent">Recentes</TabsTrigger>
                </TabsList>

                {/* Tipo de refeição */}
                <div className="mt-4">
                  <Select value={selectedMealType} onValueChange={(value: Meal['type']) => setSelectedMealType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {ta.mealTypes[type.key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <TabsContent value="search" className="flex-1 flex flex-col mt-4 overflow-hidden data-[state=active]:flex">
                  {/* Busca */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={ta.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Lista de alimentos */}
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-2 pr-4">
                        {filteredFoods.map((food) => {
                          const unit = foodUnits[food.id] || 'unidade'
                          const value = getQuantity(food.id)
                          const multiplier = calcMultiplier(food, unit, value)
                          const previewCals = Math.round(food.calories * multiplier)
                          return (
                            <Card key={food.id} className="hover:bg-accent transition-colors">
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="font-medium">{food.name}</div>
                                      <div className="text-xs text-muted-foreground">{food.portion}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <div className="font-bold text-primary text-sm">{previewCals} kcal</div>
                                        <div className="text-xs text-muted-foreground">
                                          P:{Math.round(food.protein*multiplier)}g C:{Math.round(food.carbs*multiplier)}g G:{Math.round(food.fat*multiplier)}g
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleFavorite(food.id)
                                        }}
                                      >
                                        <Star className={`w-4 h-4 ${favoriteFoods.includes(food.id) ? 'fill-warning text-warning' : ''}`} />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Select
                                      value={unit}
                                      onValueChange={(v: FoodUnit) => setFoodUnits(prev => ({ ...prev, [food.id]: v }))}
                                    >
                                      <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      value={value}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value)
                                        if (!isNaN(val) && val > 0) setQuantity(food.id, val)
                                      }}
                                      className="h-7 text-center text-xs w-16"
                                      step="1"
                                      min="1"
                                    />
                                    <Button
                                      size="sm"
                                      className="h-7 flex-shrink-0"
                                      onClick={() => addFoodToSelection(food, multiplier)}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Adicionar
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}

                        {/* Empty state — aparece quando busca não tem resultado */}
                        {filteredFoods.length === 0 && searchTerm.length > 0 && !showCustomFoodForm && (
                          <div className="text-center py-6 space-y-3">
                            <p className="text-sm text-muted-foreground">Nenhum resultado para <strong>"{searchTerm}"</strong></p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCustomFoodName(searchTerm)
                                setShowCustomFoodForm(true)
                                setCalculatedCustomFood(null)
                              }}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1.5" />
                              Adicionar este alimento
                            </Button>
                          </div>
                        )}

                        {/* Separador "Não encontrou?" — sempre visível no fim da lista */}
                        {!showCustomFoodForm && filteredFoods.length > 0 && (
                          <button
                            onClick={() => {
                              setCustomFoodName(searchTerm)
                              setShowCustomFoodForm(true)
                              setCalculatedCustomFood(null)
                            }}
                            className="w-full py-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5 border border-dashed rounded-xl hover:border-primary hover:text-primary transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Não encontrou? Adicionar novo alimento
                          </button>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Formulário de novo alimento */}
                  {showCustomFoodForm && (
                    <div className="border-t pt-3 space-y-3 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Novo alimento
                        </p>
                        <button
                          onClick={() => { setShowCustomFoodForm(false); setCalculatedCustomFood(null) }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Input
                            placeholder="Nome do alimento (ex: Pão de queijo)"
                            value={customFoodName}
                            onChange={e => { setCustomFoodName(e.target.value); setCalculatedCustomFood(null) }}
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Porção (ex: 1 unidade, 100g, 1 fatia)"
                            value={customFoodPortion}
                            onChange={e => { setCustomFoodPortion(e.target.value); setCalculatedCustomFood(null) }}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {!calculatedCustomFood ? (
                        <Button
                          className="w-full"
                          disabled={!customFoodName.trim() || !customFoodPortion.trim() || isCalculatingNutrition}
                          onClick={handleCalculateCustomFood}
                        >
                          {isCalculatingNutrition ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculando...</>
                          ) : (
                            <><Sparkles className="w-4 h-4 mr-2" />Calcular</>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          {/* Preview do resultado */}
                          <div className="rounded-xl p-3 bg-primary/5 border border-primary/20 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              <p className="text-sm font-medium">{calculatedCustomFood.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{calculatedCustomFood.portion}</p>
                            <div className="grid grid-cols-4 gap-1 text-center">
                              {[
                                { v: `${calculatedCustomFood.calories}`, l: 'kcal', cls: 'text-primary' },
                                { v: `${calculatedCustomFood.protein}g`, l: 'Prot.', cls: 'text-chart-5' },
                                { v: `${calculatedCustomFood.carbs}g`, l: 'Carbs', cls: 'text-chart-3' },
                                { v: `${calculatedCustomFood.fat}g`, l: 'Gord.', cls: 'text-warning' },
                              ].map(item => (
                                <div key={item.l} className="bg-background rounded-lg py-1.5">
                                  <div className={`text-xs font-bold ${item.cls}`}>{item.v}</div>
                                  <div className="text-[9px] text-muted-foreground">{item.l}</div>
                                </div>
                              ))}
                            </div>
                            {(calculatedCustomFood.fiber ?? 0) > 0 && (
                              <p className="text-xs text-muted-foreground">Fibras: {calculatedCustomFood.fiber}g</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setCalculatedCustomFood(null)}
                            >
                              Recalcular
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleAddCalculatedFood(calculatedCustomFood)}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="favorites" className="flex-1 flex flex-col mt-4 overflow-hidden data-[state=active]:flex">
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full w-full">
                      <div className="space-y-2 pr-4">
                        {BRAZILIAN_FOODS.filter(f => favoriteFoods.includes(f.id)).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Star className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-semibold text-foreground">Seus favoritos aparecem aqui</p>
                            <p className="text-xs mt-1 leading-relaxed">Toque na estrela ao lado de qualquer alimento na busca para salvar e acessar rapidamente.</p>
                          </div>
                        ) : (
                          BRAZILIAN_FOODS.filter(f => favoriteFoods.includes(f.id)).map((food) => {
                            const unit = foodUnits[food.id] || 'unidade'
                            const value = getQuantity(food.id)
                            const multiplier = calcMultiplier(food, unit, value)
                            return (
                              <Card key={food.id} className="hover:bg-accent">
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium">{food.name}</div>
                                        <div className="text-xs text-muted-foreground">{food.portion}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-primary text-sm">{Math.round(food.calories*multiplier)} kcal</div>
                                        <div className="text-xs text-muted-foreground">
                                          P:{Math.round(food.protein*multiplier)}g C:{Math.round(food.carbs*multiplier)}g
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Select
                                        value={unit}
                                        onValueChange={(v: FoodUnit) => setFoodUnits(prev => ({ ...prev, [food.id]: v }))}
                                      >
                                        <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="number"
                                        value={value}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value)
                                          if (!isNaN(val) && val > 0) setQuantity(food.id, val)
                                        }}
                                        className="h-7 text-center text-xs w-16"
                                        step="1"
                                        min="1"
                                      />
                                      <Button
                                        size="sm"
                                        className="h-7 flex-shrink-0"
                                        onClick={() => addFoodToSelection(food, multiplier)}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Adicionar
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="flex-1 flex flex-col mt-4 overflow-hidden data-[state=active]:flex">
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full w-full">
                      <div className="space-y-2 pr-4">
                        {recentFoods.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-semibold text-foreground">Histórico vazio por enquanto</p>
                            <p className="text-xs mt-1 leading-relaxed">Os alimentos que você adicionar aparecem aqui para agilizar o próximo registro.</p>
                          </div>
                        ) : (
                          recentFoods.map((food) => {
                            const unit = foodUnits[food.id] || 'unidade'
                            const value = getQuantity(food.id)
                            const multiplier = calcMultiplier(food, unit, value)
                            return (
                              <Card key={food.id} className="hover:bg-accent">
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium">{food.name}</div>
                                        <div className="text-xs text-muted-foreground">{food.portion}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-primary text-sm">{Math.round(food.calories*multiplier)} kcal</div>
                                        <div className="text-xs text-muted-foreground">
                                          P:{Math.round(food.protein*multiplier)}g C:{Math.round(food.carbs*multiplier)}g
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Select
                                        value={unit}
                                        onValueChange={(v: FoodUnit) => setFoodUnits(prev => ({ ...prev, [food.id]: v }))}
                                      >
                                        <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="number"
                                        value={value}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value)
                                          if (!isNaN(val) && val > 0) setQuantity(food.id, val)
                                        }}
                                        className="h-7 text-center text-xs w-16"
                                        step="1"
                                        min="1"
                                      />
                                      <Button
                                        size="sm"
                                        className="h-7 flex-shrink-0"
                                        onClick={() => addFoodToSelection(food, multiplier)}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Adicionar
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* Alimentos selecionados */}
                {selectedFoods.length > 0 && (
                  <div className="space-y-2 pt-4 border-t px-6">
                    <div className="font-medium">Selecionados ({selectedFoods.length}):</div>
                    <ScrollArea className="max-h-40">
                        <div className="space-y-2 pr-4">
                          {selectedFoods.map((food, index) => {
                            const quantity = food.customQuantity || 1
                            const totalCals = Math.round(food.calories * quantity)
                            const totalProtein = Math.round(food.protein * quantity)
                            const totalCarbs = Math.round(food.carbs * quantity)
                            const totalFat = Math.round(food.fat * quantity)

                            return (
                              <div key={index} className="bg-muted p-2 rounded space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{food.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {totalCals} kcal • P:{totalProtein}g C:{totalCarbs}g G:{totalFat}g
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                    onClick={() => removeFoodFromSelection(index)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs whitespace-nowrap">Qtd:</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => updateFoodQuantity(index, Math.max(0.25, quantity - 0.25))}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      value={quantity}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value)
                                        if (!isNaN(val) && val > 0) {
                                          updateFoodQuantity(index, val)
                                        }
                                      }}
                                      className="h-6 text-center text-xs w-14"
                                      step="0.25"
                                      min="0.25"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => updateFoodQuantity(index, quantity + 0.25)}
                                    >
                                      +
                                    </Button>
                                    <span className="text-xs text-muted-foreground">× {food.portion}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    <Button onClick={saveMeal} className="w-full">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Salvar com Opinião da Bem
                    </Button>
                  </div>
                )}
              </Tabs>
            </DialogContent>
          </Dialog>

          <button
            className="flex flex-col items-center gap-2 p-4 rounded-2xl shadow-sm active:scale-95 transition-transform disabled:opacity-60 bg-chart-4/10"
            onClick={handlePhotoCapture}
            disabled={isAnalyzingPhoto}
          >
            {isAnalyzingPhoto ? (
              <Sparkles className="w-6 h-6 animate-pulse text-chart-4" />
            ) : (
              <Camera className="w-6 h-6 text-chart-4" />
            )}
            <span className="text-xs font-medium text-chart-4">{isAnalyzingPhoto ? 'Analisando...' : 'Foto'}</span>
          </button>

          <button
            className="flex flex-col items-center gap-2 p-4 rounded-2xl shadow-sm active:scale-95 transition-transform disabled:opacity-60 bg-warning/10"
            onClick={() => setIsBarcodeSheetOpen(true)}
            disabled={isAnalyzingPhoto || isLookingUpBarcode}
          >
            {isAnalyzingPhoto ? (
              <Sparkles className="w-6 h-6 animate-pulse text-warning" />
            ) : (
              <Barcode className="w-6 h-6 text-warning" />
            )}
            <span className="text-xs font-medium text-warning">
              {isAnalyzingPhoto ? 'Buscando...' : 'Código'}
            </span>
          </button>

          {/* Botão Cardápio/Dieta */}
          <button
            className="flex flex-col items-center gap-2 p-4 rounded-2xl shadow-sm active:scale-95 transition-transform bg-accent"
            onClick={() => {
              if (!savedWeeklyMenu) {
                toast.info('Nenhum cardápio salvo', { description: 'Gere um cardápio semanal personalizado primeiro.' })
                return
              }
              // Sugere o dia atual
              const dayIdx = new Date().getDay() // 0=dom, 1=seg...
              const mapped = [6, 0, 1, 2, 3, 4, 5] // dom→6, seg→0, ...
              setDietSelectedDay(Math.min(mapped[dayIdx], (savedWeeklyMenu?.days.length ?? 1) - 1))
              setDietSelectedMealIdx(null)
              setDietFoodEnabled({})
              setDietFoodValues({})
              setDietFoodUnits({})
              setIsDietDialogOpen(true)
            }}
          >
            <BookOpen className="w-6 h-6 text-secondary" />
            <span className="text-xs font-medium text-secondary">Cardápio</span>
          </button>

          {/* Dialog resultado do código de barras */}
          <Dialog open={isBarcodeDialogOpen} onOpenChange={(open) => {
            setIsBarcodeDialogOpen(open)
            if (!open) { setScannedProduct(null); setBarcodeQuantity(1); setBarcodeUnit('unidade'); setBarcodeEditMode(false); setBarcodeEdited({}) }
          }}>
            <DialogContent className="flex flex-col p-0 gap-0 overflow-hidden max-h-[92vh] sm:max-w-sm">
              <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-3 border-b">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Barcode className="w-4 h-4 text-warning" />
                  Produto Identificado
                </DialogTitle>
                <DialogDescription className="text-xs">Verifique, ajuste se necessário e adicione</DialogDescription>
              </DialogHeader>

              {scannedProduct && (() => {
                // Valores efetivos (editados ou originais)
                const eff = {
                  calories:     barcodeEdited.calories     ?? scannedProduct.calories,
                  protein:      barcodeEdited.protein      ?? scannedProduct.protein,
                  carbs:        barcodeEdited.carbs        ?? scannedProduct.carbs,
                  fat:          barcodeEdited.fat          ?? scannedProduct.fat,
                  fiber:        barcodeEdited.fiber        ?? (scannedProduct.fiber ?? 0),
                  sodium:       barcodeEdited.sodium       !== undefined ? barcodeEdited.sodium       : (scannedProduct.sodium ?? 0),
                  sugar:        barcodeEdited.sugar        !== undefined ? barcodeEdited.sugar        : (scannedProduct.sugar ?? 0),
                  saturatedFat: barcodeEdited.saturatedFat !== undefined ? barcodeEdited.saturatedFat : (scannedProduct.saturatedFat ?? 0),
                }
                const bMult = calcMultiplier(scannedProduct, barcodeUnit, barcodeQuantity)

                const editField = (key: string, label: string, unit: string, decimals = 1) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <Input
                        type="number"
                        value={(eff as Record<string, number>)[key]}
                        onChange={e => {
                          const v = parseFloat(e.target.value)
                          if (!isNaN(v) && v >= 0) setBarcodeEdited(prev => ({ ...prev, [key]: parseFloat(v.toFixed(decimals)) }))
                        }}
                        className="h-7 text-right text-xs w-20"
                        step={decimals === 0 ? 1 : 0.1}
                        min="0"
                      />
                      <span className="text-xs text-muted-foreground w-6">{unit}</span>
                    </div>
                  </div>
                )

                return (
                  <ScrollArea className="flex-1">
                    <div className="px-5 py-4 space-y-4">
                      {/* Nome + porção */}
                      <div className="rounded-xl p-3 bg-muted">
                        <p className="font-bold text-sm">{scannedProduct.name}</p>
                        <p className="text-xs mt-0.5 text-muted-foreground">Porção de referência: {scannedProduct.portion}</p>
                      </div>

                      {/* Quantidade consumida */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Quantidade consumida</Label>
                        <div className="flex items-center gap-1.5">
                          <Select value={barcodeUnit} onValueChange={(v: FoodUnit) => setBarcodeUnit(v)}>
                            <SelectTrigger className="h-9 text-sm flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={barcodeQuantity}
                            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setBarcodeQuantity(v) }}
                            className="h-9 text-center text-sm w-20"
                            step="1" min="1"
                          />
                        </div>
                      </div>

                      {/* Totais calculados */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Total consumido
                        </p>
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          {[
                            { v: Math.round(eff.calories * bMult),                         l: 'kcal',   cls: 'text-primary' },
                            { v: `${Math.round(eff.protein  * bMult * 10) / 10}g`,          l: 'Prot.',  cls: 'text-chart-5' },
                            { v: `${Math.round(eff.carbs    * bMult * 10) / 10}g`,          l: 'Carbs',  cls: 'text-chart-3' },
                            { v: `${Math.round(eff.fat      * bMult * 10) / 10}g`,          l: 'Gord.',  cls: 'text-warning' },
                          ].map(item => (
                            <div key={item.l} className="rounded-xl p-2 bg-muted/50">
                              <div className={`text-sm font-bold ${item.cls}`}>{item.v}</div>
                              <div className="text-[9px] text-muted-foreground">{item.l}</div>
                            </div>
                          ))}
                        </div>
                        {/* Micros */}
                        <div className="grid grid-cols-4 gap-1.5 text-center mt-1.5">
                          {[
                            { v: `${Math.round(eff.fiber        * bMult * 10) / 10}g`,      l: 'Fibras',   cls: 'text-success' },
                            eff.sodium      > 0 ? { v: `${Math.round(eff.sodium      * bMult)}mg`,   l: 'Sódio',    cls: 'text-destructive' }   : null,
                            eff.sugar       > 0 ? { v: `${Math.round(eff.sugar       * bMult * 10)/10}g`, l: 'Açúcar', cls: 'text-chart-4' }  : null,
                            eff.saturatedFat > 0? { v: `${Math.round(eff.saturatedFat* bMult * 10)/10}g`, l: 'G.Sat.',  cls: 'text-warning' } : null,
                          ].filter(Boolean).map(item => item && (
                            <div key={item.l} className="rounded-xl p-2 bg-muted/30">
                              <div className={`text-xs font-bold ${item.cls}`}>{item.v}</div>
                              <div className="text-[9px] text-muted-foreground">{item.l}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Editar valores por porção */}
                      <div className="border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setBarcodeEditMode(v => !v)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium bg-muted/40 hover:bg-muted transition-colors"
                        >
                          <span>Editar valores por porção</span>
                          {barcodeEditMode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {barcodeEditMode && (
                          <div className="px-3 py-3 space-y-2.5">
                            <p className="text-xs text-muted-foreground">Valores referentes a 1 porção ({scannedProduct.portion})</p>
                            {editField('calories',     'Calorias',        'kcal', 0)}
                            {editField('protein',      'Proteínas',       'g')}
                            {editField('carbs',        'Carboidratos',    'g')}
                            {editField('fat',          'Gorduras totais', 'g')}
                            {editField('fiber',        'Fibras',          'g')}
                            {editField('sodium',       'Sódio',           'mg', 0)}
                            {editField('sugar',        'Açúcares',        'g')}
                            {editField('saturatedFat', 'Gord. saturadas', 'g')}
                            {Object.keys(barcodeEdited).length > 0 && (
                              <button
                                onClick={() => setBarcodeEdited({})}
                                className="text-xs text-muted-foreground underline"
                              >
                                Restaurar valores originais
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tipo de refeição */}
                      <Select value={selectedMealType} onValueChange={(v: Meal['type']) => setSelectedMealType(v)}>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{ta.mealTypes[m.key]}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <button
                          onClick={addScannedProductToMeal}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-primary-foreground active:scale-95 transition-transform bg-primary"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar refeição
                        </button>
                        <button
                          onClick={() => setIsBarcodeDialogOpen(false)}
                          className="px-4 py-3 rounded-xl active:scale-95 transition-transform bg-muted text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </ScrollArea>
                )
              })()}
            </DialogContent>
          </Dialog>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0 }}
          />
          <input
            ref={barcodeFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleBarcodeFileChange}
            style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0 }}
          />
        </div>

        {/* Calculadora de Substituições */}
        <SubstitutionCalculator />

        {/* Melhores Alimentos e Receitas */}
        <div className="space-y-3">
          <BestFoodsDialog />
          <RecipesDialog />
        </div>

        {/* Refeições do dia */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Refeições de Hoje</h2>
          {todayMeals.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center shadow-sm">
              <img src="/mascots/koala-cansado.png" alt="a BEM aguardando seu primeiro registro do dia" className="w-24 h-24 mx-auto object-contain mb-3" />
              <p className="text-sm font-semibold text-foreground">Nenhuma refeição registrada ainda hoje</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Comece pelo café da manhã — busque um alimento, tire uma foto ou use seu cardápio!</p>
            </div>
          ) : (
            todayMeals.map((meal) => {
              const Icon = getMealIcon(meal.type)
              return (
                <div key={meal.id} className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{getMealLabel(meal.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(meal.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-primary">{meal.totalCalories} kcal</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditMeal(meal)}>
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeMeal(meal.id)}>
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {meal.foods.map((food, index) => {
                      // Reflete a quantidade editada (customQuantity) na porção exibida:
                      // 100g base com 0,8x → "80g". Sem gramas extraíveis, mostra "× 0,8".
                      const mult = food.customQuantity || 1
                      const grams = extractPortionGrams(food.portion)
                      const displayPortion = grams
                        ? `${Math.round(grams * mult)}g`
                        : mult !== 1
                          ? `${food.portion} × ${mult.toFixed(1).replace(/\.0$/, '').replace('.', ',')}`
                          : food.portion
                      return (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="font-medium">{food.name}</span>
                          <span className="text-muted-foreground">{displayPortion}</span>
                        </div>
                      )
                    })}
                    <div className="flex gap-1.5 pt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-chart-5/10 text-chart-5 rounded-full font-medium">P: {Math.round(meal.totalProtein)}g</span>
                      <span className="text-xs px-2 py-0.5 bg-chart-3/10 text-chart-3 rounded-full font-medium">C: {Math.round(meal.totalCarbs)}g</span>
                      <span className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full font-medium">G: {Math.round(meal.totalFat)}g</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal — resultado da foto do alimento (múltiplos alimentos) */}
      {photoScannedFoods.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => { setPhotoScannedFoods([]); setPhotoImageUrl(null); setPhotoFoodQuantities({}) }}
        >
          <div
            className="w-full rounded-t-2xl overflow-hidden bg-background flex flex-col"
            style={{ maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Foto do alimento */}
            {photoImageUrl && (
              <div className="w-full flex-shrink-0 flex justify-center bg-black/5">
                <div className="relative w-full max-w-sm">
                  <img
                    src={photoImageUrl}
                    alt="Alimento"
                    className="w-full object-contain max-h-56"
                    style={{ display: 'block' }}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <p className="font-bold text-white text-sm drop-shadow">
                      {photoScannedFoods.length} alimento{photoScannedFoods.length > 1 ? 's' : ''} identificado{photoScannedFoods.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 space-y-3 overflow-y-auto" style={{ paddingBottom: 'calc(1.25rem + 80px)' }}>
              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  Os valores identificados por foto são <strong>estimativas aproximadas</strong>. Ajuste as quantidades conforme necessário antes de confirmar.
                </p>
              </div>

              {/* Lista de alimentos */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Alimentos identificados:</p>
                {photoScannedFoods.map((food) => {
                  const qty = photoFoodQuantities[food.id] || 1
                  const mult = calcMultiplier(food, photoFoodUnits[food.id] || 'unidade', qty)
                  return (
                    <div key={food.id} className="rounded-xl border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{food.name}</p>
                          <p className="text-xs text-muted-foreground">{food.portion}</p>
                        </div>
                        <p className="font-bold text-primary text-sm whitespace-nowrap">{Math.round(food.calories * mult)} kcal</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-chart-5/10">
                          <span className="text-[9px] text-chart-5 font-medium leading-tight">Proteína</span>
                          <span className="text-xs text-chart-5 font-bold">{Math.round(food.protein * mult)}g</span>
                        </div>
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-chart-3/10">
                          <span className="text-[9px] text-chart-3 font-medium leading-tight">Carboidrato</span>
                          <span className="text-xs text-chart-3 font-bold">{Math.round(food.carbs * mult)}g</span>
                        </div>
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-warning/10">
                          <span className="text-[9px] text-warning font-medium leading-tight">Gordura</span>
                          <span className="text-xs text-warning font-bold">{Math.round(food.fat * mult)}g</span>
                        </div>
                        {(food.sodium ?? 0) > 0 && (
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-destructive/10">
                            <span className="text-[9px] text-destructive font-medium leading-tight">Sódio</span>
                            <span className="text-xs text-destructive font-bold">{Math.round((food.sodium ?? 0) * mult)}mg</span>
                          </div>
                        )}
                        {(food.sugar ?? 0) > 0 && (
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-chart-4/10">
                            <span className="text-[9px] text-chart-4 font-medium leading-tight">Açúcar</span>
                            <span className="text-xs text-chart-4 font-bold">{Math.round((food.sugar ?? 0) * mult * 10) / 10}g</span>
                          </div>
                        )}
                        {(food.saturatedFat ?? 0) > 0 && (
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-warning/10">
                            <span className="text-[9px] text-warning font-medium leading-tight text-center">Gord. Sat.</span>
                            <span className="text-xs text-warning font-bold">{Math.round((food.saturatedFat ?? 0) * mult * 10) / 10}g</span>
                          </div>
                        )}
                        {(food.omega3 ?? 0) > 0 && (
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-info/10">
                            <span className="text-[9px] text-info font-medium leading-tight">Ômega-3</span>
                            <span className="text-xs text-info font-bold">{Math.round((food.omega3 ?? 0) * mult * 100) / 100}g</span>
                          </div>
                        )}
                        {(food.cholesterol ?? 0) > 0 && (
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-accent">
                            <span className="text-[9px] text-secondary font-medium leading-tight">Colesterol</span>
                            <span className="text-xs text-secondary font-bold">{Math.round((food.cholesterol ?? 0) * mult)}mg</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={photoFoodUnits[food.id] || 'unidade'}
                          onValueChange={(v: FoodUnit) => setPhotoFoodUnits(prev => ({ ...prev, [food.id]: v }))}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={qty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val) && val > 0) updatePhotoFoodQuantity(food.id, val)
                          }}
                          className="h-7 text-center text-xs w-16"
                          step="1"
                          min="1"
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 flex-shrink-0 text-destructive"
                          onClick={() => removePhotoFood(food.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total estimado (quando múltiplos alimentos) */}
              {photoScannedFoods.length > 1 && (
                <div className="rounded-xl border p-3 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Total estimado da refeição</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-primary text-sm">
                      {Math.round(photoScannedFoods.reduce((s, f) => s + f.calories * calcMultiplier(f, photoFoodUnits[f.id] || 'unidade', photoFoodQuantities[f.id] || 1), 0))} kcal
                    </span>
                    <span className="text-xs text-chart-5">P:{Math.round(photoScannedFoods.reduce((s, f) => s + f.protein * calcMultiplier(f, photoFoodUnits[f.id] || 'unidade', photoFoodQuantities[f.id] || 1), 0))}g</span>
                    <span className="text-xs text-chart-3">C:{Math.round(photoScannedFoods.reduce((s, f) => s + f.carbs * calcMultiplier(f, photoFoodUnits[f.id] || 'unidade', photoFoodQuantities[f.id] || 1), 0))}g</span>
                    <span className="text-xs text-warning">G:{Math.round(photoScannedFoods.reduce((s, f) => s + f.fat * calcMultiplier(f, photoFoodUnits[f.id] || 'unidade', photoFoodQuantities[f.id] || 1), 0))}g</span>
                  </div>
                </div>
              )}

              {/* Tipo de refeição */}
              <Select value={photoMealType} onValueChange={(v: Meal['type']) => setPhotoMealType(v)}>
                <SelectTrigger className="h-11 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{ta.mealTypes[m.key]}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Botões */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPhotoAddItemOpen(true)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform border border-primary text-primary bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar itens
                </button>
                <button
                  onClick={savePhotoMeal}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-95 transition-transform bg-primary"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Sheet — entrada manual + opção de foto */}
      {isBarcodeSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setIsBarcodeSheetOpen(false); setManualBarcode('') }}
        >
          <div
            className="w-full rounded-t-2xl p-5 space-y-4 bg-background"
            style={{ paddingBottom: 'calc(1.25rem + 80px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto bg-muted-foreground/30" />
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-warning" />
              <p className="text-sm font-semibold">Código de Barras</p>
            </div>

            {/* Entrada manual */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Digite o número do código de barras do produto</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 7891000315507"
                  value={manualBarcode}
                  onChange={e => setManualBarcode(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  className="flex-1 h-11 rounded-xl text-sm"
                  onKeyDown={e => { if (e.key === 'Enter') lookupBarcode(manualBarcode) }}
                />
                <button
                  onClick={() => lookupBarcode(manualBarcode)}
                  disabled={isLookingUpBarcode || manualBarcode.length < 8}
                  className="px-4 h-11 rounded-xl font-semibold text-sm text-warning-foreground disabled:opacity-50 active:scale-95 transition-transform flex items-center gap-1.5 bg-warning"
                >
                  {isLookingUpBarcode ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4" />}
                  Buscar
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Opção foto */}
            <button
              className="flex items-center gap-3 w-full p-3.5 rounded-xl active:scale-95 transition-transform text-left bg-warning/10"
              onClick={() => { barcodeFileInputRef.current?.click() }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-warning/15">
                <ScanLine className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold">Tirar foto do código</p>
                <p className="text-xs text-muted-foreground">Tente com boa iluminação e foco</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Sheet — Registro via Cardápio/Dieta */}
      {isDietDialogOpen && savedWeeklyMenu && (() => {
        const days = savedWeeklyMenu.days
        const currentDay = days[dietSelectedDay]
        const currentMeal = dietSelectedMealIdx !== null ? currentDay?.meals[dietSelectedMealIdx] : null
        const foodItems = currentMeal
          ? dietMealToFoodItems(currentMeal.foods, { calories: currentMeal.calories, protein: currentMeal.protein, carbs: currentMeal.carbs, fat: currentMeal.fat, fiber: currentMeal.fiber })
          : []

        const enabledCount = foodItems.filter((_, i) => dietFoodEnabled[i] !== false).length
        const totalCals = foodItems.reduce((s, food, i) => {
          if (dietFoodEnabled[i] === false) return s
          const mult = calcMultiplier(food, dietFoodUnits[i] || 'unidade', dietFoodValues[i] || 1)
          return s + food.calories * mult
        }, 0)

        return (
          <div
            className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setIsDietDialogOpen(false)}
          >
            <div
              className="w-full rounded-t-2xl bg-background flex flex-col"
              style={{ maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b space-y-1">
                <div className="w-10 h-1 rounded-full mx-auto mb-3 bg-muted-foreground/30" />
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-secondary" />
                  <p className="font-semibold text-sm">Registrar pelo Cardápio</p>
                </div>
                <p className="text-xs text-muted-foreground">{savedWeeklyMenu.title}</p>
              </div>

              <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'calc(1rem + 80px)' }}>
                {/* Seleção do dia */}
                <div className="px-5 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dia da semana</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {days.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => { setDietSelectedDay(i); setDietSelectedMealIdx(null); setDietFoodEnabled({}); setDietFoodValues({}); setDietFoodUnits({}) }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          dietSelectedDay === i
                            ? 'bg-secondary text-secondary-foreground border-secondary'
                            : 'border-border text-muted-foreground bg-muted'
                        }`}
                      >
                        {d.day.split('-')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Refeições do dia */}
                {currentDay && (
                  <div className="px-5 pt-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Refeição</p>
                    <div className="space-y-2">
                      {currentDay.meals.map((meal, mi) => (
                        <button
                          key={mi}
                          onClick={() => {
                            setDietSelectedMealIdx(mi)
                            setDietFoodEnabled({})
                            setDietFoodValues({})
                            setDietFoodUnits({})
                            // Mapeia o campo "type" do cardápio (ex: "Café da Manhã") para o tipo interno do app
                            const t = (meal.type || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            let mapped: Meal['type'] = 'cafe'
                            if (t.includes('almoco') || t.includes('almoço')) mapped = 'almoco'
                            else if (t.includes('jantar')) mapped = 'jantar'
                            else if (t.includes('ceia')) mapped = 'ceia'
                            else if (t.includes('lanche') && t.includes('tarde')) mapped = 'lanche_tarde'
                            else if (t.includes('lanche') && (t.includes('manha') || t.includes('manhã'))) mapped = 'lanche_manha'
                            else if (t.includes('lanche')) mapped = 'lanche_tarde'
                            setDietMealType(mapped)
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${
                            dietSelectedMealIdx === mi
                              ? 'border-secondary bg-secondary/10'
                              : 'border-border bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              {/* Exibe igual ao SavedMenuCard: meal.type como título principal */}
                              <p className="text-sm font-medium">{meal.type}</p>
                              {meal.name && meal.name !== meal.type && (
                                <p className="text-xs text-muted-foreground">{meal.name}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">{meal.foods.length} item{meal.foods.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-secondary">{meal.calories} kcal</p>
                              <p className="text-xs text-muted-foreground">P:{meal.protein}g C:{meal.carbs}g G:{meal.fat}g{meal.fiber != null ? ` Fib:${meal.fiber}g` : ''}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de alimentos da refeição selecionada */}
                {currentMeal && foodItems.length > 0 && (
                  <div className="px-5 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alimentos ({enabledCount}/{foodItems.length})</p>
                      <p className="text-sm font-bold text-secondary">{Math.round(totalCals)} kcal</p>
                    </div>

                    <div className="space-y-2">
                      {foodItems.map((food, i) => {
                        const isEnabled = dietFoodEnabled[i] !== false
                        const value = dietFoodValues[i] || 1
                        const unit = dietFoodUnits[i] || 'unidade'
                        const mult = calcMultiplier(food, unit, value)
                        return (
                          <div
                            key={i}
                            className={`rounded-xl border p-3 space-y-2 transition-opacity ${isEnabled ? '' : 'opacity-40'}`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Toggle (checkbox visual) */}
                              <button
                                onClick={() => setDietFoodEnabled(prev => ({ ...prev, [i]: !isEnabled }))}
                                className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                                  isEnabled ? 'bg-secondary border-secondary' : 'border-border bg-background'
                                }`}
                              >
                                {isEnabled && <span className="text-secondary-foreground text-xs font-bold leading-none">✓</span>}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-snug">{food.name}</p>
                                <p className="text-xs text-muted-foreground">{food.portion} · {Math.round(food.calories * mult)} kcal</p>
                              </div>
                              <button
                                onClick={() => setDietFoodEnabled(prev => ({ ...prev, [i]: false }))}
                                className="flex-shrink-0 text-muted-foreground hover:text-destructive p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {isEnabled && (
                              <div className="flex items-center gap-1.5 pl-7">
                                <Select
                                  value={unit}
                                  onValueChange={(v: FoodUnit) => setDietFoodUnits(prev => ({ ...prev, [i]: v }))}
                                >
                                  <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  value={value}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value)
                                    if (!isNaN(val) && val > 0) setDietFoodValues(prev => ({ ...prev, [i]: val }))
                                  }}
                                  className="h-7 text-center text-xs w-16"
                                  step="1"
                                  min="1"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Tipo de refeição */}
                    <Select value={dietMealType} onValueChange={(v: Meal['type']) => setDietMealType(v)}>
                      <SelectTrigger className="h-11 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{ta.mealTypes[m.key]}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <button
                      disabled={enabledCount === 0}
                      onClick={() => saveDietMeal(foodItems, dietFoodEnabled, dietFoodValues, dietFoodUnits)}
                      className="w-full py-3.5 rounded-xl font-semibold text-sm text-secondary-foreground flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 bg-secondary"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar refeição · {Math.round(totalCals)} kcal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Sheet — Adicionar itens à refeição da foto */}
      {isPhotoAddItemOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={() => { setIsPhotoAddItemOpen(false); setPhotoAddSearch('') }}
        >
          <div
            className="w-full rounded-t-2xl bg-background flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b space-y-3 flex-shrink-0">
              <div className="w-10 h-1 rounded-full mx-auto bg-muted-foreground/30" />
              <p className="text-sm font-semibold text-center">Adicionar mais itens</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alimento..."
                  value={photoAddSearch}
                  onChange={e => setPhotoAddSearch(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {BRAZILIAN_FOODS.filter(f => f.name.toLowerCase().includes(photoAddSearch.toLowerCase())).slice(0, 20).map(food => (
                  <div key={food.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{food.portion} · {food.calories} kcal</p>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 flex-shrink-0"
                      onClick={() => {
                        const newId = `photo-add-${Date.now()}`
                        const newFood = { ...food, id: newId }
                        setPhotoScannedFoods(prev => [...prev, newFood])
                        setPhotoFoodQuantities(prev => ({ ...prev, [newId]: 1 }))
                        setPhotoFoodUnits(prev => ({ ...prev, [newId]: 'unidade' }))
                        setIsPhotoAddItemOpen(false)
                        setPhotoAddSearch('')
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Sheet — Editar refeição registrada */}
      {editingMeal && (() => {
        // Totais recalculados em tempo real
        const liveTotal = editMealFoods.reduce((s, food, i) => {
          const mult = calcMultiplier(food, editFoodUnits[i] || 'unidade', editFoodQtys[i] || 1)
          return {
            cal:  s.cal  + food.calories * mult,
            prot: s.prot + food.protein  * mult,
            carb: s.carb + food.carbs    * mult,
            fat:  s.fat  + food.fat      * mult,
            fib:  s.fib  + (food.fiber ?? 0) * mult,
            sod:  s.sod  + (food.sodium  ?? 0) * mult,
          }
        }, { cal: 0, prot: 0, carb: 0, fat: 0, fib: 0, sod: 0 })

        return (
          <div
            className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setEditingMeal(null)}
          >
            <div
              className="w-full rounded-t-2xl bg-background flex flex-col"
              style={{ maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b">
                <div className="w-10 h-1 rounded-full mx-auto mb-3 bg-muted-foreground/30" />
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-primary" />
                    Editar refeição
                  </p>
                  <button onClick={() => setEditingMeal(null)}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4" style={{ paddingBottom: 'calc(1rem + 80px)' }}>

                {/* Tipo de refeição */}
                <Select value={editMealType} onValueChange={(v: Meal['type']) => setEditMealType(v)}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{ta.mealTypes[m.key]}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Totais ao vivo */}
                <div className="rounded-xl p-3 bg-muted/40 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total recalculado</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-primary">{Math.round(liveTotal.cal)} kcal</span>
                    <span className="text-xs text-chart-5">P:{Math.round(liveTotal.prot)}g</span>
                    <span className="text-xs text-chart-3">C:{Math.round(liveTotal.carb)}g</span>
                    <span className="text-xs text-warning">G:{Math.round(liveTotal.fat)}g</span>
                    {liveTotal.fib > 0 && <span className="text-xs text-success">F:{Math.round(liveTotal.fib * 10)/10}g</span>}
                    {liveTotal.sod > 0 && <span className="text-xs text-destructive">Na:{Math.round(liveTotal.sod)}mg</span>}
                  </div>
                </div>

                {/* Lista de alimentos */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Alimentos ({editMealFoods.length})
                  </p>

                  {editMealFoods.map((food, i) => {
                    const unit = editFoodUnits[i] || 'unidade'
                    const value = editFoodQtys[i] || 1
                    const mult = calcMultiplier(food, unit, value)
                    const cals = Math.round(food.calories * mult)
                    const prot = Math.round(food.protein  * mult * 10) / 10
                    const carb = Math.round(food.carbs    * mult * 10) / 10
                    const fat  = Math.round(food.fat      * mult * 10) / 10
                    const fib  = food.fiber   ? Math.round((food.fiber   ?? 0) * mult * 10) / 10 : null
                    const sod  = food.sodium  ? Math.round((food.sodium  ?? 0) * mult) : null
                    const sug  = food.sugar   ? Math.round((food.sugar   ?? 0) * mult * 10) / 10 : null
                    const sat  = food.saturatedFat ? Math.round((food.saturatedFat ?? 0) * mult * 10) / 10 : null

                    return (
                      <div key={i} className="rounded-xl border p-3 space-y-2">
                        {/* Nome + calorias + delete */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{food.name}</p>
                            <p className="text-xs text-muted-foreground">{food.portion}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-sm font-bold text-primary">{cals} kcal</span>
                            <button
                              onClick={() => {
                                const newFoods = editMealFoods.filter((_, fi) => fi !== i)
                                // Reindexar qtys e units
                                const newQtys: Record<number, number> = {}
                                const newUnits: Record<number, FoodUnit> = {}
                                newFoods.forEach((_, ni) => {
                                  const oldIdx = ni < i ? ni : ni + 1
                                  newQtys[ni]  = editFoodQtys[oldIdx]  || 1
                                  newUnits[ni] = editFoodUnits[oldIdx] || 'unidade'
                                })
                                setEditMealFoods(newFoods)
                                setEditFoodQtys(newQtys)
                                setEditFoodUnits(newUnits)
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Macros calculados */}
                        <div className="flex gap-2 flex-wrap text-xs">
                          <span className="text-chart-5">P:{prot}g</span>
                          <span className="text-chart-3">C:{carb}g</span>
                          <span className="text-warning">G:{fat}g</span>
                          {fib !== null && fib > 0 && <span className="text-success">F:{fib}g</span>}
                          {sod !== null && sod > 0 && <span className="text-destructive">Na:{sod}mg</span>}
                          {sug !== null && sug > 0 && <span className="text-chart-4">Açú:{sug}g</span>}
                          {sat !== null && sat > 0 && <span className="text-warning">GS:{sat}g</span>}
                        </div>

                        {/* Seletor de unidade + qtd */}
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={unit}
                            onValueChange={(v: FoodUnit) => setEditFoodUnits(prev => ({ ...prev, [i]: v }))}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={value}
                            onChange={e => {
                              const v = parseFloat(e.target.value)
                              if (!isNaN(v) && v > 0) setEditFoodQtys(prev => ({ ...prev, [i]: v }))
                            }}
                            className="h-7 text-center text-xs w-16"
                            step="1"
                            min="0.1"
                          />
                        </div>
                      </div>
                    )
                  })}

                  {/* Adicionar item */}
                  {!isEditAddOpen ? (
                    <button
                      onClick={() => setIsEditAddOpen(true)}
                      className="w-full py-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5 border border-dashed rounded-xl hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar item à refeição
                    </button>
                  ) : (
                    <div className="rounded-xl border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Buscar alimento..."
                            value={editAddSearch}
                            onChange={e => setEditAddSearch(e.target.value)}
                            className="pl-8 h-8 text-xs"
                            autoFocus
                          />
                        </div>
                        <button onClick={() => { setIsEditAddOpen(false); setEditAddSearch('') }}>
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      {editAddSearch.length > 0 && (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {allFoods.filter(f => f.name.toLowerCase().includes(editAddSearch.toLowerCase())).slice(0, 10).map(food => (
                            <button
                              key={food.id}
                              onClick={() => {
                                const newIdx = editMealFoods.length
                                setEditMealFoods(prev => [...prev, food])
                                setEditFoodQtys(prev => ({ ...prev, [newIdx]: 1 }))
                                setEditFoodUnits(prev => ({ ...prev, [newIdx]: 'unidade' }))
                                setIsEditAddOpen(false)
                                setEditAddSearch('')
                              }}
                              className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div>
                                <p className="text-xs font-medium">{food.name}</p>
                                <p className="text-xs text-muted-foreground">{food.portion}</p>
                              </div>
                              <span className="text-xs font-bold text-primary ml-2 flex-shrink-0">{food.calories} kcal</span>
                            </button>
                          ))}
                          {allFoods.filter(f => f.name.toLowerCase().includes(editAddSearch.toLowerCase())).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">Nenhum resultado</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Salvar */}
                <button
                  disabled={editMealFoods.length === 0}
                  onClick={saveEditedMeal}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 bg-primary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar alterações · {Math.round(liveTotal.cal)} kcal
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Photo Source Sheet */}
      {isPhotoSourceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsPhotoSourceOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl p-5 space-y-3 bg-background"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-1 bg-muted-foreground/30" />
            <p className="text-sm font-semibold text-center">
              Identificar Alimento pela Foto
            </p>
            <button
              className="flex items-center gap-3 w-full p-3.5 rounded-xl active:scale-95 transition-transform text-left bg-muted"
              onClick={() => { fileInputRef.current?.click(); setIsPhotoSourceOpen(false) }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-chart-4/10">
                <Camera className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Tirar foto</p>
                <p className="text-xs text-muted-foreground">Usar câmera do dispositivo</p>
              </div>
            </button>
            <button
              className="flex items-center gap-3 w-full p-3.5 rounded-xl active:scale-95 transition-transform text-left bg-muted"
              onClick={() => {
                const input = fileInputRef.current
                if (input) { input.removeAttribute('capture'); input.click() }
                setIsPhotoSourceOpen(false)
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-chart-4/10">
                <ImageIcon className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Selecionar da galeria</p>
                <p className="text-xs text-muted-foreground">Escolher imagem salva</p>
              </div>
            </button>
            <button
              className="w-full py-3 text-sm text-center rounded-xl bg-muted text-muted-foreground"
              onClick={() => setIsPhotoSourceOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
