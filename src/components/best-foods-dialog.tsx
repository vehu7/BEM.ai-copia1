import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Award, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { BEST_BRAZILIAN_FOODS, SMART_SHOPPING_TIPS } from '@/data/best-brazilian-foods'
import type { BestFoodCategory } from '@/data/best-brazilian-foods'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/contexts/AppContext'
import { generateBestFoods, generateCountryShoppingTips } from '@/lib/best-foods-generator'
import type { ShoppingTip } from '@/lib/best-foods-generator'

const GOAL_LABEL: Record<string, string> = {
  perder_peso:  'Emagrecimento',
  ganhar_massa: 'Ganho de massa',
  manter_peso:  'Manutenção',
  saude_geral:  'Saúde geral',
}

export function BestFoodsDialog() {
  const { user } = useApp()
  const [foods, setFoods] = useState<BestFoodCategory[] | null>(null)
  const [countryTips, setCountryTips] = useState<ShoppingTip[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [tipsLoading, setTipsLoading] = useState(false)
  const [country, setCountry] = useState('Brasil')
  const [open, setOpen] = useState(false)

  const goal = user?.goal ?? 'saude_geral'

  const loadTips = async (countryVal: string) => {
    setTipsLoading(true)
    try {
      const tips = await generateCountryShoppingTips(countryVal)
      setCountryTips(tips)
    } catch {
      setCountryTips([])
    } finally {
      setTipsLoading(false)
    }
  }

  const load = async (countryVal: string) => {
    setLoading(true)
    try {
      const result = await generateBestFoods(goal, countryVal)
      setFoods(result)
    } catch {
      setFoods(BEST_BRAZILIAN_FOODS)
    } finally {
      setLoading(false)
    }
    loadTips(countryVal)
  }

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !foods && !loading) load(country)
  }

  const handleRefresh = () => {
    setFoods(null)
    setCountryTips(null)
    load(country)
  }

  const displayFoods = foods ?? BEST_BRAZILIAN_FOODS

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-xl shadow-sm border border-border w-full active:scale-[0.98] transition-transform text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-warning/10">
            <Award className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-foreground">Melhores Alimentos</p>
            <p className="text-[10px] text-muted-foreground">Top nutrientes para seu objetivo</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
        </button>
      </DialogTrigger>

      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden max-h-[92vh] sm:max-w-xl bg-card text-foreground"
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base text-foreground">
            <Award className="w-4 h-4 text-warning" />
            Melhores Alimentos
          </DialogTitle>
          <DialogDescription className="text-xs">
            Seleção especializada para <strong>{GOAL_LABEL[goal] ?? 'seu objetivo'}</strong> · baseado em evidências nutricionais
          </DialogDescription>

          {/* Country + refresh row */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="País de referência..."
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border text-foreground bg-muted outline-none"
            />
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors bg-primary/10 text-primary"
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              Atualizar
            </button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="foods" className="flex-1 overflow-hidden flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mx-5 mt-3 mb-0" style={{ width: 'calc(100% - 2.5rem)' }}>
            <TabsTrigger value="foods">Alimentos</TabsTrigger>
            <TabsTrigger value="tips">Dicas de Compra</TabsTrigger>
          </TabsList>

          <TabsContent value="foods" className="flex-1 overflow-y-auto min-h-0 mt-0 px-5 py-4 data-[state=active]:flex data-[state=active]:flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Consultando especialista em nutrição...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayFoods.map((category) => (
                  <div key={category.category} className="rounded-xl overflow-hidden border border-border">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-muted">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{category.category}</p>
                        <p className="text-[10px] text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="px-3 py-2 space-y-2">
                      {category.foods.map((food) => (
                        <div key={food.name} className="rounded-lg p-2.5 bg-muted border border-border">
                          <div className="mb-1">
                            <p className="font-semibold text-xs text-foreground">{food.name}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{food.benefits}</p>
                          <p className="text-[10px] mt-0.5 text-muted-foreground">
                            <strong>Porção:</strong> {food.portion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tips" className="flex-1 overflow-y-auto min-h-0 mt-0 px-5 py-4 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="space-y-2">
              {/* Dicas universais */}
              {SMART_SHOPPING_TIPS.map((tip) => (
                <div key={tip.title} className="rounded-xl p-3 border border-border">
                  <p className="font-semibold text-xs mb-0.5 text-foreground">{tip.title}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{tip.description}</p>
                </div>
              ))}

              {/* Dicas específicas do país — sem título */}
              {tipsLoading && (
                <div className="rounded-xl p-4 text-center border border-border">
                  <p className="text-xs text-muted-foreground">Buscando dicas locais...</p>
                </div>
              )}
              {!tipsLoading && countryTips && countryTips.map((tip, i) => (
                <div key={i} className="rounded-xl p-3 border border-primary bg-primary/5">
                  <p className="font-semibold text-xs mb-0.5 text-primary">{tip.title}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{tip.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
