import { useState } from 'react'
import { PlusCircle, Receipt } from 'lucide-react'

interface ExpenseFormProps {
  onAdd: (nombre: string, monto: number, pagador: 'A' | 'B') => void
  nombreA: string
  nombreB: string
}

export function ExpenseForm({ onAdd, nombreA, nombreB }: ExpenseFormProps) {
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [pagador, setPagador] = useState<'A' | 'B'>('A')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseFloat(monto)
    if (!nombre.trim() || isNaN(m) || m <= 0) return
    onAdd(nombre.trim(), m, pagador)
    setNombre('')
    setMonto('')
    setPagador('A')
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
            className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            placeholder="0"
            min={0}
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover active:scale-95 transition-all"
        >
          <PlusCircle size={18} />
          Sumar
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-light">Pagó:</span>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="radio"
            name="pagador"
            checked={pagador === 'A'}
            onChange={() => setPagador('A')}
            className="accent-accent"
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
          />
          {nombreB}
        </label>
      </div>
    </form>
  )
}
