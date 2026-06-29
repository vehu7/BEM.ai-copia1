import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { UserProfile, SavedWeeklyMenu, WaterIntake, Meal, WorkoutSession, WeightEntry, CycleConfig, SleepEntry, BodyMeasurement, AIWorkoutPlan } from '@/types'
import type { ReportData } from '@/lib/db-sync'

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe: 'Café da Manhã',
  lanche_manha: 'Lanche Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche Tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
}

const INTENSITY_LABELS: Record<string, string> = {
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
}

function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')) : d
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateShort(d: string): string {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function generatePDFReport(
  user: UserProfile,
  startDate: string,
  endDate: string,
  data: ReportData
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  let y = 15

  // ── Cabeçalho ────────────────────────────────────────────────────────────
  doc.setFillColor(74, 140, 78)
  doc.rect(0, 0, pageW, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Bem.AI', 14, y + 7)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Relatório de ${user.name}`, 14, y + 14)
  doc.text(`Período: ${fmtDate(startDate)} – ${fmtDate(endDate)}`, 14, y + 20)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW - 14, y + 20, { align: 'right' })

  y = 42
  doc.setTextColor(30, 30, 30)

  // ── Resumo ───────────────────────────────────────────────────────────────
  const totalDays = data.water.length
  const avgWater = totalDays > 0
    ? Math.round(data.water.reduce((s, r) => s + r.consumed, 0) / totalDays)
    : 0

  const mealsByDay = data.meals.reduce((acc, m) => {
    const d = fmtDateShort(m.date.toISOString().split('T')[0])
    acc[d] = (acc[d] || 0) + m.totalCalories
    return acc
  }, {} as Record<string, number>)
  const calDays = Object.values(mealsByDay)
  const avgCal = calDays.length > 0 ? Math.round(calDays.reduce((s, v) => s + v, 0) / calDays.length) : 0

  const fastingDone = data.fastingSessions.filter(f => f.completed).length

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo do período', 14, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Dias com dados', 'Média de água/dia', 'Média calórica/dia', 'Total de treinos', 'Jejuns concluídos']],
    body: [[
      `${totalDays} dias`,
      `${avgWater} ml`,
      `${avgCal} kcal`,
      `${data.workouts.length}`,
      `${fastingDone}`,
    ]],
    headStyles: { fillColor: [74, 140, 78], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, halign: 'center' },
    margin: { left: 14, right: 14 },
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // ── Hidratação ────────────────────────────────────────────────────────────
  if (data.water.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Hidratação', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Consumido (ml)', 'Meta (ml)', '%']],
      body: data.water.map(r => [
        fmtDateShort(r.date),
        r.consumed,
        r.target,
        `${Math.round((r.consumed / r.target) * 100)}%`,
      ]),
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  // ── Refeições ─────────────────────────────────────────────────────────────
  if (data.meals.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Refeições', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Refeição', 'Calorias', 'Prot. (g)', 'Carbs (g)', 'Gord. (g)']],
      body: data.meals.map(m => [
        fmtDate(m.date),
        MEAL_TYPE_LABELS[m.type] ?? m.type,
        `${Math.round(m.totalCalories)} kcal`,
        Math.round(m.totalProtein),
        Math.round(m.totalCarbs),
        Math.round(m.totalFat),
      ]),
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  // ── Treinos ───────────────────────────────────────────────────────────────
  if (data.workouts.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Atividade Física', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Tipo', 'Duração', 'Intensidade', 'Cal. queimadas']],
      body: data.workouts.map(w => [
        fmtDate(w.date),
        w.type.charAt(0).toUpperCase() + w.type.slice(1),
        `${w.duration} min`,
        INTENSITY_LABELS[w.intensity] ?? w.intensity,
        `${w.caloriesBurned ?? 0} kcal`,
      ]),
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  // ── Jejum ─────────────────────────────────────────────────────────────────
  if (data.fastingSessions.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Jejum Intermitente', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Data início', 'Tipo', 'Meta (h)', 'Real (h)', 'Concluído']],
      body: data.fastingSessions.map(f => [
        fmtDate(new Date(f.startTime)),
        f.type.replace('_', ':'),
        f.targetDuration,
        f.actualDuration ?? '—',
        f.completed ? 'Sim' : 'Não',
      ]),
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  // ── Peso ──────────────────────────────────────────────────────────────────
  if (data.weightEntries.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Registro de Peso', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Peso (kg)', 'Anotações']],
      body: data.weightEntries.map(w => [
        fmtDate(w.date),
        `${w.weight} kg`,
        w.notes ?? '—',
      ]),
      headStyles: { fillColor: [74, 140, 78], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
  }

  // ── Rodapé ────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Página ${i} de ${pageCount} — Bem.AI`, pageW / 2, 290, { align: 'center' })
  }

  doc.save(`relatorio-bemai-${startDate}-${endDate}.pdf`)
}

