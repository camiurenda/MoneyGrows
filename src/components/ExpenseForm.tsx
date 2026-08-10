import { useState } from 'react'
import { PlusCircle, Receipt, Loader2 } from 'lucide-react'
import type { TipoSplit } from '../types'

interface ExpenseFormProps {
  onAdd: (nombre: string, monto: number, pagador: 'A' | 'B', tipoSplit: TipoSplit) => void
  nombreA: string
  nombreB: string
}

export function ExpenseForm({ onAdd, nombreA, nombreB }: ExpenseFormProps) {
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [pagador, setPagador] = useState<'A' | 'B'>('A')
  const [tipoSplit, setTipoSplit] = useState<TipoSplit>('proporcional')
  const [guardando, setGuardando] = useState(false)

  const opcionesSplit: { valor: TipoSplit; label: string }[] = [
    { valor: 'proporcional', label: 'Proporcional' },
    { valor: 'igual', label: '50 / 50' },
    { valor: 'solo_a', label: `Solo ${nombreA}` },
    { valor: 'solo_b', label: `Solo ${nombreB}` },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseFloat(monto)
    if (!nombre.trim() || isNaN(m) || m <= 0) return
    setGuardando(true)
    try {
      await onAdd(nombre.trim(), m, pagador, tipoSplit)
    } finally {
      setGuardando(false)
      setNombre('')
      setMonto('')
      setPagador('A')
      setTipoSplit('proporcional')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full flex flex-col gap-1">
          <label className="text-sm text-text-light flex items-center gap-1">
            <Receipt size={14} /> Gasto
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            placeholder="Ej: Alquiler, supermercado..."
          />
        </div>
        <div className="w-full sm:w-40 flex flex-col gap-1">
          <label className="text-sm text-text-light">Monto ($)</label>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            disabled={guardando}
            className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
            placeholder="0"
            min={0}
          />
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {guardando ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          {guardando ? 'Guardando...' : 'Sumar'}
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-light">Pagó:</span>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              name="pagador"
              checked={pagador === 'A'}
              onChange={() => setPagador('A')}
              className="accent-accent"
              disabled={guardando}
            />
            {nombreA}
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              name="pagador"
              checked={pagador === 'B'}
              onChange={() => setPagador('B')}
              className="accent-secondary"
              disabled={guardando}
            />
            {nombreB}
          </label>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-light">División:</span>
          <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-bg border border-border">
            {opcionesSplit.map((o) => (
              <button
                key={o.valor}
                type="button"
                onClick={() => setTipoSplit(o.valor)}
                disabled={guardando}
                className={`px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-50 ${
                  tipoSplit === o.valor ? 'bg-accent text-white font-medium' : 'text-text-light hover:text-text'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}
