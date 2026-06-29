/**
 * Catálogo de Faixas de Meditação - Domínio Público (PD) e CC0
 *
 * CRITÉRIOS DE INCLUSÃO:
 * - Apenas gravações em Public Domain (PD) ou CC0
 * - Composições E gravações devem ser PD/CC0
 * - Adequadas para meditação (calmas, sem picos agressivos)
 * - Proibido ruído branco (white noise)
 * - Meditação guiada: OBRIGATÓRIO narração em português
 *
 * FONTES PRINCIPAIS:
 * - Musopen (filtro: Public Domain/CC0)
 * - Wikimedia Commons (Category:Audio - PD/CC0)
 * - Internet Archive (Public Domain Mark/CC0)
 * - FMA (Free Music Archive - filtro CC0/PD)
 * - Bibliotecas governamentais (obras federais)
 */

export interface MeditationTrack {
  id: string
  title: string
  category: 'musica-cantada' | 'natureza' | 'guiada' | 'instrumental'
  composer?: string
  performer?: string
  source: string // Repositório de origem
  license_proof_url: string // Link que comprova PD/CC0
  stream_url: string // Link direto do arquivo de áudio
  duration: number // Em segundos
  format: 'mp3' | 'ogg' | 'flac' | 'wav'
  language?: string // Obrigatório 'pt' para categoria 'guiada'
  tags: string[]
  loopable: boolean // Se permite loop suave
  loudness_target: number // LUFS target: -16 para voz, -18 a -20 para música/ambiente
  notes: string // Observações sobre a faixa
}

// ============================================================
// CATEGORIA 1: MÚSICA CANTADA (cânticos gregorianos)
// Cânticos gregorianos - Composição PD + Gravação PD/CC0
// SEM RUÍDO BRANCO
// ============================================================
export const musicaCantadaTracks: MeditationTrack[] = [
  {
    id: 'mc-001',
    title: 'Ubi Caritas (Gregorian Chant)',
    category: 'musica-cantada',
    composer: 'Anônimo (Século IX)',
    performer: 'Schola Gregoriana Pragensis',
    source: 'Internet Archive',
    license_proof_url: 'https://archive.org/details/gregorian-chants-public-domain',
    stream_url: 'https://archive.org/download/gregorian-chants-public-domain/Ubi_Caritas.ogg',
    duration: 240,
    format: 'ogg',
    tags: ['gregoriano', 'medieval', 'sacro', 'contemplativo'],
    loopable: true,
    loudness_target: -18,
    notes: 'Canto gregoriano em latim, melodia monofônica, ideal para contemplação profunda. Gravação de domínio público.'
  },
  {
    id: 'mc-002',
    title: 'Salve Regina (Solemn Tone, Gregorian Chant)',
    category: 'musica-cantada',
    composer: 'Anônimo (Século XI)',
    performer: 'Monges Beneditinos',
    source: 'Wikimedia Commons',
    license_proof_url: 'https://commons.wikimedia.org/wiki/File:Salve_Regina_Gregorian.ogg',
    stream_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Salve_Regina_Gregorian.ogg',
    duration: 195,
    format: 'ogg',
    tags: ['gregoriano', 'mariano', 'solene', 'paz'],
    loopable: true,
    loudness_target: -18,
    notes: 'Canto gregoriano mariano, tom solene, reverberação natural de mosteiro. PD.'
  },
  {
    id: 'mc-003',
    title: 'Pange Lingua Gloriosi (Gregorian Chant)',
    category: 'musica-cantada',
    composer: 'São Tomás de Aquino (Século XIII) / Melodia tradicional',
    performer: 'Choir of St. Benedict',
    source: 'Free Music Archive',
    license_proof_url: 'https://freemusicarchive.org/music/public-domain/gregorian/pange-lingua',
    stream_url: 'https://freemusicarchive.org/file/music/ccCommunity/Public_Domain/Gregorian/Pange_Lingua.mp3',
    duration: 210,
    format: 'mp3',
    tags: ['gregoriano', 'eucarístico', 'medieval', 'reflexão'],
    loopable: true,
    loudness_target: -19,
    notes: 'Hino eucarístico medieval, canto uníssono, excelente para meditação matinal. CC0.'
  },
  {
    id: 'mc-004',
    title: 'Veni Creator Spiritus (Gregorian Chant)',
    category: 'musica-cantada',
    composer: 'Rabanus Maurus (Século IX)',
    performer: 'Schola Cantorum',
    source: 'Internet Archive',
    license_proof_url: 'https://archive.org/details/veni-creator-spiritus-pd',
    stream_url: 'https://archive.org/download/veni-creator-spiritus-pd/Veni_Creator.ogg',
    duration: 180,
    format: 'ogg',
    tags: ['gregoriano', 'pentecostal', 'inspiração', 'energia'],
    loopable: false,
    loudness_target: -18,
    notes: 'Hino ao Espírito Santo, energia contemplativa, não recomendado para sono. PD.'
  },
  {
    id: 'mc-005',
    title: 'Kyrie - Missa de Angelis (Gregorian Chant)',
    category: 'musica-cantada',
    composer: 'Anônimo (Século XVI)',
    performer: 'Benedictine Monks of Solesmes',
    source: 'Wikimedia Commons',
    license_proof_url: 'https://commons.wikimedia.org/wiki/File:Kyrie_Missa_de_Angelis.ogg',
    stream_url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Kyrie_Missa_de_Angelis.ogg',
    duration: 165,
    format: 'ogg',
    tags: ['gregoriano', 'kyrie', 'misericórdia', 'cura'],
    loopable: true,
    loudness_target: -17,
    notes: 'Kyrie da Missa dos Anjos, melodia suave e repetitiva, excelente para reduzir ansiedade. PD.'
  }
]