// ── Cardápio Semanal PDF ──────────────────────────────────────────────────────

export function generateMenuPDF(menu: SavedWeeklyMenu): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  let y = 15

  // Cabeçalho
  doc.setFillColor(74, 140, 78)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Bem.AI', 14, y + 7)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(menu.title, 14, y + 14)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW - 14, y + 20, { align: 'right' })

  y = 40
  doc.setTextColor(30, 30, 30)

  // Descrição
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  const descLines = doc.splitTextToSize(menu.description, pageW - 28)
  doc.text(descLines, 14, y)
  y += descLines.length * 5 + 4

  // Dias
  for (const day of menu.days) {
    // Verifica quebra de página
    if (y > 240) {
      doc.addPage()
      y = 15
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(74, 140, 78)
    doc.text(day.day, 14, y)
    y += 4
    doc.setTextColor(30, 30, 30)

    autoTable(doc, {
      startY: y,
      head: [['Refeição', 'Alimentos', 'Kcal', 'P(g)', 'C(g)', 'G(g)', 'Fib(g)']],
      body: day.meals.map(m => [
        MEAL_TYPE_LABELS[m.type] ?? m.type,
        m.foods.map((f: string | { name: string }) => typeof f === 'string' ? f : f.name).join(', '),
        m.calories,
        m.protein,
        m.carbs,
        m.fat,
        m.fiber ?? '-',
      ]),
      headStyles: { fillColor: [74, 140, 78], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 70 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 13, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // Dicas
  if (menu.tips && menu.tips.length > 0) {
    if (y > 220) { doc.addPage(); y = 15 }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Dicas Importantes', 14, y)
    y += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    for (const tip of menu.tips) {
      const lines = doc.splitTextToSize(`• ${tip}`, pageW - 28)
      if (y + lines.length * 4.5 > 280) { doc.addPage(); y = 15 }
      doc.text(lines, 14, y)
      y += lines.length * 4.5 + 1
    }
    y += 4
  }

  // Lista de compras
  if (menu.shoppingList && menu.shoppingList.length > 0) {
    if (y > 220) { doc.addPage(); y = 15 }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Lista de Compras', 14, y)
    y += 5

    autoTable(doc, {
      startY: y,
      body: menu.shoppingList.reduce<string[][]>((rows, item, i) => {
        if (i % 3 === 0) rows.push([])
        rows[rows.length - 1].push(item)
        return rows
      }, []).map(row => {
        while (row.length < 3) row.push('')
        return row
      }),
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Página ${i} de ${pageCount} — Bem.AI`, pageW / 2, 290, { align: 'center' })
  }

  const slug = menu.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  doc.save(`cardapio-bemai-${slug}.pdf`)
}

// ── Relatório Completo da Dashboard (estado local) ────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  perder_peso: 'Perda de peso', ganhar_massa: 'Ganho de massa muscular',
  manter_peso: 'Manutenção de peso', saude_geral: 'Saúde geral',
}
const ACTIVITY_LABELS: Record<string, string> = {
  sedentario: 'Sedentário', leve: 'Levemente ativo (1-3x/sem)',
  moderado: 'Moderadamente ativo (3-5x/sem)', intenso: 'Muito ativo (6-7x/sem)',
  muito_intenso: 'Extremamente ativo',
}
const MED_LABELS: Record<string, string> = {
  nenhum: 'Nenhuma', ozempic: 'Ozempic® (semaglutida)', saxenda: 'Saxenda® (liraglutida)',
  victoza: 'Victoza® (liraglutida)', mounjaro: 'Mounjaro® (tirzepatida)',
  wegovy: 'Wegovy® (semaglutida)', outro_glp1: 'Outro análogo GLP-1',
}
const GENDER_LABELS: Record<string, string> = {
  masculino: 'Masculino', feminino: 'Feminino',
  outro: 'Outro', prefiro_nao_informar: 'Prefiro não informar',
}
const DIET_LABELS: Record<string, string> = {
  nenhuma: 'Nenhuma', vegetariano: 'Vegetariano', vegano: 'Vegano',
  sem_lactose: 'Sem lactose', sem_gluten: 'Sem glúten',
  low_carb: 'Low carb', diabetes: 'Controle glicêmico',
}
const MEAL_TYPE_LABELS2: Record<string, string> = {
  cafe: 'Café da manhã', lanche_manha: 'Lanche manhã', almoco: 'Almoço',
  lanche_tarde: 'Lanche tarde', jantar: 'Jantar', ceia: 'Ceia',
}

export interface DashboardReportSections {
  profile: boolean
  nutrition: boolean
  weightHistory: boolean
  water: boolean
  meals: boolean
  workouts: boolean
  cycle: boolean
  sleep: boolean
  bodyMeasurements: boolean
  workoutPlan: boolean
}

const SLEEP_QUALITY_LABELS: Record<string, string> = {
  ruim: 'Ruim', regular: 'Regular', bom: 'Bom', excelente: 'Excelente',
}

const ENV_LABELS: Record<string, string> = {
  casa: 'Em casa', academia: 'Academia', misto: 'Misto (casa + academia)',
}

export function generateFullDashboardPDF(
  user: UserProfile,
  startDate: string,
  endDate: string,
  weightHistory: WeightEntry[],
  todayWater: WaterIntake,
  todayMeals: Meal[],
  todayWorkouts: WorkoutSession[],
  cycleConfig: CycleConfig | null,
  sections: DashboardReportSections,
  sleepHistory: SleepEntry[],
  bodyMeasurements: BodyMeasurement[],
  aiWorkoutPlan: AIWorkoutPlan | null,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  const start = new Date(startDate + 'T00:00:00')
  const end   = new Date(endDate + 'T23:59:59')
  const filteredWeights = [...weightHistory]
    .filter(e => { const d = new Date(e.date); return d >= start && d <= end })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const filteredSleep = [...sleepHistory]
    .filter(e => { const d = new Date(e.date + 'T00:00:00'); return d >= start && d <= end })
    .sort((a, b) => a.date.localeCompare(b.date))
  const filteredMeasurements = [...bodyMeasurements]
    .filter(e => { const d = new Date(e.date); return d >= start && d <= end })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const fmtDate2 = (d: Date | string) =>
    new Date(typeof d === 'string' ? (d.includes('T') ? d : d + 'T00:00:00') : d)
      .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // ── Cabeçalho ────────────────────────────────────────────────────────────────
  doc.setFillColor(74, 140, 78)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Bem.AI', 14, 22)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Relatório de Saúde — ${user.name}`, 14, 28)
  doc.text(
    `Período: ${fmtDate2(startDate)} – ${fmtDate2(endDate)}   •   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
    pageW - 14, 28, { align: 'right' },
  )

  let y = 40
  doc.setTextColor(30, 30, 30)

  const sectionTitle = (title: string) => {
    if (y > 260) { doc.addPage(); y = 15 }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(74, 140, 78)
    doc.text(title.toUpperCase(), 14, y)
    doc.setTextColor(30, 30, 30)
    y += 3
  }

  const table = (head: string[], body: (string | number)[][]) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      headStyles: { fillColor: [74, 140, 78], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  const kvTable = (rows: [string, string][]) => {
    autoTable(doc, {
      startY: y,
      body: rows,
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [249, 250, 251], cellWidth: 65 },
      },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ── Perfil ──────────────────────────────────────────────────────────────────
  if (sections.profile) {
    sectionTitle('Perfil do Paciente')
    const imc = (user.currentWeight / Math.pow(user.height / 100, 2)).toFixed(1)
    kvTable([
      ['Nome', user.name],
      ['Idade', `${user.age} anos`],
      ['Gênero', GENDER_LABELS[user.gender] ?? user.gender],
      ['Altura', `${user.height} cm`],
      ['Peso inicial', `${(user.startingWeight ?? user.currentWeight).toFixed(1)} kg`],
      ['Peso atual', `${user.currentWeight.toFixed(1)} kg`],
      ['Peso meta', `${user.targetWeight.toFixed(1)} kg`],
      ['IMC atual', imc],
      ['Objetivo', GOAL_LABELS[user.goal] ?? user.goal],
      ['Nível de atividade', ACTIVITY_LABELS[user.activityLevel] ?? user.activityLevel],
      ['Sono médio', `${user.averageSleepHours}h/noite`],
      ['Medicação GLP-1', MED_LABELS[user.medication] ?? user.medication],
      ...(user.medicationDosage ? [['Dosagem', user.medicationDosage] as [string, string]] : []),
      ['Pref. alimentares', user.dietaryPreferences.map(p => DIET_LABELS[p] ?? p).join(', ') || 'Nenhuma'],
      ...(user.medicalLimitations.hasLimitation
        ? [['Limitações médicas', user.medicalLimitations.description ?? 'Sim'] as [string, string]]
        : []),
    ])
  }

  // ── Metas Nutricionais ──────────────────────────────────────────────────────
  if (sections.nutrition) {
    sectionTitle('Metas Nutricionais Calculadas')
    kvTable([
      ['Metabolismo Basal (BMR)', `${user.bmr ?? '—'} kcal/dia`],
      ['Gasto Energético Total (TDEE)', `${user.tdee ?? '—'} kcal/dia`],
      ['Meta calórica diária', `${user.targetCalories ?? '—'} kcal/dia`],
      ['Meta de proteína', `${user.targetProtein ?? '—'} g/dia`],
      ['Meta de carboidratos', `${user.targetCarbs ?? '—'} g/dia`],
      ['Meta de gordura', `${user.targetFat ?? '—'} g/dia`],
      ['Meta de fibras', `${user.targetFiber ?? '—'} g/dia`],
      ['Meta de hidratação', `${user.targetWater ?? '—'} ml/dia`],
    ])
  }

  // ── Histórico de Peso ───────────────────────────────────────────────────────
  if (sections.weightHistory) {
    sectionTitle('Histórico de Peso no Período')
    if (filteredWeights.length === 0) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150)
      doc.text('Nenhum registro de peso no período selecionado.', 14, y)
      doc.setTextColor(30, 30, 30)
      y += 8
    } else {
      table(
        ['Data', 'Peso (kg)', 'Observações'],
        filteredWeights.map(e => [fmtDate2(e.date), `${e.weight.toFixed(1)} kg`, e.notes ?? '—']),
      )
      const first = filteredWeights[0].weight
      const last  = filteredWeights[filteredWeights.length - 1].weight
      const delta = (last - first).toFixed(1)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(parseFloat(delta) < 0 ? 22 : parseFloat(delta) > 0 ? 180 : 55, parseFloat(delta) < 0 ? 101 : 52, parseFloat(delta) < 0 ? 52 : 52)
      doc.text(
        parseFloat(delta) < 0
          ? `Redução de ${Math.abs(parseFloat(delta))} kg no período (${first.toFixed(1)} → ${last.toFixed(1)} kg)`
          : parseFloat(delta) > 0
          ? `Aumento de ${delta} kg no período (${first.toFixed(1)} → ${last.toFixed(1)} kg)`
          : `Peso estável no período (${first.toFixed(1)} kg)`,
        14, y,
      )
      doc.setTextColor(30, 30, 30)
      y += 8
    }
  }

  // ── Água ────────────────────────────────────────────────────────────────────
  if (sections.water) {
    sectionTitle('Hidratação — Dia Atual')
    kvTable([
      ['Consumido', `${todayWater.consumed} ml`],
      ['Meta diária', `${todayWater.target} ml`],
      ['Progresso', `${Math.round(Math.min((todayWater.consumed / todayWater.target) * 100, 100))}%`],
    ])
  }

  // ── Refeições ────────────────────────────────────────────────────────────────
  if (sections.meals) {
    sectionTitle('Refeições — Dia Atual')
    if (todayMeals.length === 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(150)
      doc.text('Nenhuma refeição registrada hoje.', 14, y)
      doc.setTextColor(30, 30, 30); y += 8
    } else {
      table(
        ['Refeição', 'Calorias', 'Proteína (g)', 'Carboidratos (g)', 'Gordura (g)'],
        todayMeals.map(m => [
          MEAL_TYPE_LABELS2[m.type] ?? m.type,
          `${Math.round(m.totalCalories)} kcal`,
          Math.round(m.totalProtein),
          Math.round(m.totalCarbs),
          Math.round(m.totalFat),
        ]),
      )
    }
  }

  // ── Treinos ──────────────────────────────────────────────────────────────────
  if (sections.workouts) {
    sectionTitle('Atividade Física — Dia Atual')
    if (todayWorkouts.length === 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(150)
      doc.text('Nenhum treino registrado hoje.', 14, y)
      doc.setTextColor(30, 30, 30); y += 8
    } else {
      table(
        ['Tipo', 'Duração', 'Intensidade', 'Cal. queimadas'],
        todayWorkouts.map(w => [
          w.type.charAt(0).toUpperCase() + w.type.slice(1),
          `${w.duration} min`,
          INTENSITY_LABELS[w.intensity] ?? w.intensity,
          `${w.caloriesBurned ?? 0} kcal`,
        ]),
      )
    }
  }

  // ── Ciclo ────────────────────────────────────────────────────────────────────
  if (sections.cycle && cycleConfig) {
    sectionTitle('Controle do Ciclo Menstrual')
    kvTable([
      ['Duração média do ciclo', `${cycleConfig.averageCycleDuration} dias`],
      ['Duração média da menstruação', `${cycleConfig.averagePeriodDuration} dias`],
      ['Variação típica', `±${cycleConfig.typicalVariation} dias`],
      ...(cycleConfig.mainGoal ? [['Objetivo', cycleConfig.mainGoal] as [string, string]] : []),
      ...(cycleConfig.isMenopausa ? [['Menopausa', 'Sim'] as [string, string]] : []),
      ...(cycleConfig.wantsToGetPregnant != null
        ? [['Deseja engravidar', cycleConfig.wantsToGetPregnant ? 'Sim' : 'Não'] as [string, string]]
        : []),
    ])
  }

  // ── Sono ─────────────────────────────────────────────────────────────────────
  if (sections.sleep) {
    sectionTitle('Histórico de Sono no Período')
    if (filteredSleep.length === 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(150)
      doc.text('Nenhum registro de sono no período selecionado.', 14, y)
      doc.setTextColor(30, 30, 30); y += 8
    } else {
      const avgDuration = filteredSleep.reduce((s, e) => s + e.duration, 0) / filteredSleep.length
      table(
        ['Data', 'Dormiu', 'Acordou', 'Duração', 'Qualidade'],
        filteredSleep.map(e => [
          fmtDate2(e.date + 'T00:00:00'),
          e.bedtime,
          e.wakeTime,
          `${e.duration.toFixed(1)}h`,
          SLEEP_QUALITY_LABELS[e.quality] ?? e.quality,
        ]),
      )
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30)
      doc.text(`Média no período: ${avgDuration.toFixed(1)}h por noite`, 14, y)
      y += 8
    }
  }

  // ── Medidas Corporais ─────────────────────────────────────────────────────────
  if (sections.bodyMeasurements) {
    sectionTitle('Medidas Corporais no Período')
    if (filteredMeasurements.length === 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(150)
      doc.text('Nenhuma medida registrada no período selecionado.', 14, y)
      doc.setTextColor(30, 30, 30); y += 8
    } else {
      table(
        ['Data', 'Peso', 'Cintura', 'Quadril', 'Peito', 'Braço', 'Coxa', 'Gordura %'],
        filteredMeasurements.map(m => [
          fmtDate2(m.date),
          m.weight ? `${m.weight.toFixed(1)} kg` : '—',
          m.waist  ? `${m.waist} cm`  : '—',
          m.hips   ? `${m.hips} cm`   : '—',
          m.chest  ? `${m.chest} cm`  : '—',
          m.arm    ? `${m.arm} cm`    : '—',
          m.thigh  ? `${m.thigh} cm`  : '—',
          m.bodyFat ? `${m.bodyFat}%` : '—',
        ]),
      )
    }
  }

  // ── Plano de Treino Personalizado ─────────────────────────────────────────────
  if (sections.workoutPlan && aiWorkoutPlan) {
    sectionTitle('Plano de Treino Personalizado')
    kvTable([
      ['Ambiente', ENV_LABELS[aiWorkoutPlan.environment] ?? aiWorkoutPlan.environment],
      ['Título do plano', aiWorkoutPlan.plan.title],
      ['Dias por semana', `${aiWorkoutPlan.plan.daysPerWeek} dias`],
      ['Duração por sessão', `${aiWorkoutPlan.plan.sessionDuration} min`],
      ['Gerado em', fmtDate2(aiWorkoutPlan.generatedAt)],
    ])
    // Dias do plano
    for (const day of aiWorkoutPlan.plan.days) {
      if (y > 240) { doc.addPage(); y = 15 }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.setTextColor(74, 140, 78)
      doc.text(`${day.name} — ${day.focus}`, 14, y)
      doc.setTextColor(30, 30, 30)
      y += 3
      autoTable(doc, {
        startY: y,
        head: [['Exercício', 'Séries', 'Reps/Duração', 'Descanso', 'Obs.']],
        body: day.exercises.map(ex => [
          ex.name,
          ex.sets ?? '—',
          ex.reps ?? ex.duration ?? '—',
          ex.restTime ?? '—',
          ex.notes ?? '—',
        ]),
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        margin: { left: 14, right: 14 },
      })
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
    }
    // Dicas do plano
    if (aiWorkoutPlan.plan.tips?.length > 0) {
      if (y > 240) { doc.addPage(); y = 15 }
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30)
      doc.text('Dicas do plano:', 14, y); y += 4
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      for (const tip of aiWorkoutPlan.plan.tips) {
        const lines = doc.splitTextToSize(`• ${tip}`, doc.internal.pageSize.getWidth() - 28)
        if (y + lines.length * 4.5 > 280) { doc.addPage(); y = 15 }
        doc.text(lines, 14, y)
        y += lines.length * 4.5 + 1
      }
      y += 4
    }
  }

  // ── Rodapé ───────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      'Este relatório é gerado pelo app Bem.AI e não substitui avaliação médica profissional.',
      pageW / 2, 287, { align: 'center' },
    )
    doc.text(`Página ${i} de ${pageCount} — Bem.AI`, pageW / 2, 292, { align: 'center' })
  }

  doc.save(`relatorio-bemai-${user.name.replace(/\s+/g, '-').toLowerCase()}-${startDate}.pdf`)
}
