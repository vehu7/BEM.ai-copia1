import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react'
import { useAudio, type AudioTrack } from '@/contexts/AudioContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ── Tipos locais ──────────────────────────────────────────────────────────────

interface AudioCategory {
  id: string
  label: string
  emoji: string
  tracks: AudioTrack[]
}

// ── URLs diretas do Supabase Storage ─────────────────────────────────────────

const BASE = 'https://vmfhhwbbwnotugnrdjpm.supabase.co/storage/v1/object/public/audios_meditacao'

const AUDIO_CATEGORIES: AudioCategory[] = [
  // ── Meditações Guiadas (PT-BR) ──
  {
    id: 'meditacoes',
    label: 'Meditações Guiadas',
    emoji: '🧘',
    tracks: [
      { id: 'afirmacoes',        title: 'Afirmações de Autoconfiança',        url: `${BASE}/musicas/AFIRMACOES%20DE%20AUTOCONFIANCA.mp3` },
      { id: 'foco-chakras',      title: 'Foco nos Chakras',                   url: `${BASE}/musicas/Foco%20nos%20chakras.mp3` },
      { id: 'mantra-so-hum',     title: 'Mantra So Hum',                      url: `${BASE}/musicas/MANTRA%20SO%20HUM.mp3` },
      { id: 'ansiedade-cantada', title: 'Meditação para Ansiedade (Cantada)',  url: `${BASE}/musicas/Meditacao%20para%20ansiedade%20cantada.mp3` },
      { id: 'ansiedade',         title: 'Meditação para Ansiedade',            url: `${BASE}/musicas/Meditacao%20para%20ansiedade.mp3` },
      { id: 'relaxamento',       title: 'Relaxamento Corporal',                url: `${BASE}/musicas/Relaxamento%20Corporal.mp3` },
      { id: 'cura-energetica',   title: 'Visualização de Cura Energética',     url: `${BASE}/musicas/VISUALIZACAO%20DE%20CURA%20ENERGeTICA.mp3` },
      { id: 'paz',               title: 'Visualização de Paz',                 url: `${BASE}/musicas/Visualizacao%20de%20paz.mp3` },
      { id: 'resp-consciente',   title: 'Respiração Consciente',               url: `${BASE}/musicas/Respiracao%20Consciente.mp3` },
      { id: 'resp-cantada',      title: 'Respiração Consciente (Cantada)',     url: `${BASE}/musicas/Respiracao%20Consciente%20Cantada.mp3` },
    ],
  },
  // ── Mantras ──
  {
    id: 'mantras',
    label: 'Mantras',
    emoji: '🙏',
    tracks: [
      { id: 'mantra-gayatri',     title: 'Mantra Gayatri',                      url: `${BASE}/mantras/Mantra%20Gayatri.mp3` },
      { id: 'mantra-om-aum',      title: 'Mantra OM (Aum)',                     url: `${BASE}/mantras/Mantra%20OM%20(Aum).mp3` },
      { id: 'mantra-om-chuva',    title: 'Mantra Om (com som de chuva)',        url: `${BASE}/mantras/Mantra%20Om%20(com%20som%20de%20chuva).mp3` },
      { id: 'mantra-om-2vozes',   title: 'Mantra Om (em 2 vozes)',              url: `${BASE}/mantras/Mantra%20Om%20(em%202%20vozes).mp3` },
      { id: 'mantra-padame',      title: 'Mantra Om Mani Padame Hum',           url: `${BASE}/mantras/Mantra%20Om%20Mani%20Padame%20Hum.mp3` },
      { id: 'mantra-padme-opera', title: 'Mantra Om Mani Padme Hum (Opera)',    url: `${BASE}/mantras/Mantra%20Om%20Mani%20Padme%20Hum%20(estilo%20Opera).mp3` },
      { id: 'mantra-shivaya',     title: 'Mantra Om Namah Shivaya',             url: `${BASE}/mantras/Mantra%20Om%20Namah%20Shivaya.mp3` },
      { id: 'mantra-ra-ma',       title: 'Mantra Ra Ma Da Sa',                  url: `${BASE}/mantras/Mantra%20Ra%20Ma%20Da%20Sa.mp3` },
    ],
  },
  // ── Meditação Instrumental ──
  {
    id: 'instrumental',
    label: 'Meditação Instrumental',
    emoji: '🎵',
    tracks: [
      { id: 'inst-suave',          title: 'Instrumental Suave para Meditação',        url: `${BASE}/meditacao-instrumental/Instrumental%20suave%20para%20meditacao%20profunda.mp3` },
      { id: 'inst-cachoeira',      title: 'Meditação ao Som de Cachoeira',             url: `${BASE}/meditacao-instrumental/Meditacao%20ao%20som%20de%20cachoeira.mp3` },
      { id: 'inst-flauta',         title: 'Meditação com Flauta',                      url: `${BASE}/meditacao-instrumental/Meditacao%20com%20flauta.mp3` },
      { id: 'inst-krishna',        title: 'Meditação Hindu Krishna (Flauta)',           url: `${BASE}/meditacao-instrumental/Meditacao%20Hindu%20Krishna%20com%20flauta%20(instrumental).mp3` },
      { id: 'inst-profunda',       title: 'Meditação Profunda',                        url: `${BASE}/meditacao-instrumental/Meditacao%20Profunda.mp3` },
      { id: 'inst-relax-inst',     title: 'Meditação Relaxante (Instrumental)',         url: `${BASE}/meditacao-instrumental/Meditacao%20relaxante%20(instrumental).mp3` },
      { id: 'inst-agua',           title: 'Meditação Relaxante (Água Corrente)',        url: `${BASE}/meditacao-instrumental/Meditacao%20relaxante%20(som%20de%20agua%20corrente%20ao%20fundo).mp3` },
      { id: 'inst-dormir',         title: 'Meditação Relaxante para Dormir',            url: `${BASE}/meditacao-instrumental/Meditacao%20relaxante%20para%20dormir.mp3` },
      { id: 'inst-relaxante',      title: 'Meditação Relaxante',                        url: `${BASE}/meditacao-instrumental/Meditacao%20relaxante.mp3` },
      { id: 'inst-tacas',          title: 'Som de Taças Tibetanas',                     url: `${BASE}/meditacao-instrumental/Som%20de%20tacas%20tibetanas.mp3` },
    ],
  },
  // ── Frequências Binaurais (existentes) ──
  {
    id: 'binaurais',
    label: 'Frequências Binaurais',
    emoji: '🔮',
    tracks: [
      { id: 'third-eye',   title: 'Terceiro Olho (6º Chakra)', url: `${BASE}/frequencias-bineurais/6th%20third%20eye%20chakra.mp3` },
      { id: 'beyond',      title: 'Beyond Gravity',            url: `${BASE}/frequencias-bineurais/beyond%20gravity.mp3` },
      { id: 'clarity-bin', title: 'Clarity',                   url: `${BASE}/frequencias-bineurais/clarity.mp3` },
      { id: 'omsfamnad',   title: 'Omsfamnad',                 url: `${BASE}/frequencias-bineurais/omsfamnad.mp3` },
      { id: 'tiramisu',    title: 'Tiramisu',                  url: `${BASE}/frequencias-bineurais/tiramisu.mp3` },
      { id: 'wings',       title: 'Wings',                     url: `${BASE}/frequencias-bineurais/wings.mp3` },
    ],
  },
  // ── Frequências de Cura (novas) ──
  {
    id: 'frequencias',
    label: 'Frequências de Cura',
    emoji: '🎯',
    tracks: [
      { id: 'freq-432', title: 'Frequência 432 Hz',  url: `${BASE}/frequencias-novas/Frequencia%20432Hz%20.mpeg` },
      { id: 'freq-528', title: 'Frequência 528 Hz',  url: `${BASE}/frequencias-novas/Frequencia%20528Hz.mpeg` },
      { id: 'freq-852', title: 'Frequência 852 Hz',  url: `${BASE}/frequencias-novas/Frequencia%20852%20hz.mp3` },
    ],
  },
  // ── Piano Suave (existente) ──
  {
    id: 'piano',
    label: 'Piano Suave',
    emoji: '🎹',
    tracks: [
      { id: 'ave-maria',     title: 'Ave Maria',         url: `${BASE}/piano-suave/ave%20maria.aac` },
      { id: 'clarity-piano', title: 'Clarity',           url: `${BASE}/piano-suave/clarity.aac` },
      { id: 'loging',        title: 'Logging',           url: `${BASE}/piano-suave/loging.aac` },
      { id: 'random-sym',    title: 'Random Symmetries', url: `${BASE}/piano-suave/random%20symetries.aac` },
      { id: 'shadow',        title: 'Shadow',            url: `${BASE}/piano-suave/shadow.aac` },
      { id: 'last-dance',    title: 'The Last Dance',    url: `${BASE}/piano-suave/the%20last%20dance.aac` },
      { id: 'winds-of-hope', title: 'Winds of Hope',     url: `${BASE}/piano-suave/winds%20of%20hope.aac` },
    ],
  },
  // ── Relaxante – Clássicas ──
  {
    id: 'classicas',
    label: 'Clássicas Relaxantes',
    emoji: '🎻',
    tracks: [
      { id: 'adagio',           title: 'Adagio pour Cordes – Jean Paul Verpeaux',    url: `${BASE}/relaxante-classicas/Adagio%20pour%20cordes%20-%20Jean%20Paul%20Verpeaux.mp3` },
      { id: 'bach-concerto',    title: 'Concerto em Lá Menor – Bach (Violino)',       url: `${BASE}/relaxante-classicas/Concerto%20in%20A%20minor%203rd%20movement%20-%20Bach%20(violino).mp3` },
      { id: 'haydn-quartet',    title: 'String Quartet in A major – Haydn',           url: `${BASE}/relaxante-classicas/Haydn%20-%20String%20Quartet%20in%20A%20major,%20Hob.III-36%20-%20Gregor%20Quendel.mp3` },
      { id: 'chopin-nocturne',  title: 'Nocturne Op. 9 No. 2 – Chopin',              url: `${BASE}/relaxante-classicas/Nocturne%20op%209%20no%202%20-%20Chopin.mp3` },
      { id: 'moonlight-piano',  title: 'Sonata Moonlight – Beethoven (Piano)',         url: `${BASE}/relaxante-classicas/Sonata%20Moonlight%20-%20Bethoven%20(piano).mp3` },
      { id: 'moonlight-ambient',title: 'Sonata Moonlight – Beethoven (Ambiente)',      url: `${BASE}/relaxante-classicas/Sonata%20Moonlight%20-%20Bethoven%20(versao%20musica%20ambiente).mp3` },
      { id: 'bach-sonata4',     title: 'Sonata N. 4 em Dó Menor – Bach (Violino)',    url: `${BASE}/relaxante-classicas/Sonata%20n.%204%20in%20C%20Minor%20-%20Bach%20(violino).mp3` },
      { id: 'brahms-sonata1',   title: 'Sonata No. 1 Op. 1 – Brahms',                url: `${BASE}/relaxante-classicas/Sonata%20No.1%20Op.1%20First%20Movement%20-%20Brahms%20.mp3` },
    ],
  },
  // ── Relaxante – Mindfulness ──
  {
    id: 'mindfulness',
    label: 'Relaxante & Mindfulness',
    emoji: '🍃',
    tracks: [
      { id: 'rlx-clavier',      title: 'Clavier',                          url: `${BASE}/relaxante-outras/Clavier.mp3` },
      { id: 'rlx-guitar-long',  title: 'Guitarra Instrumental (Longo)',    url: `${BASE}/relaxante-outras/Instrumental%20guitarra%20(longo).mp3` },
      { id: 'rlx-guitar',       title: 'Guitarra Instrumental',            url: `${BASE}/relaxante-outras/Instrumental%20guitarra.mp3` },
      { id: 'rlx-mindfulness',  title: 'Mindfulness (Piano)',              url: `${BASE}/relaxante-outras/Mindfullness%20(piano).mp3` },
      { id: 'rlx-instrumental', title: 'Música Instrumental para Relaxar', url: `${BASE}/relaxante-outras/Musica%20instrumental%20para%20relaxar.mp3` },
      { id: 'rlx-perdao',       title: 'Ondas do Perdão',                  url: `${BASE}/relaxante-outras/Ondas%20do%20Perdao.mp3` },
      { id: 'rlx-piano',        title: 'Piano Relaxante',                  url: `${BASE}/relaxante-outras/Piano%20Relaxante.mp3` },
      { id: 'rlx-reflexao',     title: 'Piano Sereno para Reflexão',       url: `${BASE}/relaxante-outras/Piano%20sereno%20para%20reflexao.mp3` },
      { id: 'rlx-voz',          title: 'Relaxante (Voz ao Fundo)',         url: `${BASE}/relaxante-outras/Relaxante%20(voz%20ao%20fundo).mp3` },
      { id: 'rlx-piano-violino',title: 'Relaxante – Piano e Violino',      url: `${BASE}/relaxante-outras/Relaxante%20-%20piano%20e%20violino.mp3` },
      { id: 'rlx-respirar',     title: 'Relaxar e Respirar',               url: `${BASE}/relaxante-outras/Relaxar%20e%20respirar.mp3` },
      { id: 'rlx-time',         title: 'Relaxing Time',                    url: `${BASE}/relaxante-outras/Relaxing%20Time.mp3` },
    ],
  },
  // ── Sons da Natureza (novos) ──
  {
    id: 'natureza',
    label: 'Sons da Natureza',
    emoji: '🌿',
    tracks: [
      { id: 'nat-cachoeira',   title: 'Cachoeira',                    url: `${BASE}/sons-natureza/Cachoeira.mp3` },
      { id: 'nat-chuva-trovao',title: 'Chuva e Trovões',              url: `${BASE}/sons-natureza/Chuva%20e%20trovoes.mp3` },
      { id: 'nat-rio',         title: 'Correnteza do Rio',            url: `${BASE}/sons-natureza/Correnteza%20do%20rio.mp3` },
      { id: 'nat-piano',       title: 'Natureza Completa com Piano',  url: `${BASE}/sons-natureza/Natureza%20completa%20com%20piano.mp3` },
      { id: 'nat-ondas',       title: 'Ondas',                        url: `${BASE}/sons-natureza/Ondas.mp3` },
      { id: 'nat-passaros',    title: 'Pássaros',                     url: `${BASE}/sons-natureza/Passaros.mp3` },
    ],
  },
]

