export interface Perfil {
  id: number
  nombre: string
  ingreso: number
  mes: string
  created_at: string
}

export interface Gasto {
  id: string
  nombre: string
  monto: number
  pagador: 'A' | 'B'
  tipo_split: 'proporcional' | 'igual'
  mes: string
  created_at: string
  porcentaje_persona_a?: number | null
  porcentaje_persona_b?: number | null
}

export interface PagoAjuste {
  id?: string
  mes: string
  pagador: 'A' | 'B'
  beneficiario: 'A' | 'B'
  monto: number
  fecha: string
  descripcion?: string | null
  created_at?: string
}

export type TipoSplit = 'proporcional' | 'igual' | 'solo_a' | 'solo_b'

export function tipoSplitDeGasto(g: Gasto): TipoSplit {
  if (g.tipo_split === 'igual') return 'igual'
  if (g.porcentaje_persona_a === 1 && g.porcentaje_persona_b === 0) return 'solo_a'
  if (g.porcentaje_persona_a === 0 && g.porcentaje_persona_b === 1) return 'solo_b'
  return 'proporcional'
}

export interface SplitPorGasto {
  gasto: Gasto
  montoA: number
  montoB: number
}

export interface MetaAhorro {
  id?: string
  mes: string
  monto: number
  descripcion: string
  created_at?: string
}

export interface AporteMeta {
  id?: string
  mes: string
  aportante: 'A' | 'B'
  monto: number
  created_at?: string
}

export interface Resumen {
  totalGastos: number
  ingresoTotal: number
  aporteEsperadoA: number
  aporteEsperadoB: number
  aporteRealA: number
  aporteRealB: number
  balance: number
  deudor: 'A' | 'B' | 'ninguno'
  deudaBruta: number
  totalPagado: number
  deudaNeta: number
  deudaAnterior: number
  deudorAnterior: 'A' | 'B' | 'ninguno'
  mesDeudaAnterior: string | null
}
