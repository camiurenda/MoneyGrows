import { useState } from 'react'
import { PlusCircle, Receipt } from 'lucide-react'

interface ExpenseFormProps {
  onAdd: (nombre: string, monto: number) => void
}

export function ExpenseForm({ onAdd }: ExpenseFormProps) {
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseFloat(monto)
    if (!nombre.trim() || isNaN(m) || m <= 0) return
    onAdd(nombre.trim(), m)
    setNombre('')
    setMonto('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] flex flex-col sm:flex-row gap-4 items-end"
    >
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
    </form>
  )
}
