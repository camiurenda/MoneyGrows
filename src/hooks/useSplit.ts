import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Perfil, Gasto, SplitPorGasto, Resumen, MetaAhorro, AporteMeta, PagoAjuste, TipoSplit } from '../types'

function getMesActual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nombreDelMes(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${meses[m - 1]} ${y}`
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // noop
  }
}

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null) {
    const o = e as Record<string, unknown>
    if (typeof o.message === 'string') return o.message
    if (typeof o.error_description === 'string') return o.error_description
    if (typeof o.code === 'string') return `Error ${o.code}`
    try {
      return JSON.stringify(o)
    } catch {
      return String(e)
    }
  }
  return String(e)
}

export function useSplit() {
  const [mes, setMes] = useState<string>(() => readLocal('mg_mes', getMesActual()))
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [metaAhorro, setMetaAhorro] = useState<MetaAhorro | null>(null)
  const [aportes, setAportes] = useState<AporteMeta[]>([])
  const [pagosAjuste, setPagosAjuste] = useState<PagoAjuste[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const localPerfilesRef = useRef<Record<string, Perfil[]>>(readLocal('mg_perfiles_mes', {}))
  const localGastosRef = useRef<Record<string, Gasto[]>>(readLocal('mg_gastos_mes', {}))
  const localMetaRef = useRef<Record<string, MetaAhorro>>(readLocal('mg_meta_mes', {}))
  const localAportesRef = useRef<Record<string, AporteMeta[]>>(readLocal('mg_aportes_mes', {}))
  const localPagosAjusteRef = useRef<Record<string, PagoAjuste[]>>(readLocal('mg_pagos_ajuste_mes', {}))

  const setLocalPerfilesMes = useCallback((m: string, v: Perfil[]) => {
    localPerfilesRef.current = { ...localPerfilesRef.current, [m]: v }
    writeLocal('mg_perfiles_mes', localPerfilesRef.current)
  }, [])
  const setLocalGastosMes = useCallback((m: string, v: Gasto[]) => {
    localGastosRef.current = { ...localGastosRef.current, [m]: v }
    writeLocal('mg_gastos_mes', localGastosRef.current)
  }, [])
  const setLocalMetaMes = useCallback((m: string, v: MetaAhorro) => {
    localMetaRef.current = { ...localMetaRef.current, [m]: v }
    writeLocal('mg_meta_mes', localMetaRef.current)
  }, [])
  const setLocalAportesMes = useCallback((m: string, v: AporteMeta[]) => {
    localAportesRef.current = { ...localAportesRef.current, [m]: v }
    writeLocal('mg_aportes_mes', localAportesRef.current)
  }, [])
  const setLocalPagosAjusteMes = useCallback((m: string, v: PagoAjuste[]) => {
    localPagosAjusteRef.current = { ...localPagosAjusteRef.current, [m]: v }
    writeLocal('mg_pagos_ajuste_mes', localPagosAjusteRef.current)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {  
      const { data: perfilesData, error: perfilesErr } = await supabase
        .from('perfiles')
        .select('*')
        .eq('mes', mes)
        .order('id')

      if (perfilesErr) throw perfilesErr

      const { data: gastosData, error: gastosErr } = await supabase
        .from('gastos')
        .select('*')
        .eq('mes', mes)
        .order('created_at', { ascending: false })

      if (gastosErr) throw gastosErr

      let fetchedPerfiles = (perfilesData ?? []) as Perfil[]
      if (fetchedPerfiles.length === 0) {
        const defaults: Perfil[] = [
          { id: 0, nombre: 'Camila', ingreso: 0, mes, created_at: new Date().toISOString() },
          { id: 0, nombre: 'Lucía', ingreso: 0, mes, created_at: new Date().toISOString() },
        ]
        for (const p of defaults) {
          await supabase.from('perfiles').insert({ nombre: p.nombre, ingreso: p.ingreso, mes } as any)
        }
        const { data: reloaded } = await supabase.from('perfiles').select('*').eq('mes', mes).order('id')
        fetchedPerfiles = (reloaded ?? []) as Perfil[]
        setLocalPerfilesMes(mes, fetchedPerfiles)
      } else {
        setLocalPerfilesMes(mes, fetchedPerfiles)
      }
      setPerfiles(fetchedPerfiles)

      const fetchedGastos = (gastosData ?? []) as Gasto[]
      setGastos(fetchedGastos)
      setLocalGastosMes(mes, fetchedGastos)

      try {
        const { data: metaData, error: metaErr } = await supabase
          .from('metas')
          .select('*')
          .eq('mes', mes)
          .maybeSingle()
        if (!metaErr) {
          const fetchedMeta = metaData as MetaAhorro | null
          setMetaAhorro(fetchedMeta)
          if (fetchedMeta) setLocalMetaMes(mes, fetchedMeta)
        }
      } catch (metaEx) {
        console.warn('[loadData] tabla metas no disponible:', formatError(metaEx))
        setMetaAhorro(localMetaRef.current[mes] ?? null)
      }

      try {
        const { data: aportesData, error: aportesErr } = await supabase
          .from('aportes')
          .select('*')
          .eq('mes', mes)
          .order('created_at', { ascending: false })
        if (!aportesErr) {
          const fetchedAportes = (aportesData ?? []) as AporteMeta[]
          setAportes(fetchedAportes)
          setLocalAportesMes(mes, fetchedAportes)
        }
      } catch (aportesEx) {
        console.warn('[loadData] tabla aportes no disponible:', formatError(aportesEx))
        setAportes(localAportesRef.current[mes] ?? [])
      }

      try {
        const { data: pagosData, error: pagosErr } = await supabase
          .from('pagos_ajuste')
          .select('*')
          .eq('mes', mes)
          .order('created_at', { ascending: false })
        if (!pagosErr) {
          const fetchedPagos = (pagosData ?? []) as PagoAjuste[]
          setPagosAjuste(fetchedPagos)
          setLocalPagosAjusteMes(mes, fetchedPagos)
        }
      } catch (pagosEx) {
        console.warn('[loadData] tabla pagos_ajuste no disponible:', formatError(pagosEx))
        setPagosAjuste(localPagosAjusteRef.current[mes] ?? [])
      }

      setOffline(false)
    } catch (e) {
      const msg = formatError(e)
      console.error('[loadData] error:', msg, e)
      setOffline(true)
      setPerfiles(localPerfilesRef.current[mes] ?? [])
      setGastos(localGastosRef.current[mes] ?? [])
      setMetaAhorro(localMetaRef.current[mes] ?? null)
      setAportes(localAportesRef.current[mes] ?? [])
      setPagosAjuste(localPagosAjusteRef.current[mes] ?? [])
      setError('No se pudo conectar con la base. Se usa modo local.')
    } finally {
      setLoading(false)
    }
  }, [mes, setLocalPerfilesMes, setLocalGastosMes, setLocalMetaMes, setLocalAportesMes, setLocalPagosAjusteMes])

  useEffect(() => {
    writeLocal('mg_mes', mes)
    loadData()
  }, [mes, loadData])

  const updatePerfil = useCallback(
    async (id: number, partial: Partial<Pick<Perfil, 'nombre' | 'ingreso'>>) => {
      const next = perfiles.map((p) => (p.id === id ? { ...p, ...partial } : p))
      setPerfiles(next)
      setLocalPerfilesMes(mes, next)

      if (!offline) {
        const { error: err } = await supabase.from('perfiles').update(partial as any).eq('id', id)
        if (err) {
          console.warn('Error guardando perfil:', err)
        }
      }
    },
    [perfiles, mes, offline, setLocalPerfilesMes]
  )

  const updateMetaAhorro = useCallback(
    async (monto: number, descripcion: string) => {
      const nueva: MetaAhorro = { mes, monto, descripcion }
      setMetaAhorro(nueva)
      setLocalMetaMes(mes, nueva)

      if (!offline) {
        const { error: err } = await supabase
          .from('metas')
          .upsert({ mes, monto, descripcion } as any, { onConflict: 'mes' })
        if (err) {
          console.warn('Error guardando meta:', err)
        }
      }
    },
    [mes, offline, setLocalMetaMes]
  )

  const addGasto = useCallback(
    async (nombre: string, monto: number, pagador: 'A' | 'B', tipoSplit: TipoSplit = 'proporcional') => {
      const [a, b] = perfiles.length >= 2 ? [perfiles[0], perfiles[1]] : [null, null]
      const totalIngreso = (a?.ingreso ?? 0) + (b?.ingreso ?? 0)
      let pctA: number | null = null
      let pctB: number | null = null
      if (tipoSplit === 'solo_a') {
        pctA = 1
        pctB = 0
      } else if (tipoSplit === 'solo_b') {
        pctA = 0
        pctB = 1
      } else if (tipoSplit === 'proporcional' && totalIngreso > 0) {
        pctA = (a?.ingreso ?? 0) / totalIngreso
        pctB = (b?.ingreso ?? 0) / totalIngreso
      }

      // 'solo_a'/'solo_b' se guardan como split proporcional fijado en 100/0
      const tipoSplitDb: Gasto['tipo_split'] = tipoSplit === 'igual' ? 'igual' : 'proporcional'

      const tempId = crypto.randomUUID()
      const nuevo: Gasto = {
        id: tempId,
        nombre,
        monto,
        pagador,
        tipo_split: tipoSplitDb,
        mes,
        created_at: new Date().toISOString(),
        porcentaje_persona_a: pctA,
        porcentaje_persona_b: pctB,
      }
      const next = [nuevo, ...gastos]
      setGastos(next)
      setLocalGastosMes(mes, next)

      if (!offline) {
        const { data, error: err } = await supabase
          .from('gastos')
          .insert({ nombre, monto, pagador, tipo_split: tipoSplitDb, mes, porcentaje_persona_a: pctA, porcentaje_persona_b: pctB } as any)
          .select()
          .single()
        if (err) {
          console.warn('[addGasto] error:', JSON.stringify(err))
        } else if (data) {
          const real = data as Gasto
          const synced = next.map((g) => (g.id === tempId ? real : g))
          setGastos(synced)
          setLocalGastosMes(mes, synced)
        }
      }
    },
    [gastos, mes, perfiles, offline, setLocalGastosMes]
  )

  const addAporte = useCallback(
    async (monto: number, aportante: 'A' | 'B') => {
      const tempId = crypto.randomUUID()
      const nuevo: AporteMeta = {
        id: tempId,
        mes,
        aportante,
        monto,
        created_at: new Date().toISOString(),
      }
      const next = [nuevo, ...aportes]
      setAportes(next)
      setLocalAportesMes(mes, next)

      if (!offline) {
        const { data, error: err } = await supabase
          .from('aportes')
          .insert({ mes, aportante, monto } as any)
          .select()
          .single()
        if (err) {
          console.warn('Error guardando aporte:', JSON.stringify(err))
        } else if (data) {
          const real = data as AporteMeta
          const synced = next.map((a) => (a.id === tempId ? real : a))
          setAportes(synced)
          setLocalAportesMes(mes, synced)
        }
      }
    },
    [aportes, mes, offline, setLocalAportesMes]
  )

  const removeGasto = useCallback(
    async (id: string) => {
      const next = gastos.filter((g) => g.id !== id)
      setGastos(next)
      setLocalGastosMes(mes, next)

      if (!offline) {
        const { error: err } = await supabase.from('gastos').delete().eq('id', id)
        if (err) {
          console.warn('Error borrando gasto:', err)
        }
      }
    },
    [gastos, mes, offline, setLocalGastosMes]
  )

  const addPagoAjuste = useCallback(
    async (pago: Omit<PagoAjuste, 'id' | 'mes' | 'created_at'>) => {
      const tempId = crypto.randomUUID()
      const nuevo: PagoAjuste = { ...pago, id: tempId, mes, created_at: new Date().toISOString() }
      const next = [nuevo, ...pagosAjuste]
      setPagosAjuste(next)
      setLocalPagosAjusteMes(mes, next)

      if (!offline) {
        const { data, error: err } = await supabase
          .from('pagos_ajuste')
          .insert({ ...pago, mes } as any)
          .select()
          .single()
        if (err) {
          console.warn('[addPagoAjuste] error:', JSON.stringify(err))
        } else if (data) {
          const real = data as PagoAjuste
          const synced = next.map((p) => (p.id === tempId ? real : p))
          setPagosAjuste(synced)
          setLocalPagosAjusteMes(mes, synced)
        }
      }
    },
    [pagosAjuste, mes, offline, setLocalPagosAjusteMes]
  )

  const removePagoAjuste = useCallback(
    async (id: string) => {
      const next = pagosAjuste.filter((p) => p.id !== id)
      setPagosAjuste(next)
      setLocalPagosAjusteMes(mes, next)

      if (!offline) {
        const { error: err } = await supabase.from('pagos_ajuste').delete().eq('id', id)
        if (err) {
          console.warn('Error borrando pago ajuste:', err)
        }
      }
    },
    [pagosAjuste, mes, offline, setLocalPagosAjusteMes]
  )

  const splitPorGasto = useMemo<SplitPorGasto[]>(() => {
    const [a, b] = perfiles.length >= 2 ? [perfiles[0], perfiles[1]] : [null, null]
    const totalIngreso = (a?.ingreso ?? 0) + (b?.ingreso ?? 0)
    return gastos.map((g) => {
      if (g.tipo_split === 'igual') {
        return { gasto: g, montoA: g.monto / 2, montoB: g.monto / 2 }
      }
      if (g.porcentaje_persona_a != null && g.porcentaje_persona_b != null) {
        return {
          gasto: g,
          montoA: g.monto * g.porcentaje_persona_a,
          montoB: g.monto * g.porcentaje_persona_b,
        }
      }
      if (totalIngreso === 0) {
        return { gasto: g, montoA: g.monto / 2, montoB: g.monto / 2 }
      }
      return {
        gasto: g,
        montoA: g.monto * ((a?.ingreso ?? 0) / totalIngreso),
        montoB: g.monto * ((b?.ingreso ?? 0) / totalIngreso),
      }
    })
  }, [perfiles, gastos])

  const resumen = useMemo<Resumen>(() => {
    const [a, b] = perfiles.length >= 2 ? [perfiles[0], perfiles[1]] : [null, null]
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
    const ingresoTotal = (a?.ingreso ?? 0) + (b?.ingreso ?? 0)

    let pagadoA = 0
    let pagadoB = 0
    let debeA = 0
    let debeB = 0

    for (const sp of splitPorGasto) {
      const g = sp.gasto
      if (g.pagador === 'A') {
        pagadoA += g.monto
      } else {
        pagadoB += g.monto
      }
      debeA += sp.montoA
      debeB += sp.montoB
    }

    const tolerancia = 0.01

    if (ingresoTotal === 0) {
      return {
        totalGastos,
        ingresoTotal: 0,
        aporteEsperadoA: totalGastos / 2,
        aporteEsperadoB: totalGastos / 2,
        aporteRealA: pagadoA,
        aporteRealB: pagadoB,
        balance: 0,
        deudor: 'ninguno',
        deudaBruta: 0,
        totalPagado: 0,
        deudaNeta: 0,
      }
    }

    // Balance por gastos (positivo = A pagó de más, B le debe a A)
    const balanceGastosA = pagadoA - debeA

    // Pagos de ajuste con dirección: A->B suma al crédito de A, B->A lo resta
    const pagosAaB = pagosAjuste.filter((p) => p.pagador === 'A').reduce((s, p) => s + p.monto, 0)
    const pagosBaA = pagosAjuste.filter((p) => p.pagador === 'B').reduce((s, p) => s + p.monto, 0)

    // Balance neto incorporando los pagos de ajuste según su dirección
    const balanceNetoA = balanceGastosA + pagosAaB - pagosBaA

    // Deuda bruta: lo que surge solo de los gastos (sin pagos)
    const deudaBruta = Math.abs(balanceGastosA) <= tolerancia ? 0 : Math.abs(balanceGastosA)
    const deudorBruto: 'A' | 'B' | 'ninguno' =
      Math.abs(balanceGastosA) <= tolerancia ? 'ninguno' : balanceGastosA < 0 ? 'A' : 'B'

    // Deuda neta: balance real luego de aplicar los pagos en su dirección
    const deudaNeta = Math.abs(balanceNetoA) <= tolerancia ? 0 : Math.abs(balanceNetoA)
    const deudor: 'A' | 'B' | 'ninguno' =
      Math.abs(balanceNetoA) <= tolerancia ? 'ninguno' : balanceNetoA < 0 ? 'A' : 'B'

    // Total pagado que aplica para saldar la deuda bruta (pagos del deudor bruto hacia el acreedor)
    const totalPagado =
      deudorBruto === 'B' ? pagosBaA : deudorBruto === 'A' ? pagosAaB : pagosAaB + pagosBaA

    return {
      totalGastos,
      ingresoTotal,
      aporteEsperadoA: debeA,
      aporteEsperadoB: debeB,
      aporteRealA: pagadoA,
      aporteRealB: pagadoB,
      balance: deudaNeta,
      deudor,
      deudaBruta,
      totalPagado,
      deudaNeta,
    }
  }, [gastos, perfiles, splitPorGasto, pagosAjuste])

  return {
    mes,
    setMes,
    nombreDelMes,
    perfiles,
    gastos,
    metaAhorro,
    aportes,
    pagosAjuste,
    loading,
    error,
    offline,
    updatePerfil,
    updateMetaAhorro,
    addGasto,
    addAporte,
    removeGasto,
    addPagoAjuste,
    removePagoAjuste,
    splitPorGasto,
    resumen,
  }
}
