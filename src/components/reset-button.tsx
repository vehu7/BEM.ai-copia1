import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function ResetButton() {
  const handleReset = () => {
    if (confirm('Isso vai apagar todos os dados e reiniciar o onboarding. Tem certeza?')) {
      localStorage.clear()
      toast.success('Dados resetados!', {
        description: 'Recarregando...'
      })
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      className="fixed bottom-20 right-4 z-50 opacity-50 hover:opacity-100"
      title="Refazer onboarding"
    >
      <RotateCcw className="w-4 h-4" />
    </Button>
  )
}
