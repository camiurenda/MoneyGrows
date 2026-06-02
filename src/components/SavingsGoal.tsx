import { useState } from 'react'
import { Target, Pencil, Check, X, PiggyBank } from 'lucide-react'
import type { MetaAhorro } from '../types'

interface SavingsGoalProps {
  meta: MetaAhorro | null
  ahorroActual: number
  onUpdate: (monto: number, descripcion: string) => void
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export function SavingsGoal({ meta, ahorroActual, onUpdate }: SavingsGoalProps) {
  const [editando, setEditando] = useState(false)
  const [montoStr, setMontoStr] = useState(String(meta?.monto ?? 0))
  const [desc, setDesc] = useState(meta?.descripcion ?? '')

  const metaMonto = meta?.monto ?? 0
  const porcentaje = metaMonto > 0 ? Math.min(100, Math.max(0, (ahorroActual / metaMonto) * 100)) : 0
  const sobrante = ahorroActual - metaMonto

  const guardar = () => {
    const m = parseFloat(montoStr)
    onUpdate(isNaN(m) || m < 0 ? 0 : m, desc.trim())
    setEditando(false)
  }

  const cancelar = () => {
    setMontoStr(String(meta?.monto ?? 0))
    setDesc(meta?.descripcion ?? '')
    setEditando(false)
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-text">Meta del nido</h2>
        </div>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="p-1.5 rounded-lg text-text-light hover:text-text hover:bg-bg transition-colors"
            title="Editar meta"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {editando ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-light">Monto objetivo</label>
            <input
              type="number"
              value={montoStr}
              onChange={(e) => setMontoStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              placeholder="0"
              min={0}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-light">¿Para qué ahorran?</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              placeholder="Ej: Vacaciones, muebles, fondo de emergencia..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={guardar}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              <Check size={16} /> Guardar
            </button>
            <button
              onClick={cancelar}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-bg text-text-light text-sm font-medium hover:bg-border transition-colors"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {metaMonto > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-light">{meta?.descripcion || 'Ahorro del mes'}</p>
                  <p className="text-2xl font-bold text-text">{fmt(ahorroActual)} <span className="text-sm font-normal text-text-light">/ {fmt(metaMonto)}</span></p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${porcentaje >= 100 ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'}`}>
                  <PiggyBank size={20} />
                </div>
              </div>

              <div className="w-full h-3 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${porcentaje}%`,
                    backgroundColor: porcentaje >= 100 ? 'var(--color-secondary)' : 'var(--color-accent)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-light">{porcentaje.toFixed(0)}% de la meta</span>
                {sobrante >= 0 ? (
                  <span className="text-secondary font-medium">Sobran {fmt(sobrante)}</span>
                ) : (
                  <span className="text-danger font-medium">Faltan {fmt(Math.abs(sobrante))}</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-text-light text-sm">Todavía no hay una meta de ahorro para este mes.</p>
              <button
                onClick={() => setEditando(true)}
                className="mt-2 text-accent text-sm font-medium hover:underline"
              >
                Crear meta
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
