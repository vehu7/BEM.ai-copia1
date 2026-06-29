import { useApp } from '@/contexts/AppContext'
import { ACTIVITY_LABELS } from '@/data/achievements'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * Celebração de novo recorde de sequência (streak).
 * Observa `pendingRecord` do AppContext e mostra o koala "parabéns".
 * Renderizado uma vez, alto na árvore (App.tsx).
 */
export function RecordCelebration() {
  const { pendingRecord, dismissRecord } = useApp()
  if (!pendingRecord) return null

  const atividade = ACTIVITY_LABELS[pendingRecord.kind]

  return (
    <Dialog open onOpenChange={(o) => { if (!o) dismissRecord() }}>
      <DialogContent className="sm:max-w-sm text-center border-primary/40">
        <DialogHeader>
          <DialogTitle className="sr-only">Novo recorde</DialogTitle>
          <DialogDescription className="sr-only">
            {pendingRecord.streak} dias seguidos de {atividade}
          </DialogDescription>
        </DialogHeader>

        <img
          src="/mascots/parabens.png"
          alt="Mascote comemorando"
          className="mx-auto w-40 h-40 object-contain"
        />

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            🔥 Novo recorde
          </p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            {pendingRecord.streak} dias seguidos!
          </h2>
          <p className="text-sm text-muted-foreground">
            Sua melhor sequência de {atividade} até agora. Continue assim!
          </p>
        </div>

        <Button onClick={dismissRecord} className="w-full" size="lg">
          Continuar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
