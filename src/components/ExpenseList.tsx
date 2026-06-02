import { Receipt } from 'lucide-react'
import { ExpenseItem } from './ExpenseItem'
import type { SplitPorGasto } from '../types'

interface ExpenseListProps {
  splits: SplitPorGasto[]
  nombreA: string
  nombreB: string
  onRemove: (id: string) => void
}

export function ExpenseList({ splits, nombreA, nombreB, onRemove }: ExpenseListProps) {
  if (splits.length === 0) {
    return (
      <div className="bg-card/60 rounded-2xl p-8 text-center text-text-light border border-dashed border-border">
        <Receipt size={32} className="mx-auto mb-2 opacity-40" />
        <p className="font-medium">Todavía no sumaste ningún gasto</p>
        <p className="text-sm mt-1 opacity-70">Agregá uno arriba para empezar a dividir.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {splits.map((split) => (
        <ExpenseItem
          key={split.gasto.id}
          split={split}
          nombreA={nombreA}
          nombreB={nombreB}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
