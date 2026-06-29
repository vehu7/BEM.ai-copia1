// Entry para empacotar o CÓDIGO REAL de produção (sem reimplementar nada) e usá-lo no
// harness de teste (Camada 1) e na semeadura de contas (metas corretas). Imports relativos
// para o esbuild não precisar resolver o alias "@/"; os imports `import type` de '@/types'
// são removidos pelo esbuild (não há dependência de runtime).
export { generateWeeklyMenu } from '../../src/lib/gemini'
export {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  applyClinicalFloors,
  calculateWaterTarget,
} from '../../src/lib/health-utils'
