/**
 * Script de tradução automática pt-BR → en / es / fr
 *
 * Como usar:
 *   1. Adicione uma chave OpenAI válida ao .env (VITE_OPENAI_API_KEY)
 *      OU exporte a variável antes de rodar (OPENAI_API_KEY=sk-... npx tsx ...)
 *   2. Execute: npx tsx scripts/translate-i18n.ts
 *   3. Os arquivos en.ts, es.ts e fr.ts serão regenerados a partir do pt-BR.ts atual.
 *
 * Estratégia:
 *   - Divide o objeto pt-BR em chunks por chave top-level (landingPage, onboardingFunnel, etc.)
 *   - Cada chunk é traduzido com 1 chamada ao gpt-4o-mini (~17x mais barato que gpt-4o)
 *   - O script preserva a estrutura do objeto — só traduz VALUES, nunca KEYS
 *   - Custo estimado: ~$1 para os 3 idiomas
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ptBR from '../src/lib/i18n/pt-BR'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const I18N_DIR = resolve(__dirname, '../src/lib/i18n')

// Lê chave OpenAI do ambiente ou do .env local
function getApiKey(): string {
  const fromEnv = process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY
  if (fromEnv) return fromEnv
  try {
    const envFile = readFileSync(resolve(__dirname, '../.env'), 'utf-8')
    const match = envFile.match(/^VITE_OPENAI_API_KEY=(.+)$/m)
    if (match) return match[1].trim()
  } catch { /* ignore */ }
  throw new Error('OPENAI_API_KEY não encontrada. Defina VITE_OPENAI_API_KEY no .env ou exporte OPENAI_API_KEY.')
}

const TARGET_LANGUAGES = {
  en: { name: 'English (United States)', code: 'en-US' },
  es: { name: 'Español (España/LATAM neutro)', code: 'es' },
  fr: { name: 'Français (France)', code: 'fr-FR' },
} as const

type TargetLang = keyof typeof TARGET_LANGUAGES

async function translateChunk(
  chunk: unknown,
  sectionKey: string,
  targetLang: TargetLang,
  apiKey: string
): Promise<unknown> {
  const meta = TARGET_LANGUAGES[targetLang]
  const prompt = `You are translating a React app UI strings JSON from Brazilian Portuguese to ${meta.name}.

RULES (critical):
1. Translate ONLY the VALUES (strings). Keep ALL keys EXACTLY as they are.
2. Preserve the EXACT nested structure. Do not add or remove any keys.
3. Keep all emojis, arrows (→, ↓, ✓, ⚠️, etc.) and special characters unchanged.
4. Keep product-specific names untranslated: "Bem AI", "BEM.ai", "BEM", "Ozempic", "Saxenda", "Mounjaro", "Wegovy", "Victoza", "GLP-1", "OMAD", "LGPD" (keep as is — this is a Brazilian data protection law acronym).
5. Use natural, idiomatic ${meta.name}. Marketing tone — warm, motivating, human.
6. Keep punctuation style consistent with ${meta.name}.
7. For measurements keep "kg", "cm", "ml", "g", "mg", "kcal" as-is.
8. "IA" → translate to "AI" in English, "IA" in Spanish/French.
9. For gender-neutral pronouns in Portuguese (e.g. "bonito(a)"), render as appropriate in target:
   - English: just use neutral phrasing (e.g. "confident")
   - Spanish/French: use masculine/feminine with slash (e.g. "guapo/a", "beau/belle") when natural

Section being translated: "${sectionKey}"

INPUT (Brazilian Portuguese):
${JSON.stringify(chunk, null, 2)}

Return ONLY valid JSON matching the exact structure of INPUT, with values translated to ${meta.name}. No markdown, no comments, no prose.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error (${res.status}) traduzindo "${sectionKey}" para ${targetLang}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content as string
  if (!text) throw new Error(`Resposta vazia traduzindo "${sectionKey}" para ${targetLang}`)

  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`JSON inválido para "${sectionKey}" em ${targetLang}: ${(e as Error).message}`)
  }
}

function serializeAsTs(obj: unknown): string {
  // Serializa com aspas simples em keys quando possível (para bater o estilo do projeto)
  // Estratégia simples: usa JSON.stringify e depois substitui "" por '' em strings sem aspas
  // Como os textos podem conter aspas, mantemos JSON.stringify padrão e só ajustamos.
  return JSON.stringify(obj, null, 2)
}

async function translateForLanguage(targetLang: TargetLang, apiKey: string) {
  console.log(`\n🌐 Traduzindo para ${targetLang.toUpperCase()}...`)
  const topLevelKeys = Object.keys(ptBR) as (keyof typeof ptBR)[]
  const result: Record<string, unknown> = {}

  for (const key of topLevelKeys) {
    process.stdout.write(`  - ${String(key).padEnd(28)}`)
    try {
      const translated = await translateChunk(ptBR[key], String(key), targetLang, apiKey)
      result[String(key)] = translated
      console.log(` ✓`)
    } catch (err) {
      console.log(` ✗ (${(err as Error).message})`)
      throw err
    }
  }

  const fileContent = `const ${targetLang === 'en' ? 'en' : targetLang} = ${serializeAsTs(result)} as const\n\nexport default ${targetLang === 'en' ? 'en' : targetLang}\n`
  const outPath = resolve(I18N_DIR, `${targetLang}.ts`)
  writeFileSync(outPath, fileContent, 'utf-8')
  console.log(`  💾 Salvo em ${outPath}`)
}

async function main() {
  const apiKey = getApiKey()
  console.log(`🔑 API key: ${apiKey.slice(0, 10)}...`)
  console.log(`📚 Chaves top-level em pt-BR: ${Object.keys(ptBR).length}`)

  for (const lang of Object.keys(TARGET_LANGUAGES) as TargetLang[]) {
    await translateForLanguage(lang, apiKey)
  }

  console.log(`\n✅ Concluído! 3 arquivos gerados em ${I18N_DIR}`)
}

main().catch(err => {
  console.error(`\n❌ Erro: ${err.message}`)
  process.exit(1)
})
