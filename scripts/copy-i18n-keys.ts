/**
 * Workaround temporário: faz DEEP MERGE das chaves de pt-BR nos arquivos
 * en.ts / es.ts / fr.ts. Preserva as chaves já traduzidas e adiciona as
 * faltantes com o valor em PT como PLACEHOLDER.
 *
 * Rodar depois: `npx tsx scripts/translate-i18n.ts` (com chave OpenAI válida)
 * para substituir os placeholders por traduções reais.
 */

import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ptBR from '../src/lib/i18n/pt-BR'
import en from '../src/lib/i18n/en'
import es from '../src/lib/i18n/es'
import fr from '../src/lib/i18n/fr'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const I18N_DIR = resolve(__dirname, '../src/lib/i18n')

/**
 * Recursivamente mescla o template (pt-BR) em target (en/es/fr).
 * - Se target tem a chave com mesmo tipo → preserva o valor de target
 * - Se target NÃO tem a chave → usa o valor de template como placeholder
 * - Se ambos são objetos aninhados → merge recursivo
 */
function deepMerge(template: unknown, target: unknown): unknown {
  if (
    typeof template === 'object' && template !== null && !Array.isArray(template) &&
    typeof target === 'object' && target !== null && !Array.isArray(target)
  ) {
    const result: Record<string, unknown> = {}
    const templateObj = template as Record<string, unknown>
    const targetObj = target as Record<string, unknown>
    for (const key of Object.keys(templateObj)) {
      if (key in targetObj) {
        result[key] = deepMerge(templateObj[key], targetObj[key])
      } else {
        result[key] = templateObj[key] // placeholder em PT
      }
    }
    return result
  }
  // folha — se target existe, preserva; senão usa template
  return target ?? template
}

const languages = [
  { code: 'en', data: en },
  { code: 'es', data: es },
  { code: 'fr', data: fr },
] as const

for (const lang of languages) {
  const merged = deepMerge(ptBR, lang.data) as Record<string, unknown>
  const json = JSON.stringify(merged, null, 2)

  // Lê o arquivo existente para extrair o preâmbulo (comentários, imports)
  const path = resolve(I18N_DIR, `${lang.code}.ts`)
  const original = readFileSync(path, 'utf-8')

  // Preserva imports e estrutura — reescreve só a const
  const header = original.match(/^[\s\S]*?(?=const \w+[:\s])/)?.[0] ?? ''
  const footer = original.match(/\} as const\s*\n*export default \w+\s*$/m)?.[0] ?? `} as const\n\nexport default ${lang.code}\n`

  const newContent = `${header}const ${lang.code}: TranslationKeys = ${json} as const\n\nexport default ${lang.code}\n`
  writeFileSync(path, newContent, 'utf-8')
  console.log(`✓ ${lang.code}.ts — deep-merged (${Object.keys(merged).length} top-level sections)`)
}

console.log('\n✅ Pronto. Rode `npm run build` para validar.')
console.log('   Depois, com chave OpenAI válida, rode:')
console.log('   npx tsx scripts/translate-i18n.ts')