const ALL_TRACKS: AudioTrack[] = AUDIO_CATEGORIES.flatMap(c => c.tracks)

// ── Componente ────────────────────────────────────────────────────────────────

export function Meditation() {
  const { play, togglePlay, currentTrack, isPlaying } = useAudio()
  const { t } = useTranslation()
  const [expandedCat, setExpandedCat] = useState<string | null>('meditacoes')

  const categoryLabels: Record<string, string> = {
    meditacoes: t.meditation.guided,
    mantras: t.meditation.mantras,
    instrumental: t.meditation.instrumental,
    binaurais: t.meditation.binaural,
    frequencias: t.meditation.healing,
    piano: t.meditation.piano,
    classicas: t.meditation.classical,
    mindfulness: t.meditation.relaxing,
    natureza: t.meditation.nature,
  }

  const handleTrackClick = (track: AudioTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      play(track, ALL_TRACKS)
    }
  }

  const isTrackPlaying = (id: string) => currentTrack?.id === id && isPlaying

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-52 space-y-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold">{t.meditation.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.meditation.subtitle}
          </p>
        </div>
        <img
          src="/mascots/koala-zen.webp"
          alt="BEM"
          className="w-24 h-24 object-contain drop-shadow-md"
        />
      </div>

      {/* Categorias */}
      {AUDIO_CATEGORIES.map(cat => {
        const isOpen = expandedCat === cat.id
        const hasActive = cat.tracks.some(t => t.id === currentTrack?.id)

        return (
          <Card
            key={cat.id}
            className={cn(
              'overflow-hidden transition-all',
              hasActive && 'ring-1 ring-primary/40'
            )}
          >
            {/* Cabeçalho da categoria */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              onClick={() => setExpandedCat(isOpen ? null : cat.id)}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{cat.emoji}</span>
                <span className="font-medium text-sm">{categoryLabels[cat.id] ?? cat.label}</span>
                {hasActive && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {t.meditation.playing}
                  </span>
                )}
              </div>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {/* Lista de faixas */}
            {isOpen && (
              <CardContent className="px-3 pb-3 pt-0 space-y-1">
                {cat.tracks.map(track => {
                  const active = currentTrack?.id === track.id
                  const playing = isTrackPlaying(track.id)

                  return (
                    <div
                      key={track.id}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors cursor-pointer',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => handleTrackClick(track)}
                    >
                      {/* Botão play/pause */}
                      <Button
                        variant={active ? 'default' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-full"
                        onClick={e => { e.stopPropagation(); handleTrackClick(track) }}
                      >
                        {playing
                          ? <Pause className="w-3.5 h-3.5" />
                          : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </Button>

                      {/* Nome */}
                      <span className={cn('text-sm flex-1 text-left', active && 'font-medium')}>
                        {track.title}
                      </span>

                      {/* Animação de equalizer quando tocando */}
                      {playing && (
                        <div className="flex items-end gap-0.5 h-4 shrink-0">
                          {[1, 2, 3].map(i => (
                            <div
                              key={i}
                              className="w-1 bg-primary rounded-full animate-pulse"
                              style={{
                                height: `${[60, 100, 70][i - 1]}%`,
                                animationDelay: `${i * 0.15}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
