import { useState } from 'react'
import { ArrowLeftRight, PlusCircle, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { PagoAjuste } from '../types'

interface PaymentsSectionProps {
  pagosAjuste: PagoAjuste[]
  nombreA: string
  nombreB: string
  onAdd: (pago: Omit<PagoAjuste, 'id' | 'mes' | 'created_at'>) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })
}

function fmtFecha(fecha: string) {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export function PaymentsSection({ pagosAjuste, nombreA, nombreB, onAdd, onRemove }: PaymentsSectionProps) {
  const [pagador, setPagador] = useState<'A' | 'B'>('A')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [removiendo, setRemoviendo] = useState<string | null>(null)
  const [mostrarLista, setMostrarLista] = useState(true)

  const beneficiario: 'A' | 'B' = pagador === 'A' ? 'B' : 'A'
  const nombrePagador = pagador === 'A' ? nombreA : nombreB
  const nombreBeneficiario = pagador === 'A' ? nombreB : nombreA

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseFloat(monto)
    if (isNaN(m) || m <= 0) return
    setGuardando(true)
    try {
      await onAdd({ pagador, beneficiario, monto: m, fecha, descripcion: descripcion.trim() || null })
      setMonto('')
      setDescripcion('')
      setFecha(new Date().toISOString().slice(0, 10))
    } finally {
      setGuardando(false)
    }
  }

  const handleRemove = async (id: string) => {
    setRemoviendo(id)
    try {
      await onRemove(id)
    } finally {
      setRemoviendo(null)
    }
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={18} className="text-secondary" />
        <h2 className="text-base font-semibold text-text">Pagos entre nosotras</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-xs text-text-light">Quién pagó</span>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="pagador_ajuste"
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
                  name="pagador_ajuste"
                  checked={pagador === 'B'}
                  onChange={() => setPagador('B')}
                  className="accent-secondary"
                  disabled={guardando}
                />
                {nombreB}
              </label>
            </div>
            <p className="text-xs text-text-light mt-0.5">
              {nombrePagador} le paga a {nombreBeneficiario}
            </p>
          </div>

          <div className="w-full sm:w-36 flex flex-col gap-1">
            <label className="text-xs text-text-light">Monto ($)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={guardando}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-secondary transition-all disabled:opacity-50"
              placeholder="0"
              min={0}
            />
          </div>

          <div className="w-full sm:w-40 flex flex-col gap-1">
            <label className="text-xs text-text-light">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={guardando}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-secondary transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white font-medium hover:bg-secondary-hover active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
            {guardando ? 'Guardando...' : 'Registrar'}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-light">Descripción (opcional)</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={guardando}
            className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-secondary transition-all disabled:opacity-50"
            placeholder="Ej: transferencia ajuste junio"
          />
        </div>
      </form>

      {pagosAjuste.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setMostrarLista((v) => !v)}
            className="flex items-center gap-1 text-xs text-text-light hover:text-text transition-colors self-start"
          >
            {mostrarLista ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {pagosAjuste.length} pago{pagosAjuste.length > 1 ? 's' : ''} registrado{pagosAjuste.length > 1 ? 's' : ''}
          </button>

          {mostrarLista && (
            <ul className="flex flex-col gap-2">
              {pagosAjuste.map((p) => {
                const nomPag = p.pagador === 'A' ? nombreA : nombreB
                const nomBen = p.beneficiario === 'A' ? nombreA : nombreB
                const isRemoving = removiendo === p.id
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl bg-bg px-4 py-3 text-sm"
                  >
                    <ArrowLeftRight size={14} className="text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-text">{nomPag}</span>
                      <span className="text-text-light"> → </span>
                      <span className="font-medium text-text">{nomBen}</span>
                      <span className="text-text-light ml-2">{fmtFecha(p.fecha)}</span>
                      {p.descripcion && (
                        <p className="text-xs text-text-light truncate">{p.descripcion}</p>
                      )}
                    </div>
                    <span className="font-semibold text-secondary shrink-0">{fmt(p.monto)}</span>
                    <button
                      onClick={() => handleRemove(p.id!)}
                      disabled={isRemoving}
                      className="text-text-light hover:text-danger transition-colors disabled:opacity-40 shrink-0"
                      title="Eliminar pago"
                    >
                      {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
