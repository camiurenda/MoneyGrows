import { Bird, TrendingUp, Wallet } from 'lucide-react'
import type { Resumen, Perfil } from '../types'

interface SummaryPanelProps {
  resumen: Resumen
  perfiles: Perfil[]
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })
}

export function SummaryPanel({ resumen, perfiles }: SummaryPanelProps) {
  const a = perfiles[0]
  const b = perfiles[1]

  const balanceText = () => {
    if (resumen.deudor === 'ninguno') {
      return 'Están a mano. Nada que ajustar.'
    }
    const deudor = resumen.deudor === 'A' ? a : b
    const acreedor = resumen.deudor === 'A' ? b : a
    return `${deudor?.nombre ?? 'Uno'} le debe ${fmt(resumen.balance)} a ${acreedor?.nombre ?? 'el otro'}.`
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Bird size={20} className="text-accent" />
        <h2 className="text-lg font-semibold text-text">Balance del nido</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-bg p-4 flex flex-col gap-1">
          <p className="text-xs text-text-light flex items-center gap-1"><Wallet size={12} /> Gastos del nido</p>
          <p className="text-xl font-bold text-text">{fmt(resumen.totalGastos)}</p>
        </div>
        <div className="rounded-xl bg-bg p-4 flex flex-col gap-1">
          <p className="text-xs text-text-light">Ingresos del nido</p>
          <p className="text-xl font-bold text-text">{fmt(resumen.ingresoTotal)}</p>
        </div>
        <div className="rounded-xl bg-bg p-4 flex flex-col gap-1">
          <p className="text-xs text-text-light">Le corresponde a {a?.nombre ?? 'A'}</p>
          <p className="text-xl font-bold text-accent">{fmt(resumen.aporteEsperadoA)}</p>
          <p className="text-xs text-text-light">Pagó {fmt(resumen.aporteRealA)}</p>
        </div>
        <div className="rounded-xl bg-bg p-4 flex flex-col gap-1">
          <p className="text-xs text-text-light">Le corresponde a {b?.nombre ?? 'B'}</p>
          <p className="text-xl font-bold text-secondary">{fmt(resumen.aporteEsperadoB)}</p>
          <p className="text-xs text-text-light">Pagó {fmt(resumen.aporteRealB)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 flex items-start gap-3">
        <TrendingUp size={20} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-text">Ajuste del nido</p>
          <p className="text-text-light mt-0.5">{balanceText()}</p>
        </div>
      </div>
    </div>
  )
}