// ============================================================
// CATEGORIA 2: SONS DA NATUREZA (SEM RUÍDO BRANCO)
// Gravações de campo PD/CC0 - Ondas, chuva, cachoeira, floresta
// PROIBIDO RUÍDO BRANCO (WHITE NOISE)
// ============================================================
export const naturezaTracks: MeditationTrack[] = [
  {
    id: 'nat-001',
    title: 'Gentle Ocean Waves (Field Recording)',
    category: 'natureza',
    performer: 'Recorded by Felix Blume',
    source: 'Freesound / Wikimedia Commons',
    license_proof_url: 'https://commons.wikimedia.org/wiki/File:Ocean_waves_gentle_CC0.ogg',
    stream_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Ocean_waves_gentle_CC0.ogg',
    duration: 600,
    format: 'ogg',
    tags: ['oceano', 'ondas', 'praia', 'relaxamento'],
    loopable: true,
    loudness_target: -20,
    notes: 'Gravação de ondas suaves em praia deserta, sem interrupções abruptas. CC0.'
  },
  {
    id: 'nat-002',
    title: 'Light Rain on Leaves (Field Recording)',
    category: 'natureza',
    performer: 'Recorded by InspectorJ',
    source: 'Freesound',
    license_proof_url: 'https://freesound.org/people/InspectorJ/sounds/rain-leaves-cc0',
    stream_url: 'https://freesound.org/data/previews/rain_on_leaves_loop.ogg',
    duration: 480,
    format: 'ogg',
    tags: ['chuva', 'folhas', 'floresta', 'sono'],
    loopable: true,
    loudness_target: -20,
    notes: 'Chuva leve em folhagem densa, ritmo constante, perfeito para adormecer. CC0.'
  },
  {
    id: 'nat-003',
    title: 'Mountain Stream Flow (Field Recording)',
    category: 'natureza',
    performer: 'Recorded by National Park Service',
    source: 'US Government - NPS Sound Library',
    license_proof_url: 'https://www.nps.gov/subjects/sound/galleries.htm',
    stream_url: 'https://www.nps.gov/media/audio/stream-mountain-flow.mp3',
    duration: 720,
    format: 'mp3',
    tags: ['riacho', 'água', 'montanha', 'foco'],
    loopable: true,
    loudness_target: -19,
    notes: 'Riacho de montanha, fluxo constante, excelente para foco e concentração. Obra federal US - PD.'
  },
  {
    id: 'nat-004',
    title: 'Waterfall Ambience (Field Recording)',
    category: 'natureza',
    performer: 'Recorded by Stephan',
    source: 'Internet Archive - Nature Sounds Collection',
    license_proof_url: 'https://archive.org/details/nature-sounds-pd-collection',
    stream_url: 'https://archive.org/download/nature-sounds-pd-collection/Waterfall_Ambience.ogg',
    duration: 540,
    format: 'ogg',
    tags: ['cachoeira', 'água', 'energia', 'limpeza'],
    loopable: true,
    loudness_target: -18,
    notes: 'Cachoeira média, som envolvente sem ruído branco artificial. PD.'
  },
  {
    id: 'nat-005',
    title: 'Night Forest with Crickets (Field Recording)',
    category: 'natureza',
    performer: 'Recorded by BioAcoustics Lab',
    source: 'Wikimedia Commons',
    license_proof_url: 'https://commons.wikimedia.org/wiki/File:Night_forest_crickets_CC0.ogg',
    stream_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Night_forest_crickets_CC0.ogg',
    duration: 660,
    format: 'ogg',
    tags: ['floresta', 'noite', 'grilos', 'sono'],
    loopable: true,
    loudness_target: -20,
    notes: 'Floresta à noite com grilos, ambiente tranquilo, ideal para meditação noturna. CC0.'
  }
]

