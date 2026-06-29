import { useState, useMemo } from 'react'
import { ArrowDown, Calculator, ChevronDown, Loader2 } from 'lucide-react'
import { BRAZILIAN_FOODS } from '@/data/brazilian-foods'
import { FOOD_SUBSTITUTIONS } from '@/data/food-substitutions'
import { estimateFoodNutrition } from '@/lib/custom-food'
import { useTranslation } from '@/contexts/LanguageContext'

type FoodUnit = 'unidade' | 'colher' | 'gramas'

interface CalcFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  portionGrams: number
  portionLabel: string
}

// ── helpers ─────────────────────────────────────────────────────────────────

function extractGrams(portion: string): number | null {
  const m = portion.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

/** Build a unified, deduplicated food DB from BRAZILIAN_FOODS + FOOD_SUBSTITUTIONS */
function buildFoodDb(): CalcFood[] {
  const seen = new Set<string>()
  const foods: CalcFood[] = []

  const add = (
    name: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    portionLabel: string
  ) => {
    const key = name.toLowerCase()
    if (seen.has(key)) return
    const portionGrams = extractGrams(portionLabel)
    if (!portionGrams || portionGrams <= 0) return
    seen.add(key)
    foods.push({ name, calories, protein, carbs, fat, portionGrams, portionLabel })
  }

  for (const f of BRAZILIAN_FOODS) add(f.name, f.calories, f.protein, f.carbs, f.fat, f.portion)

  for (const sub of FOOD_SUBSTITUTIONS) {
    for (const s of sub.substitutes) {
      add(s.name, s.calories, s.protein, s.carbs, s.fat, s.portion)
    }
  }

  return foods
}

// ── calculation ──────────────────────────────────────────────────────────────

interface CalcResult {
  value: number
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

function calculateEquivalent(
  orig: CalcFood,
  origUnit: FoodUnit,
  origValue: number,
  repl: CalcFood,
  replUnit: FoodUnit
): CalcResult {
  // original grams consumed
  const origGrams =
    origUnit === 'gramas' ? origValue
    : origUnit === 'unidade' ? origValue * orig.portionGrams
    : origValue * 15 // colher = 15g

  // target calories from original portion
  const caloriesPer1g = orig.calories / orig.portionGrams
  const targetCal = origGrams * caloriesPer1g

  // replacement grams needed to match calories
  const replCalPer1g = repl.calories / repl.portionGrams
  const replGrams = replCalPer1g > 0 ? targetCal / replCalPer1g : 0

  // convert grams → chosen unit
  const replValue =
    replUnit === 'gramas' ? replGrams
    : replUnit === 'unidade' ? replGrams / repl.portionGrams
    : replGrams / 15

  const scale = replGrams / repl.portionGrams
  return {
    value: Math.round(replValue * 10) / 10,
    grams: Math.round(replGrams),
    calories: Math.round(targetCal),
    protein: Math.round(repl.protein * scale * 10) / 10,
    carbs: Math.round(repl.carbs * scale * 10) / 10,
    fat: Math.round(repl.fat * scale * 10) / 10,
  }
}

// ── search dropdown ──────────────────────────────────────────────────────────

function FoodSearch({
  label,
  value,
  onChange,
  onSelect,
  foodDb,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSelect: (f: CalcFood) => void
  foodDb: CalcFood[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => {
    if (value.trim().length < 2) return []
    const q = value.toLowerCase()
    return foodDb.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8)
  }, [value, foodDb])

  return (
    <div className="relative">
      <label className="text-[11px] font-medium block mb-1 text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full text-xs px-3 py-2 rounded-lg border outline-none border-border text-foreground bg-card"
      />
      {open && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-0.5 rounded-xl shadow-lg border overflow-hidden bg-card border-border"
        >
          {suggestions.map((f, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted border-b last:border-0 border-border text-foreground"
              onMouseDown={() => { onSelect(f); onChange(f.name); setOpen(false) }}
            >
              <span className="font-medium">{f.name}</span>
              <span className="ml-2 text-muted-foreground">{f.portionLabel} · {f.calories} kcal</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function SubstitutionCalculator() {
  const foodDb = useMemo(buildFoodDb, [])
  const { t } = useTranslation()
  const tc = t.calculator

  const UNIT_LABELS: Record<FoodUnit, string> = {
    unidade: tc.unitOptionPlural,
    colher: tc.tablespoonsPlural,
    gramas: tc.grams,
  }

  const [origName, setOrigName] = useState('')
  const [origFood, setOrigFood] = useState<CalcFood | null>(null)
  const [origValue, setOrigValue] = useState('1')
  const [origUnit, setOrigUnit] = useState<FoodUnit>('unidade')

  const [replName, setReplName] = useState('')
  const [replFood, setReplFood] = useState<CalcFood | null>(null)
  const [replUnit, setReplUnit] = useState<FoodUnit>('gramas')

  const [result, setResult] = useState<CalcResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCalculate = async () => {
    setError('')
    setResult(null)

    const value = parseFloat(origValue.replace(',', '.'))
    if (!value || value <= 0) { setError(tc.errorInvalidQty); return }

    let orig = origFood
    let repl = replFood

    // Try AI lookup for foods not in the database
    setLoading(true)
    try {
      if (!orig) {
        if (!origName.trim()) { setError(tc.errorNoOriginal); return }
        const portion = origUnit === 'gramas' ? `${value}g` : origUnit === 'colher' ? `${value} colher(es)` : `${value} unidade(s)`
        const ai = await estimateFoodNutrition(origName.trim(), portion)
        const grams = origUnit === 'gramas' ? value : origUnit === 'unidade' ? 100 : 15
        orig = { name: origName.trim(), calories: ai.calories, protein: ai.protein, carbs: ai.carbs, fat: ai.fat, portionGrams: grams, portionLabel: `${grams}g` }
      }

      if (!repl) {
        if (!replName.trim()) { setError(tc.errorNoReplacement); return }
        const ai = await estimateFoodNutrition(replName.trim(), '100g')
        repl = { name: replName.trim(), calories: ai.calories, protein: ai.protein, carbs: ai.carbs, fat: ai.fat, portionGrams: 100, portionLabel: '100g' }
      }

      setResult(calculateEquivalent(orig, origUnit, value, repl, replUnit))
    } catch {
      setError(tc.errorCalc)
    } finally {
      setLoading(false)
    }
  }

  const unitLabel = (u: FoodUnit, val: number) => {
    if (u === 'gramas') return `${val}g`
    if (u === 'colher') return `${val} ${tc.tablespoonsPlural}`
    return `${val} ${tc.unitOptionPlural}`
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
          <Calculator className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{tc.title}</p>
          <p className="text-[10px] text-muted-foreground">{tc.subtitle}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Alimento original */}
        <div className="rounded-xl p-3 space-y-2.5 border border-border">
          <p className="text-[11px] font-semibold text-primary">{tc.originalFood}</p>
          <FoodSearch
            label={tc.name}
            value={origName}
            onChange={v => { setOrigName(v); if (origFood && origFood.name !== v) setOrigFood(null); setResult(null) }}
            onSelect={f => { setOrigFood(f); setResult(null) }}
            foodDb={foodDb}
            placeholder={tc.foodPlaceholder}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] font-medium block mb-1 text-muted-foreground">{tc.quantity}</label>
              <input
                type="number"
                value={origValue}
                min="0.1"
                step="0.5"
                onChange={e => { setOrigValue(e.target.value); setResult(null) }}
                className="w-full text-xs px-3 py-2 rounded-lg border outline-none border-border text-foreground bg-card"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-medium block mb-1 text-muted-foreground">{tc.unit}</label>
              <div className="relative">
                <select
                  value={origUnit}
                  onChange={e => { setOrigUnit(e.target.value as FoodUnit); setResult(null) }}
                  className="w-full text-xs px-3 py-2 rounded-lg border outline-none appearance-none pr-7 border-border text-foreground bg-card"
                >
                  {(Object.keys(UNIT_LABELS) as FoodUnit[]).map(u => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>
          {origFood && (
            <p className="text-[10px] text-muted-foreground">
              {tc.reference} {origFood.portionLabel} = {origFood.calories} kcal · P:{origFood.protein}g · C:{origFood.carbs}g · G:{origFood.fat}g
            </p>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10">
            <ArrowDown className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>

        {/* Alimento substituto */}
        <div className="rounded-xl p-3 space-y-2.5 border border-border">
          <p className="text-[11px] font-semibold text-primary">{tc.replacementFood}</p>
          <FoodSearch
            label={tc.name}
            value={replName}
            onChange={v => { setReplName(v); if (replFood && replFood.name !== v) setReplFood(null); setResult(null) }}
            onSelect={f => { setReplFood(f); setResult(null) }}
            foodDb={foodDb}
            placeholder={tc.foodPlaceholder}
          />
          <div>
            <label className="text-[11px] font-medium block mb-1 text-muted-foreground">{tc.showResultIn}</label>
            <div className="flex gap-1.5">
              {(Object.keys(UNIT_LABELS) as FoodUnit[]).map(u => (
                <button
                  key={u}
                  onClick={() => { setReplUnit(u); setResult(null) }}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    replUnit === u ? 'bg-primary text-card' : 'bg-border text-muted-foreground'
                  }`}
                >
                  {u === 'unidade' ? tc.unitOption : u === 'colher' ? tc.tablespoons : tc.grams}
                </button>
              ))}
            </div>
          </div>
          {replFood && (
            <p className="text-[10px] text-muted-foreground">
              {tc.reference} {replFood.portionLabel} = {replFood.calories} kcal · P:{replFood.protein}g · C:{replFood.carbs}g · G:{replFood.fat}g
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-center text-destructive">{error}</p>
        )}

        {/* Calcular button */}
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm text-card flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 bg-primary"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          {loading ? tc.calculating : tc.calculateButton}
        </button>

        {/* Result */}
        {result && (
          <div className="rounded-xl p-3 space-y-3 border-2 border-primary/15 bg-primary/5">
            <p className="text-[11px] font-semibold text-primary">{tc.result}</p>

            {/* Main equivalence */}
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                {unitLabel(origUnit, parseFloat(origValue))} {tc.ofWord} <strong className="text-foreground">{origName}</strong>
              </p>
              <p className="text-lg font-bold my-1 text-foreground">
                ≈ <span className="text-primary">{unitLabel(replUnit, result.value)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {tc.ofWord} <strong className="text-foreground">{replName}</strong>
                {replUnit !== 'gramas' && (
                  <span className="text-muted-foreground"> ({result.grams}g)</span>
                )}
              </p>
            </div>

            {/* Macro comparison */}
            <div>
              <p className="text-[10px] font-semibold mb-1.5 text-muted-foreground">{tc.nutritionEquivalent}</p>
              <div className="flex justify-between text-center">
                {[
                  { v: result.calories, l: 'kcal', c: 'text-primary' },
                  { v: `${result.protein}g`, l: tc.protAbbr, c: 'text-chart-5' },
                  { v: `${result.carbs}g`, l: tc.carbsAbbr, c: 'text-chart-3' },
                  { v: `${result.fat}g`, l: tc.fatAbbr, c: 'text-warning' },
                ].map(item => (
                  <div key={item.l} className="flex-1">
                    <div className={`text-sm font-bold ${item.c}`}>{item.v}</div>
                    <div className="text-[9px] text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
