import { useState, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingDown, TrendingUp, Scale, Target, Calendar, Camera, Trash2,
  GitCompareArrows, X, Upload, Ruler, Sparkles, ChevronDown, ChevronUp, Loader2,
  CheckCircle, AlertCircle, Lightbulb, Activity, Download,
} from 'lucide-react'
import jsPDF from 'jspdf'
import { calculateIMC, formatWeight, getIMCColor } from '@/lib/health-utils'
import type { WeightEntry, PhotoCategory, ProgressPhoto, BodyMeasurement } from '@/types'
import { toast } from 'sonner'
import { generateProgressAnalysis, type ProgressAnalysisResult } from '@/lib/progress-analysis'
import { useTranslation } from '@/contexts/LanguageContext'

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  frente: 'Frente',
  lado: 'Lado',
  costas: 'Costas',
}

const DICAS = [
  'Durma bem — 7-9 horas de sono melhoram recuperação, metabolismo e controle de apetite',
  'Beba água regularmente — hidratação adequada acelera metabolismo e reduz fome falsa',
  'Encontre atividades que goste — exercício consistente vem de algo que você realmente aprecia fazer',
  'Gerencie o estresse — cortisol elevado dificulta perda de peso e ganho muscular',
  'Registre seu peso sempre no mesmo horário, preferencialmente pela manhã em jejum',
  'Acompanhe medidas do corpo — cintura, quadril e braços podem mudar mesmo sem alteração de peso',
  'Tire fotos mensalmente, sempre no mesmo horário e com a mesma roupa para comparar melhor',
  'O peso é apenas uma métrica. Observe também como suas roupas ficam e como você se sente',
  'Seja consistente, não perfeito — um dia fora do plano não desfaz semanas de progresso',
  'Revise seu progresso semanalmente — ajuste o que não está funcionando sem desistir',
  'Celebre pequenas vitórias — mudanças de hábito e energia são tão importantes quanto números na balança',
  'Defina metas realistas e mensuráveis — "perder 1-2kg por semana" é melhor que "emagrecer rápido"',
  'Foque no progresso, não na perfeição. Pequenas mudanças levam a grandes resultados',
]