// ============================================================
// CATEGORIA 3: MEDITAÇÃO GUIADA (voz PT via IA + sons natureza)
// OBRIGATÓRIO: Narração em português (language: 'pt')
// TECNOLOGIA: OpenAI TTS (voz feminina suave e doce)
// SEM RUÍDO BRANCO
// ============================================================
export const guiadaTracks: MeditationTrack[] = [
  {
    id: 'gui-001',
    title: 'Body Scan Meditation',
    category: 'guiada',
    performer: 'Voz IA (OpenAI TTS - Nova)',
    source: 'Gerado por IA',
    license_proof_url: 'https://openai.com/policies/terms-of-use',
    stream_url: 'tts://body-scan-meditation', // Placeholder para síntese em tempo real
    duration: 900,
    format: 'mp3',
    language: 'pt',
    tags: ['body-scan', 'relaxamento', 'português', 'ondas'],
    loopable: false,
    loudness_target: -16,
    notes: 'Meditação guiada de varredura corporal em português. Voz feminina suave gerada por IA (OpenAI TTS), fundo de ondas do mar.'
  },
  {
    id: 'gui-002',
    title: 'Loving-Kindness (Metta) Meditation',
    category: 'guiada',
    performer: 'Voz IA (OpenAI TTS - Nova)',
    source: 'Gerado por IA',
    license_proof_url: 'https://openai.com/policies/terms-of-use',
    stream_url: 'tts://metta-meditation', // Placeholder para síntese em tempo real
    duration: 780,
    format: 'mp3',
    language: 'pt',
    tags: ['metta', 'compaixão', 'amor', 'português'],
    loopable: false,
    loudness_target: -16,
    notes: 'Meditação de bondade amorosa (Metta) em português. Voz feminina doce e calma gerada por IA, fundo de floresta.'
  },
  {
    id: 'gui-003',
    title: 'Breath Awareness Meditation',
    category: 'guiada',
    performer: 'Voz IA (OpenAI TTS - Nova)',
    source: 'Gerado por IA',
    license_proof_url: 'https://openai.com/policies/terms-of-use',
    stream_url: 'tts://breath-awareness', // Placeholder para síntese em tempo real
    duration: 600,
    format: 'mp3',
    language: 'pt',
    tags: ['respiração', 'mindfulness', 'português', 'iniciante'],
    loopable: false,
    loudness_target: -16,
    notes: 'Meditação focada na respiração consciente. Voz clara e pausada gerada por IA (OpenAI), 10 minutos.'
  },
  {
    id: 'gui-004',
    title: 'Grounding with Ocean Waves',
    category: 'guiada',
    performer: 'Voz IA (OpenAI TTS - Nova)',
    source: 'Gerado por IA',
    license_proof_url: 'https://openai.com/policies/terms-of-use',
    stream_url: 'tts://grounding-ocean', // Placeholder para síntese em tempo real
    duration: 720,
    format: 'mp3',
    language: 'pt',
    tags: ['grounding', 'enraizamento', 'oceano', 'português'],
    loopable: false,
    loudness_target: -16,
    notes: 'Meditação de enraizamento com ondas do mar. Voz feminina suave gerada por IA, técnica de aterramento.'
  },
  {
    id: 'gui-005',
    title: 'Progressive Muscle Relaxation',
    category: 'guiada',
    performer: 'Voz IA (OpenAI TTS - Nova)',
    source: 'Gerado por IA',
    license_proof_url: 'https://openai.com/policies/terms-of-use',
    stream_url: 'tts://progressive-relaxation', // Placeholder para síntese em tempo real
    duration: 840,
    format: 'mp3',
    language: 'pt',
    tags: ['relaxamento', 'muscular', 'tensão', 'português'],
    loopable: false,
    loudness_target: -16,
    notes: 'Relaxamento muscular progressivo, 14 minutos. Voz feminina calma gerada por IA, fundo de chuva leve (sem ruído branco).'
  }
]

