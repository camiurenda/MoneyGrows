import { Trash2, CreditCard, Scale, User } from 'lucide-react'
import { tipoSplitDeGasto } from '../types'
import type { SplitPorGasto } from '../types'

interface ExpenseItemProps {
  split: SplitPorGasto
  nombreA: string
  nombreB: string
  onRemove: (id: string) => void
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })
}

export function ExpenseItem({ split, nombreA, nombreB, onRemove }: ExpenseItemProps) {
  const g = split.gasto
  const pagadorNombre = g.pagador === 'A' ? nombreA : nombreB
  const pagadorColor = g.pagador === 'A' ? 'text-accent bg-accent/10' : 'text-secondary bg-secondary/10'
  const tipoSplit = tipoSplitDeGasto(g)

  return (
    <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text truncate">{g.nombre}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-sm text-text-light">{fmt(g.monto)}</p>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${pagadorColor}`}>
            <CreditCard size={12} /> Pagó {pagadorNombre}
          </span>
          {tipoSplit === 'igual' && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-bg text-text-light border border-border">
              <Scale size={12} /> 50/50
            </span>
          )}
          {(tipoSplit === 'solo_a' || tipoSplit === 'solo_b') && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-bg text-text-light border border-border">
              <User size={12} /> Solo {tipoSplit === 'solo_a' ? nombreA : nombreB}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1 text-right">
          <p className="text-xs text-text-light truncate">{nombreA}</p>
          <p className="text-sm font-semibold text-accent">{fmt(split.montoA)}</p>
        </div>
        <div className="w-px h-8 bg-border hidden sm:block" />
        <div className="flex-1 text-right">
          <p className="text-xs text-text-light truncate">{nombreB}</p>
          <p className="text-sm font-semibold text-secondary">{fmt(split.montoB)}</p>
        </div>
      </div>
      <button
        onClick={() => onRemove(g.id)}
        className="p-2 rounded-lg text-text-light hover:text-danger hover:bg-danger/10 transition-colors self-end sm:self-auto"
        title="Borrar gasto"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}