export function Progress() {
  const {
    user, weightHistory, addWeightEntry,
    progressPhotos, addProgressPhoto, deleteProgressPhoto,
    bodyMeasurements, addBodyMeasurement, deleteBodyMeasurement,
    sleepHistory, cycleConfig,
  } = useApp()
  const { t } = useTranslation()
  const tpr = t.progress

  // ── Weight dialog ──────────────────────────────────────────────────────────
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // ── Body measurement dialog ────────────────────────────────────────────────
  const [isMeasurementDialogOpen, setIsMeasurementDialogOpen] = useState(false)
  const [mBodyFat, setMBodyFat] = useState('')
  const [mLeanMass, setMLeanMass] = useState('')
  const [mWaist, setMWaist] = useState('')
  const [mHips, setMHips] = useState('')
  const [mArm, setMArm] = useState('')
  const [mThigh, setMThigh] = useState('')
  const [mChest, setMChest] = useState('')
  const [mNeck, setMNeck] = useState('')
  const [mCalf, setMCalf] = useState('')
  const [mWeight, setMWeight] = useState('')
  const [mNotes, setMNotes] = useState('')

  // ── Analysis dialog ────────────────────────────────────────────────────────
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ProgressAnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState('')

  // ── Body composition history expand ───────────────────────────────────────
  const [showAllMeasurements, setShowAllMeasurements] = useState(false)

  // ── Photo dialog ───────────────────────────────────────────────────────────
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [photoNotes, setPhotoNotes] = useState('')
  const [photoWeight, setPhotoWeight] = useState('')
  const [photoFiles, setPhotoFiles] = useState<Record<PhotoCategory, File | null>>({ frente: null, lado: null, costas: null })
  const [photoPreviews, setPhotoPreviews] = useState<Record<PhotoCategory, string | null>>({ frente: null, lado: null, costas: null })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeSlot, setActiveSlot] = useState<PhotoCategory | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Compare mode ───────────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<ProgressPhoto[]>([])
  const [viewPhoto, setViewPhoto] = useState<ProgressPhoto | null>(null)
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<ProgressPhoto | null>(null)
  const [confirmDeleteMeasurement, setConfirmDeleteMeasurement] = useState<string | null>(null)

  if (!user) return null

  // ── Weight handlers ────────────────────────────────────────────────────────
  const handleAddWeight = () => {
    if (!newWeight) return
    const entry: WeightEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      weight: parseFloat(newWeight),
      notes: newNotes || undefined,
    }
    addWeightEntry(entry)
    setNewWeight('')
    setNewNotes('')
    setIsWeightDialogOpen(false)
    toast.success(`Peso registrado: ${formatWeight(entry.weight)}`)
  }

  // ── Measurement handlers ───────────────────────────────────────────────────
  const hasMeasurementData = mBodyFat || mWaist || mHips || mArm || mThigh || mChest || mNeck || mCalf

  const handleAddMeasurement = () => {
    if (!hasMeasurementData) return
    const entry: BodyMeasurement = {
      id: crypto.randomUUID(),
      date: new Date(),
      weight: mWeight ? parseFloat(mWeight) : undefined,
      bodyFat: mBodyFat ? parseFloat(mBodyFat) : undefined,
      waist: mWaist ? parseFloat(mWaist) : undefined,
      hips: mHips ? parseFloat(mHips) : undefined,
      arm: mArm ? parseFloat(mArm) : undefined,
      thigh: mThigh ? parseFloat(mThigh) : undefined,
      chest: mChest ? parseFloat(mChest) : undefined,
      neck: mNeck ? parseFloat(mNeck) : undefined,
      calf: mCalf ? parseFloat(mCalf) : undefined,
      notes: mNotes || undefined,
    }
    addBodyMeasurement(entry)
    setMBodyFat(''); setMLeanMass(''); setMWaist(''); setMHips(''); setMArm(''); setMThigh('')
    setMChest(''); setMNeck(''); setMCalf(''); setMWeight(''); setMNotes('')
    setIsMeasurementDialogOpen(false)
    toast.success('Composição e medidas registradas!')
  }

  // ── Analysis handler ───────────────────────────────────────────────────────
  const handleRunAnalysis = async () => {
    if (!user) return
    setAnalysisLoading(true)
    setAnalysisError('')
    setAnalysisResult(null)
    setIsAnalysisDialogOpen(true)
    try {
      const result = await generateProgressAnalysis({ user, weightHistory, bodyMeasurements, sleepHistory, cycleConfig })
      setAnalysisResult(result)
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro ao gerar análise')
    } finally {
      setAnalysisLoading(false)
    }
  }

  // ── Photo handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeSlot) return
    const slot = activeSlot
    setPhotoFiles(prev => ({ ...prev, [slot]: file }))
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreviews(prev => ({ ...prev, [slot]: ev.target?.result as string }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  const openSlot = (cat: PhotoCategory) => { setActiveSlot(cat); setTimeout(() => fileInputRef.current?.click(), 0) }
  const clearSlot = (cat: PhotoCategory) => {
    setPhotoFiles(prev => ({ ...prev, [cat]: null }))
    setPhotoPreviews(prev => ({ ...prev, [cat]: null }))
  }
  const resetPhotoDialog = () => {
    setPhotoFiles({ frente: null, lado: null, costas: null })
    setPhotoPreviews({ frente: null, lado: null, costas: null })
    setPhotoNotes(''); setPhotoWeight(''); setActiveSlot(null)
  }
  const hasAnyPhoto = Object.values(photoFiles).some(f => f !== null)

  const handleUploadPhoto = async () => {
    if (!hasAnyPhoto) return
    setUploadingPhoto(true)
    const categories: PhotoCategory[] = ['frente', 'lado', 'costas']
    let saved = 0; const errors: string[] = []
    for (const cat of categories) {
      const file = photoFiles[cat]; if (!file) continue
      try {
        await addProgressPhoto(file, cat, photoNotes || undefined, photoWeight ? parseFloat(photoWeight) : undefined)
        saved++
      } catch (err) { errors.push(`${CATEGORY_LABELS[cat]}: ${err instanceof Error ? err.message : 'Erro'}`) }
    }
    setUploadingPhoto(false)
    if (saved > 0) { toast.success(`${saved} foto${saved > 1 ? 's' : ''} registrada${saved > 1 ? 's' : ''} com sucesso!`); setIsPhotoDialogOpen(false); resetPhotoDialog() }
    if (errors.length > 0) toast.error(errors.join('\n'))
  }

  const handleDeletePhoto = (photo: ProgressPhoto) => { setConfirmDeletePhoto(photo) }
  const confirmDelete = async () => {
    if (!confirmDeletePhoto) return
    const photo = confirmDeletePhoto; setConfirmDeletePhoto(null)
    try {
      await deleteProgressPhoto(photo.id, photo.filePath)
      toast.success('Foto removida')
      if (viewPhoto?.id === photo.id) setViewPhoto(null)
      setSelectedForCompare(prev => prev.filter(p => p.id !== photo.id))
    } catch { toast.error('Erro ao remover foto') }
  }
  const toggleCompareSelect = (photo: ProgressPhoto) => {
    setSelectedForCompare(prev => {
      const already = prev.find(p => p.id === photo.id)
      if (already) return prev.filter(p => p.id !== photo.id)
      if (prev.length >= 2) return [prev[1], photo]
      return [...prev, photo]
    })
  }

  // ── PDF da análise ────────────────────────────────────────────────────────
  const downloadAnalysisPDF = () => {
    if (!analysisResult || !user) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14
    const contentW = pageW - margin * 2
    const FOOTER_H = 12
    const MAX_Y = pageH - FOOTER_H - 8
    let y = 0

    // ── helpers ──────────────────────────────────────────────────────────────
    const wrap = (text: string, maxW: number): string[] =>
      doc.splitTextToSize(text, maxW) as string[]

    const addFooter = () => {
      const total = (doc as jsPDF & { internal: { getNumberOfPages: () => number } })
        .internal.getNumberOfPages()
      for (let i = 1; i <= total; i++) {
        doc.setPage(i)
        doc.setFillColor(52, 110, 56)
        doc.rect(0, pageH - FOOTER_H, pageW, FOOTER_H, 'F')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(200, 235, 200)
        doc.text('Bem.AI — Analise de Progresso', margin, pageH - 4.5)
        doc.text(`${i} / ${total}`, pageW - margin, pageH - 4.5, { align: 'right' })
      }
    }

    // verifica se precisa de nova página e adiciona cabeçalho de continuação
    const checkPage = (needed: number) => {
      if (y + needed > MAX_Y) {
        doc.addPage()
        y = 14
      }
    }

    // bloco colorido: header bar + conteúdo com fundo suave
    const drawBlock = (
      title: string,
      items: Array<{ main: string; sub?: string }>,
      headerRgb: [number, number, number],
      bgRgb: [number, number, number],
      textRgb: [number, number, number],
      bullet: string,
    ) => {
      if (items.length === 0) return
      const LH = 5.2   // line height principal
      const SLH = 4.5  // line height sub

      // calcula altura total do bloco
      let blockH = 10  // header
      items.forEach(({ main, sub }) => {
        blockH += wrap(`${bullet} ${main}`, contentW - 14).length * LH + 2
        if (sub) blockH += wrap(sub, contentW - 20).length * SLH + 2
      })
      blockH += 6

      checkPage(blockH)

      // header bar
      doc.setFillColor(...headerRgb)
      doc.rect(margin, y, contentW, 9, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(title, margin + 5, y + 6.2)
      y += 9

      // content background
      doc.setFillColor(...bgRgb)
      doc.rect(margin, y, contentW, blockH - 9, 'F')

      // accent line lateral
      doc.setFillColor(...headerRgb)
      doc.rect(margin, y, 3, blockH - 9, 'F')

      let itemY = y + 5
      items.forEach(({ main, sub }) => {
        // linha principal
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...textRgb)
        const mainLines = wrap(`${bullet} ${main}`, contentW - 14)
        mainLines.forEach((line: string) => {
          doc.text(line, margin + 7, itemY)
          itemY += LH
        })
        // sub-texto (causa/motivo)
        if (sub) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(100, 100, 110)
          const subLines = wrap(sub, contentW - 20)
          subLines.forEach((line: string) => {
            doc.text(line, margin + 11, itemY)
            itemY += SLH
          })
          itemY += 2
        }
        itemY += 2
      })
      y = itemY + 6
    }

    // ── CABEÇALHO ─────────────────────────────────────────────────────────────
    doc.setFillColor(52, 110, 56)
    doc.rect(0, 0, pageW, 44, 'F')

    // faixa decorativa escura no rodapé do header
    doc.setFillColor(38, 82, 41)
    doc.rect(0, 38, pageW, 6, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Analise de Progresso', margin, 16)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(user.name, margin, 26)

    doc.setFontSize(9)
    doc.setTextColor(180, 225, 182)
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      margin, 34
    )
    doc.text(
      `Meta: ${user.currentWeight}kg -> ${user.targetWeight}kg`,
      pageW - margin, 34, { align: 'right' }
    )

    y = 54

    // ── VISÃO GERAL ──────────────────────────────────────────────────────────
    const overLines = wrap(analysisResult.overview, contentW - 12)
    const overH = overLines.length * 5.5 + 16
    checkPage(overH)

    doc.setFillColor(238, 247, 239)
    doc.rect(margin, y, contentW, overH, 'F')
    doc.setFillColor(52, 110, 56)
    doc.rect(margin, y, 4, overH, 'F')

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(38, 90, 42)
    doc.text('Visao Geral', margin + 8, y + 7)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    let oy = y + 13
    overLines.forEach((line: string) => { doc.text(line, margin + 8, oy); oy += 5.5 })
    y = oy + 8

    // ── SEÇÕES ───────────────────────────────────────────────────────────────
    drawBlock(
      'O que esta funcionando bem',
      analysisResult.positives.map(p => ({ main: p })),
      [52, 110, 56], [238, 247, 239], [25, 75, 30], 'v'
    )

    drawBlock(
      'Pontos de atencao',
      analysisResult.challenges.map(c => ({ main: c.issue, sub: c.reason })),
      [180, 100, 20], [253, 245, 228], [90, 50, 10], '!'
    )

    drawBlock(
      'Periodos sem evolucao',
      analysisResult.stagnation.map(s => ({ main: s.period, sub: s.reason })),
      [80, 80, 110], [243, 243, 252], [45, 45, 75], '-'
    )

    drawBlock(
      'Recomendacoes personalizadas',
      analysisResult.recommendations.map((r, i) => ({ main: `${i + 1}. ${r}` })),
      [30, 90, 160], [232, 243, 255], [15, 55, 110], ''
    )

    addFooter()

    doc.save(
      `analise-progresso-${user.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    )
  }

  // ── Computed values ────────────────────────────────────────────────────────
  const currentIMC = calculateIMC(user.currentWeight, user.height)
  const weightDiff = user.currentWeight - user.targetWeight
  const progress = Math.abs(weightDiff)

  const sortedHistory = [...weightHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const latestWeight = user.currentWeight
  const firstWeight = user.startingWeight ?? (sortedHistory.length > 0 ? sortedHistory[0].weight : user.currentWeight)
  const weightChange = latestWeight - firstWeight

  const weightChartData = weightHistory.length > 0
    ? sortedHistory.map(entry => ({
        date: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        peso: entry.weight,
      }))
    : [{ date: 'Atual', peso: user.currentWeight }, { date: 'Meta', peso: user.targetWeight }]

  const daysActive = weightHistory.length > 0
    ? Math.ceil((new Date().getTime() - new Date(weightHistory[weightHistory.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Body composition chart data
  const sortedMeasurements = [...bodyMeasurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const hasBodyFatData = bodyMeasurements.some(m => m.bodyFat !== undefined)
  const bodyCompChartData = sortedMeasurements
    .filter(m => m.bodyFat !== undefined)
    .map(m => ({
      date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      gordura: m.bodyFat!,
      massaMagra: parseFloat((100 - m.bodyFat!).toFixed(1)),
    }))

  // Measurements chart data
  const measurementKeys: Array<{ key: keyof BodyMeasurement; label: string; color: string }> = [
    { key: 'waist',  label: 'Cintura',      color: 'var(--chart-1)' },
    { key: 'hips',   label: 'Quadril',      color: 'var(--chart-3)' },
    { key: 'arm',    label: 'Braco',        color: 'var(--chart-2)' },
    { key: 'thigh',  label: 'Coxa',         color: 'var(--chart-5)' },
    { key: 'chest',  label: 'Peito',        color: 'var(--chart-1)' },
    { key: 'calf',   label: 'Panturrilha',  color: 'var(--chart-4)' },
  ]
  const hasMeasurementsChartData = measurementKeys.some(mk =>
    bodyMeasurements.some(m => m[mk.key] !== undefined)
  )
  // Sempre preenche null para chaves ausentes — Recharts conecta null com connectNulls,
  // mas ignora chaves completamente ausentes
  const measurementsChartData = sortedMeasurements.map(m => {
    const pt: Record<string, string | number | null> = {
      date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    }
    measurementKeys.forEach(({ key, label }) => {
      const val = m[key as keyof BodyMeasurement]
      pt[label] = typeof val === 'number' ? val : null
    })
    return pt
  })
  const activeMeasurementLines = measurementKeys.filter(mk =>
    bodyMeasurements.some(m => m[mk.key] !== undefined)
  )

  // Fotos por data
  const photosByDate = progressPhotos.reduce<Record<string, ProgressPhoto[]>>((acc, photo) => {
    const dateStr = new Date(photo.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(photo)
    return acc
  }, {})

  const visibleMeasurements = showAllMeasurements ? bodyMeasurements : bodyMeasurements.slice(0, 3)

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <TrendingDown className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-3xl font-bold">{tpr.title}</h1>
          <p className="text-muted-foreground">{tpr.subtitle}</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Peso Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeight(latestWeight)}</div>
              {weightChange !== 0 && (
                <div className={`text-xs flex items-center gap-1 ${weightChange < 0 ? 'text-primary' : 'text-destructive'}`}>
                  {weightChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {Math.abs(weightChange).toFixed(1)} kg
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeight(user.targetWeight)}</div>
              <div className="text-xs text-muted-foreground">
                {user.goal === 'perder_peso' ? 'Perder' : 'Ganhar'} {progress.toFixed(1)} kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">IMC Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentIMC.value}</div>
              <div className={`text-xs ${getIMCColor(currentIMC.category)}`}>{currentIMC.description}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Dias Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{daysActive}</div>
              <div className="text-xs text-muted-foreground">{weightHistory.length} registros</div>
            </CardContent>
          </Card>
        </div>

        {/* ── Botões de ação ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Dialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg" variant="default">
                <Scale className="w-5 h-5 mr-2" />
                Registrar Peso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Peso</DialogTitle>
                <DialogDescription>Registre seu peso de hoje</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Peso (kg)</Label>
                  <Input type="number" step="0.1" placeholder="Ex: 75.5" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Observações (opcional)</Label>
                  <Input placeholder="Como você está se sentindo?" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
                </div>
                <Button onClick={handleAddWeight} className="w-full" disabled={!newWeight}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isMeasurementDialogOpen} onOpenChange={setIsMeasurementDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg" variant="outline">
                <Ruler className="w-5 h-5 mr-2" />
                Composição e Medidas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Composição Corporal e Medidas</DialogTitle>
                <DialogDescription>Registre o que souber — todos os campos são opcionais</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Composição corporal */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Composição Corporal</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>% Gordura corporal</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 28.5" value={mBodyFat} onChange={e => setMBodyFat(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>% Massa Magra</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 71.5"
                        value={mLeanMass}
                        onChange={e => setMLeanMass(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Medidas */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Medidas (cm)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Cintura</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 82" value={mWaist} onChange={e => setMWaist(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Quadril</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 98" value={mHips} onChange={e => setMHips(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Braço</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 32" value={mArm} onChange={e => setMArm(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Coxa</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 58" value={mThigh} onChange={e => setMThigh(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Peito / Tórax</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 90" value={mChest} onChange={e => setMChest(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pescoço</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 35" value={mNeck} onChange={e => setMNeck(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Panturrilha</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 37" value={mCalf} onChange={e => setMCalf(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Peso (kg)</Label>
                      <Input type="number" step="0.1" placeholder="Ex: 75.5" value={mWeight} onChange={e => setMWeight(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Observações (opcional)</Label>
                  <Input placeholder="Ex: mês de ciclo, treinos na semana..." value={mNotes} onChange={e => setMNotes(e.target.value)} />
                </div>
                <Button onClick={handleAddMeasurement} className="w-full" disabled={!hasMeasurementData}>
                  Salvar Registro
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={handleRunAnalysis}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {tpr.analysisTitle}
          </Button>
        </div>

        {/* ── Gráfico de Peso ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Evolução do Peso
            </CardTitle>
            <CardDescription>{tpr.trackJourney}</CardDescription>
          </CardHeader>
          <CardContent>
            {weightChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                  />
                  <Line type="monotone" dataKey="peso" name="Peso" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Scale className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Adicione seus primeiros registros de peso</p>
                  <p className="text-sm mt-2">para ver seu progresso aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Gráfico Composição Corporal (Gordura % vs Massa Magra %) ─────────── */}
        {hasBodyFatData && bodyCompChartData.length >= 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Composição Corporal
              </CardTitle>
              <CardDescription>Evolução do % de gordura e massa magra</CardDescription>
            </CardHeader>
            <CardContent>
              {bodyCompChartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={bodyCompChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                      formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                      cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4', strokeWidth: 1 }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="gordura" name="Gordura %" stroke="var(--chart-3)" strokeWidth={3} dot={{ fill: 'var(--chart-3)', r: 5 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="massaMagra" name="Massa Magra %" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                // Exibição de ponto único
                <div className="flex gap-6 justify-center py-6">
                  {bodyCompChartData.map((d, i) => (
                    <div key={i} className="text-center space-y-3">
                      <p className="text-xs text-muted-foreground">{d.date}</p>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: 'var(--chart-3)' }}>{d.gordura}%</div>
                          <div className="text-xs text-muted-foreground">Gordura</div>
                        </div>
                        <div className="w-px bg-border" />
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{d.massaMagra}%</div>
                          <div className="text-xs text-muted-foreground">Massa Magra</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center mt-2">Adicione mais registros para ver o gráfico de evolução</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Gráfico de Medidas ─────────────────────────────────────────────── */}
        {hasMeasurementsChartData && activeMeasurementLines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                Evolução das Medidas
              </CardTitle>
              <CardDescription>Acompanhe as mudanças no seu corpo em cm</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Precisa de pelo menos 2 datas distintas para traçar linhas */}
              {new Set(measurementsChartData.map(d => d.date)).size >= 2 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={measurementsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v}cm`} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                      formatter={(value, name) => value != null ? [`${Number(value).toFixed(1)} cm`, String(name)] : ['-', String(name)]}
                      cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4', strokeWidth: 1 }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    {activeMeasurementLines.map(({ label, color }) => (
                      <Line
                        key={label}
                        type="monotone"
                        dataKey={label}
                        name={label}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ fill: color, r: 5, strokeWidth: 0 }}
                        activeDot={{ r: 7 }}
                        connectNulls={true}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                /* Snapshot de ponto único — mostra os valores atuais em cards */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeMeasurementLines.map(({ key, label, color }) => {
                      const latest = [...bodyMeasurements]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .find(m => m[key as keyof BodyMeasurement] !== undefined)
                      const val = latest?.[key as keyof BodyMeasurement]
                      if (typeof val !== 'number') return null
                      return (
                        <div key={label} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div>
                            <div className="text-lg font-bold leading-none">{val.toFixed(1)} cm</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Adicione um novo registro em outra data para ver a linha de evolução
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Histórico de Composição Corporal e Medidas ────────────────────── */}
        {bodyMeasurements.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-primary" />
                    Histórico de Medidas
                  </CardTitle>
                  <CardDescription>{bodyMeasurements.length} registros</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visibleMeasurements.map(entry => {
                  const leanMass = entry.bodyFat !== undefined ? parseFloat((100 - entry.bodyFat).toFixed(1)) : undefined
                  const measurementParts: string[] = []
                  if (entry.waist) measurementParts.push(`Cintura: ${entry.waist}cm`)
                  if (entry.hips) measurementParts.push(`Quadril: ${entry.hips}cm`)
                  if (entry.arm) measurementParts.push(`Braço: ${entry.arm}cm`)
                  if (entry.thigh) measurementParts.push(`Coxa: ${entry.thigh}cm`)
                  if (entry.chest) measurementParts.push(`Peito: ${entry.chest}cm`)
                  if (entry.neck) measurementParts.push(`Pescoço: ${entry.neck}cm`)
                  if (entry.calf) measurementParts.push(`Panturrilha: ${entry.calf}cm`)
                  return (
                    <div key={entry.id} className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          {entry.weight && <Badge variant="outline" className="text-xs">{formatWeight(entry.weight)}</Badge>}
                        </div>
                        <button
                          onClick={() => setConfirmDeleteMeasurement(entry.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {(entry.bodyFat !== undefined || leanMass !== undefined) && (
                        <div className="flex gap-4">
                          {entry.bodyFat !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: 'var(--chart-3)' }}>{entry.bodyFat}%</div>
                              <div className="text-xs text-muted-foreground">Gordura</div>
                            </div>
                          )}
                          {leanMass !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-primary">{leanMass}%</div>
                              <div className="text-xs text-muted-foreground">Massa Magra</div>
                            </div>
                          )}
                        </div>
                      )}
                      {measurementParts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {measurementParts.map(p => (
                            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      )}
                      {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                    </div>
                  )
                })}
                {bodyMeasurements.length > 3 && (
                  <Button variant="ghost" className="w-full" size="sm" onClick={() => setShowAllMeasurements(!showAllMeasurements)}>
                    {showAllMeasurements ? (
                      <><ChevronUp className="w-4 h-4 mr-1" />Ver menos</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 mr-1" />Ver todos ({bodyMeasurements.length} registros)</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Fotos de Progresso ─────────────────────────────────────────────── */}
        <Dialog open={isPhotoDialogOpen} onOpenChange={(open) => { setIsPhotoDialogOpen(open); if (!open) resetPhotoDialog() }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  {tpr.progressPhotos}
                </CardTitle>
                <CardDescription>Visualize sua transformação ao longo do tempo</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {progressPhotos.length >= 2 && (
                  <Button variant={compareMode ? 'default' : 'outline'} size="sm"
                    onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]) }}>
                    <GitCompareArrows className="w-4 h-4 mr-1" />
                    {compareMode ? 'Cancelar' : 'Comparar'}
                  </Button>
                )}
                <DialogTrigger asChild>
                  <Button size="sm"><Camera className="w-4 h-4 mr-1" />Adicionar</Button>
                </DialogTrigger>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {progressPhotos.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Camera className="w-12 h-12 opacity-30" />
                <p className="text-sm text-center">Nenhuma foto ainda.<br />Adicione sua primeira foto de progresso!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {compareMode && selectedForCompare.length === 2 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-center text-muted-foreground">Comparativo</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedForCompare.map(photo => (
                        <div key={photo.id} className="space-y-1">
                          <img src={photo.url} alt={CATEGORY_LABELS[photo.category]} className="w-full aspect-[3/4] object-cover rounded-xl" />
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[photo.category]}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(photo.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            {photo.weight && <p className="text-xs font-medium">{formatWeight(photo.weight)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {Math.abs(new Date(selectedForCompare[1].date).getTime() - new Date(selectedForCompare[0].date).getTime()) > 0
                        ? `${Math.round(Math.abs(new Date(selectedForCompare[1].date).getTime() - new Date(selectedForCompare[0].date).getTime()) / (1000 * 60 * 60 * 24))} dias entre as fotos`
                        : 'Mesma data'}
                    </p>
                  </div>
                )}
                {compareMode && (
                  <p className="text-sm text-center text-muted-foreground">
                    {selectedForCompare.length === 0 && 'Selecione 2 fotos para comparar'}
                    {selectedForCompare.length === 1 && 'Selecione mais 1 foto'}
                  </p>
                )}
                {Object.entries(photosByDate).map(([dateStr, photos]) => (
                  <div key={dateStr} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{dateStr}</span>
                      {photos[0].weight && <Badge variant="outline" className="text-xs ml-auto">{formatWeight(photos[0].weight)}</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map(photo => {
                        const isSelected = selectedForCompare.find(p => p.id === photo.id)
                        return (
                          <div key={photo.id}
                            className={`relative group cursor-pointer rounded-xl overflow-hidden ${compareMode && isSelected ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => compareMode ? toggleCompareSelect(photo) : setViewPhoto(photo)}>
                            <img src={photo.url} alt={CATEGORY_LABELS[photo.category]} className="w-full aspect-square object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs text-center py-1">{CATEGORY_LABELS[photo.category]}</div>
                            {!compareMode && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo) }}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            {compareMode && isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                {selectedForCompare.findIndex(p => p.id === photo.id) + 1}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {photos[0].notes && <p className="text-xs text-muted-foreground pl-1">{photos[0].notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tpr.registerPhotos}</DialogTitle>
            <DialogDescription>Adicione uma foto diferente para cada posição</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="grid grid-cols-3 gap-3">
              {(['frente', 'lado', 'costas'] as PhotoCategory[]).map(cat => (
                <div key={cat} className="space-y-1">
                  <p className="text-xs font-medium text-center text-muted-foreground">{CATEGORY_LABELS[cat]}</p>
                  {photoPreviews[cat] ? (
                    <div className="relative">
                      <img src={photoPreviews[cat]!} alt={CATEGORY_LABELS[cat]} className="w-full aspect-[3/4] object-cover rounded-lg cursor-pointer" onClick={() => openSlot(cat)} />
                      <button onClick={() => clearSlot(cat)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button onClick={() => openSlot(cat)}
                      className="w-full aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Upload className="w-5 h-5" /><span className="text-xs">Adicionar</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Peso nessa data (opcional)</Label>
              <Input type="number" step="0.1" placeholder="Ex: 75.5 kg" value={photoWeight} onChange={(e) => setPhotoWeight(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Observações (opcional)</Label>
              <Input placeholder="Como você está se sentindo?" value={photoNotes} onChange={(e) => setPhotoNotes(e.target.value)} />
            </div>
            <Button onClick={handleUploadPhoto} className="w-full" disabled={!hasAnyPhoto || uploadingPhoto}>
              {uploadingPhoto ? 'Salvando...' : 'Salvar Fotos'}
            </Button>
          </div>
        </DialogContent>
        </Dialog>

        {/* Dialog confirmação exclusão foto */}
        <Dialog open={!!confirmDeletePhoto} onOpenChange={(open) => { if (!open) setConfirmDeletePhoto(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir foto</DialogTitle>
              <DialogDescription>Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmDeletePhoto(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog confirmação exclusão medida */}
        <Dialog open={!!confirmDeleteMeasurement} onOpenChange={(open) => { if (!open) setConfirmDeleteMeasurement(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir registro</DialogTitle>
              <DialogDescription>Deseja excluir este registro de medidas? A ação não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteMeasurement(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { if (confirmDeleteMeasurement) { deleteBodyMeasurement(confirmDeleteMeasurement); toast.success('Registro removido'); setConfirmDeleteMeasurement(null) } }}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Visualização foto em tela cheia */}
        {viewPhoto && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewPhoto(null)}>
            <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <img src={viewPhoto.url} alt={CATEGORY_LABELS[viewPhoto.category]} className="w-full rounded-xl object-contain max-h-[75vh]" />
              <div className="mt-3 flex items-center justify-between text-white">
                <div>
                  <Badge className="bg-background/20 text-white">{CATEGORY_LABELS[viewPhoto.category]}</Badge>
                  <p className="text-sm mt-1 opacity-80">{new Date(viewPhoto.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  {viewPhoto.weight && <p className="text-sm font-bold">{formatWeight(viewPhoto.weight)}</p>}
                  {viewPhoto.notes && <p className="text-xs opacity-70 mt-1">{viewPhoto.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeletePhoto(viewPhoto)} className="bg-destructive/80 text-white rounded-full p-2"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setViewPhoto(null)} className="bg-background/20 text-white rounded-full p-2"><X className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Análise de Progresso (dialog) ─────────────────────────────────── */}
        <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {tpr.analysisTitle}
              </DialogTitle>
              <DialogDescription>Feedback personalizado baseado em todos os seus registros</DialogDescription>
            </DialogHeader>
            {analysisLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Analisando seus dados de progresso...</p>
              </div>
            )}
            {analysisError && (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <p className="text-destructive text-sm">{analysisError}</p>
                <Button variant="outline" size="sm" onClick={handleRunAnalysis}>Tentar novamente</Button>
              </div>
            )}
            {analysisResult && !analysisLoading && (
              <div className="space-y-5 py-2">
                <Button onClick={downloadAnalysisPDF} variant="outline" className="w-full" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                {/* Overview */}
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-sm leading-relaxed">{analysisResult.overview}</p>
                </div>

                {/* Positivos */}
                {analysisResult.positives.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <CheckCircle className="w-4 h-4" />
                      O que está funcionando bem
                    </div>
                    <ul className="space-y-1.5">
                      {analysisResult.positives.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-primary mt-0.5 shrink-0">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Desafios */}
                {analysisResult.challenges.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Pontos de atenção
                    </div>
                    <ul className="space-y-2">
                      {analysisResult.challenges.map((c, i) => (
                        <li key={i} className="p-3 bg-warning/15 rounded-lg border border-warning/40 space-y-0.5">
                          <p className="text-sm font-medium">{c.issue}</p>
                          <p className="text-xs text-muted-foreground">{c.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Períodos de estagnação */}
                {analysisResult.stagnation.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                      <TrendingDown className="w-4 h-4" />
                      Períodos sem evolução
                    </div>
                    <ul className="space-y-2">
                      {analysisResult.stagnation.map((s, i) => (
                        <li key={i} className="p-3 bg-muted rounded-lg space-y-0.5">
                          <p className="text-sm font-medium">{s.period}</p>
                          <p className="text-xs text-muted-foreground">{s.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recomendações */}
                {analysisResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Lightbulb className="w-4 h-4" />
                      Recomendações personalizadas
                    </div>
                    <ul className="space-y-1.5">
                      {analysisResult.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-primary mt-0.5 shrink-0">{i + 1}.</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Objetivo ──────────────────────────────────────────────────────── */}
        <Card className="!bg-primary text-primary-foreground border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Seu Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm opacity-90">Peso Inicial</div>
                <div className="text-2xl font-bold">{formatWeight(firstWeight)}</div>
              </div>
              <div>
                <div className="text-sm opacity-90">Peso Meta</div>
                <div className="text-2xl font-bold">{formatWeight(user.targetWeight)}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-primary-foreground/20">
              <div className="text-sm opacity-90 mb-2">Progresso</div>
              <div className="bg-primary-foreground/20 rounded-full h-3">
                <div
                  className="bg-primary-foreground h-3 rounded-full transition-all"
                  style={{ width: `${firstWeight !== user.targetWeight ? Math.min((Math.abs(firstWeight - latestWeight) / Math.abs(firstWeight - user.targetWeight)) * 100, 100) : 100}%` }}
                />
              </div>
              <div className="text-sm opacity-90 mt-2">
                {user.goal === 'perder_peso'
                  ? `Faltam ${Math.abs(latestWeight - user.targetWeight).toFixed(1)} kg para sua meta`
                  : `Faltam ${Math.abs(user.targetWeight - latestWeight).toFixed(1)} kg para sua meta`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Histórico de Pesagens ─────────────────────────────────────────── */}
        {weightHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Histórico de Pesagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weightHistory.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{formatWeight(entry.weight)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      {entry.notes && <div className="text-xs text-muted-foreground mt-1">{entry.notes}</div>}
                    </div>
                    <Badge variant="outline">IMC: {calculateIMC(entry.weight, user.height).value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Dicas Adicionais para o Sucesso ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Dicas Adicionais para o Sucesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {DICAS.map((dica, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-primary font-bold shrink-0">✓</span>
                <p>{dica}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