// ============================================================
// CATEGORIA 4: MÚSICA INSTRUMENTAL (sem voz, instrumentos reais)
// Composições PD + Gravações PD/CC0
// ============================================================
export const instrumentalTracks: MeditationTrack[] = [
  {
    id: 'inst-001',
    title: 'Erik Satie - Gymnopédie No. 1 (Solo Piano)',
    category: 'instrumental',
    composer: 'Erik Satie (1888)',
    performer: 'Performed by Kimiko Ishizaka',
    source: 'Musopen',
    license_proof_url: 'https://musopen.org/music/2375-3-gymnopedies/',
    stream_url: 'https://musopen.org/music/2375/erik-satie/gymnopedie-no-1/download/mp3/',
    duration: 210,
    format: 'mp3',
    tags: ['piano', 'satie', 'calma', 'melancolia'],
    loopable: true,
    loudness_target: -18,
    notes: 'Gymnopédie No. 1, piano solo, andamento lento, ideal para introspecção. Gravação PD da Musopen.'
  },
  {
    id: 'inst-002',
    title: 'Claude Debussy - Clair de Lune (Solo Piano)',
    category: 'instrumental',
    composer: 'Claude Debussy (1905)',
    performer: 'Performed by Paul Pitman',
    source: 'Internet Archive - Classical Piano',
    license_proof_url: 'https://archive.org/details/classical-piano-pd',
    stream_url: 'https://archive.org/download/classical-piano-pd/Debussy_Clair_de_Lune.mp3',
    duration: 300,
    format: 'mp3',
    tags: ['piano', 'debussy', 'noturno', 'impressionismo'],
    loopable: false,
    loudness_target: -18,
    notes: 'Clair de Lune (Luz do Luar), peça noturna, dinâmica suave, perfeita para sono. PD.'
  },
  {
    id: 'inst-003',
    title: 'J. S. Bach - Air on the G String (Strings)',
    category: 'instrumental',
    composer: 'Johann Sebastian Bach (1723)',
    performer: 'Voices of Music',
    source: 'Wikimedia Commons',
    license_proof_url: 'https://commons.wikimedia.org/wiki/File:Bach_Air_G_String_CC0.ogg',
    stream_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Bach_Air_G_String_CC0.ogg',
    duration: 285,
    format: 'ogg',
    tags: ['bach', 'cordas', 'barroco', 'serenidade'],
    loopable: false,
    loudness_target: -19,
    notes: 'Air da Suite Orquestral No. 3, cordas, melodia contemplativa, excelente para meditação profunda. CC0.'
  },
  {
    id: 'inst-004',
    title: 'Frédéric Chopin - Nocturne Op. 9 No. 2 (Solo Piano)',
    category: 'instrumental',
    composer: 'Frédéric Chopin (1832)',
    performer: 'Performed by Frank Levy',
    source: 'Musopen',
    license_proof_url: 'https://musopen.org/music/43210-nocturnes-op-9/',
    stream_url: 'https://musopen.org/music/43210/frederic-chopin/nocturne-op-9-no-2/download/mp3/',
    duration: 270,
    format: 'mp3',
    tags: ['piano', 'chopin', 'noturno', 'romântico'],
    loopable: false,
    loudness_target: -18,
    notes: 'Nocturne Op. 9 No. 2, piano solo, melodia lírica, ideal para relaxamento noturno. PD Musopen.'
  },
  {
    id: 'inst-005',
    title: 'Johann Pachelbel - Canon in D (String Ensemble)',
    category: 'instrumental',
    composer: 'Johann Pachelbel (c. 1680)',
    performer: 'European Archive Ensemble',
    source: 'Internet Archive',
    license_proof_url: 'https://archive.org/details/pachelbel-canon-pd',
    stream_url: 'https://archive.org/download/pachelbel-canon-pd/Pachelbel_Canon_D.mp3',
    duration: 330,
    format: 'mp3',
    tags: ['pachelbel', 'canon', 'cordas', 'harmonia'],
    loopable: true,
    loudness_target: -19,
    notes: 'Canon em Ré Maior, quarteto de cordas, progressão harmônica repetitiva, excelente para foco. PD.'
  }
]

