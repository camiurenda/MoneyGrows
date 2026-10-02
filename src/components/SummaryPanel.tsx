import { Bird, History, TrendingUp, Wallet } from 'lucide-react'
import type { Resumen, Perfil } from '../types'
import { nombreDelMes } from '../hooks/useSplit'

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

  const deudorPerfil = resumen.deudor === 'A' ? a : resumen.deudor === 'B' ? b : null
  const acreedorPerfil = resumen.deudor === 'A' ? b : resumen.deudor === 'B' ? a : null

  const balanceText = () => {
    if (resumen.deudor === 'ninguno') {
      return 'Están a mano. Nada que ajustar.'
    }
    return `${deudorPerfil?.nombre ?? 'Uno'} le debe ${fmt(resumen.deudaNeta)} a ${acreedorPerfil?.nombre ?? 'el otro'}.`
  }

  const deudorAnteriorPerfil = resumen.deudorAnterior === 'A' ? a : resumen.deudorAnterior === 'B' ? b : null
  const acreedorAnteriorPerfil = resumen.deudorAnterior === 'A' ? b : resumen.deudorAnterior === 'B' ? a : null
  const mismaDireccion = resumen.deudorBruto === 'ninguno' || resumen.deudorAnterior === resumen.deudorBruto
  const labelMesAnterior = resumen.mesDeudaAnterior ? nombreDelMes(resumen.mesDeudaAnterior) : 'meses anteriores'

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
        <div className="flex-1">
          <p className="font-semibold text-text">Ajuste del nido</p>
          <p className="text-text-light mt-0.5">{balanceText()}</p>
          {resumen.deudaAnterior > 0 && (
            <p className="mt-1.5 text-xs text-text-light flex items-center gap-1">
              <History size={12} className="shrink-0" />
              Incluye {fmt(resumen.deudaAnterior)} que {deudorAnteriorPerfil?.nombre ?? 'uno'} le debía a{' '}
              {acreedorAnteriorPerfil?.nombre ?? 'el otro'} de {labelMesAnterior}.
            </p>
          )}
          {resumen.deudor !== 'ninguno' && (
            <div className="mt-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light">Deuda bruta del mes</span>
                <span className="text-text">{fmt(resumen.deudaBruta)}</span>
              </div>
              {resumen.deudaAnterior > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-light">Deuda de {labelMesAnterior}</span>
                  <span className={mismaDireccion ? 'text-text' : 'text-secondary'}>
                    {mismaDireccion ? '+' : '−'} {fmt(resumen.deudaAnterior)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-light">Ya pagado</span>
                <span className="text-secondary">− {fmt(resumen.totalPagado)}</span>
              </div>
              <div className="flex justify-between border-t border-accent/20 pt-1.5 mt-0.5 font-semibold">
                <span className="text-text">Pendiente</span>
                <span className="text-accent">{fmt(resumen.deudaNeta)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
