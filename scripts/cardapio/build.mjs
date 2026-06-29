// Empacota o CÓDIGO REAL de produção (generateWeeklyMenu + funções de meta) num .mjs que o harness
// importa. Usa a API JS do esbuild (sem aspas de shell). Roda via `npm run test:cardapio`.
import { build } from 'esbuild'

await build({
  entryPoints: ['scripts/cardapio/_entry.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  // fetch é stubado no harness; a chave só precisa ser não-vazia para passar a guarda inicial.
  define: { 'import.meta.env.VITE_OPENAI_API_KEY': '"test-key-stubbed"' },
  outfile: 'scripts/cardapio/lib.mjs',
  logLevel: 'error',
})