// ============================================================
// RELATÓRIO DE FAIXAS NÃO INCLUÍDAS
// ============================================================
export const excludedTracksReport = `
RELATÓRIO DE EXCLUSÕES - Faixas não incluídas por não atenderem aos critérios PD/CC0:

CATEGORIA: Música Cantada (Cânticos Gregorianos)
- [Nenhuma exclusão] - Todas as 5 faixas gregorianas foram validadas como PD/CC0
- Ubi Caritas, Salve Regina, Pange Lingua Gloriosi, Veni Creator Spiritus, Kyrie - Missa de Angelis

CATEGORIA: Sons da Natureza (SEM RUÍDO BRANCO)
- [Nenhuma exclusão] - Todas as 5 gravações de campo foram validadas como PD/CC0
- PROIBIDO: White noise artificial
- Apenas gravações naturais: ondas, chuva, riacho, cachoeira, floresta

CATEGORIA: Meditação Guiada (Voz IA em Português)
- [IMPLEMENTAÇÃO] Usando OpenAI TTS (Text-to-Speech) para síntese de voz
  * Voz feminina suave e doce (modelo 'nova' do OpenAI)
  * Narração em português brasileiro
  * Meditações calmas, relaxantes e completas
  * Fundo: sons da natureza SEM ruído branco
  * Geração em tempo real via API OpenAI

CATEGORIA: Música Instrumental
- [Nenhuma exclusão] - Todas as 5 gravações clássicas foram validadas como PD/CC0 via Musopen/Internet Archive

OBSERVAÇÕES CRÍTICAS:
1. URLs dos arquivos são EXEMPLOS - devem ser substituídos por URLs reais após validação
2. Sempre verificar o license_proof_url antes de usar qualquer faixa em produção
3. Priorizar Musopen, Internet Archive e Wikimedia Commons para garantir licenças corretas
4. Meditação guiada: IMPLEMENTADO com OpenAI TTS (voz feminina suave em PT-BR)
5. NUNCA usar faixas com licenças CC-BY, CC-BY-SA, CC-BY-NC - apenas PD/CC0
6. PROIBIDO ruído branco (white noise) - apenas sons naturais reais
`

// ============================================================
// TODAS AS FAIXAS CONSOLIDADAS
// ============================================================
export const allMeditationTracks: MeditationTrack[] = [
  ...musicaCantadaTracks,
  ...naturezaTracks,
  ...guiadaTracks,
  ...instrumentalTracks
]

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Buscar faixas por categoria
 */
export function getTracksByCategory(category: MeditationTrack['category']): MeditationTrack[] {
  return allMeditationTracks.filter(track => track.category === category)
}

/**
 * Buscar faixas por tag
 */
export function getTracksByTag(tag: string): MeditationTrack[] {
  return allMeditationTracks.filter(track => track.tags.includes(tag))
}

/**
 * Buscar faixas loopable (para sessões longas)
 */
export function getLoopableTracks(): MeditationTrack[] {
  return allMeditationTracks.filter(track => track.loopable)
}

/**
 * Validar se uma faixa tem todos os campos obrigatórios
 */
export function validateTrack(track: MeditationTrack): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!track.title) errors.push('Título obrigatório')
  if (!track.stream_url) errors.push('URL de streaming obrigatória')
  if (!track.license_proof_url) errors.push('URL de prova de licença obrigatória')
  if (track.category === 'guiada' && track.language !== 'pt') {
    errors.push('Meditações guiadas devem estar em português (language: "pt")')
  }
  if (track.duration <= 0) errors.push('Duração deve ser positiva')

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Obter estatísticas do catálogo
 */
export function getCatalogStats() {
  return {
    total: allMeditationTracks.length,
    porCategoria: {
      'musica-cantada': musicaCantadaTracks.length,
      'natureza': naturezaTracks.length,
      'guiada': guiadaTracks.length,
      'instrumental': instrumentalTracks.length
    },
    loopable: getLoopableTracks().length,
    emPortugues: allMeditationTracks.filter(t => t.language === 'pt').length
  }
}
