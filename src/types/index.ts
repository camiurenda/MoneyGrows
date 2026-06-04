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
}
