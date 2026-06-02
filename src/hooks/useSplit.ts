import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Perfil, Gasto, SplitPorGasto, Resumen, MetaAhorro } from '../types'

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

export function useSplit() {
  const [mes, setMes] = useState<string>(() => readLocal('mg_mes', getMesActual()))
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [metaAhorro, setMetaAhorro] = useState<MetaAhorro | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const localPerfilesRef = useRef<Record<string, Perfil[]>>(readLocal('mg_perfiles_mes', {}))
  const localGastosRef = useRef<Record<string, Gasto[]>>(readLocal('mg_gastos_mes', {}))
  const localMetaRef = useRef<Record<string, MetaAhorro>>(readLocal('mg_meta_mes', {}))

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

      const { data: metaData, error: metaErr } = await supabase
        .from('metas')
        .select('*')
        .eq('mes', mes)
        .maybeSingle()

      if (metaErr) throw metaErr

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

      const fetchedMeta = metaData as MetaAhorro | null
      setMetaAhorro(fetchedMeta)
      if (fetchedMeta) setLocalMetaMes(mes, fetchedMeta)

      setOffline(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[loadData] error:', msg, e)
      setOffline(true)
      setPerfiles(localPerfilesRef.current[mes] ?? [])
      setGastos(localGastosRef.current[mes] ?? [])
      setMetaAhorro(localMetaRef.current[mes] ?? null)
      setError('No se pudo conectar con la base. Se usa modo local.')
    } finally {
      setLoading(false)
    }
  }, [mes, setLocalPerfilesMes, setLocalGastosMes, setLocalMetaMes])

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
        } else {
          loadData()
        }
      }
    },
    [mes, offline, setLocalMetaMes, loadData]
  )

  const addGasto = useCallback(
    async (nombre: string, monto: number, pagador: 'A' | 'B') => {
      const nuevo: Gasto = {
        id: crypto.randomUUID(),
        nombre,
        monto,
        pagador,
        mes,
        created_at: new Date().toISOString(),
      }
      const next = [nuevo, ...gastos]
      setGastos(next)
      setLocalGastosMes(mes, next)

      if (!offline) {
        const { error: err } = await supabase.from('gastos').insert({ nombre, monto, pagador, mes } as any)
        if (err) {
          console.warn('Error guardando gasto:', err)
        } else {
          loadData()
        }
      }
    },
    [gastos, mes, offline, setLocalGastosMes, loadData]
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

  const splitPorGasto = useMemo<SplitPorGasto[]>(() => {
    const [a, b] = perfiles.length >= 2 ? [perfiles[0], perfiles[1]] : [null, null]
    const totalIngreso = (a?.ingreso ?? 0) + (b?.ingreso ?? 0)
    if (totalIngreso === 0) {
      return gastos.map((g) => ({ gasto: g, montoA: g.monto / 2, montoB: g.monto / 2 }))
    }
    return gastos.map((g) => ({
      gasto: g,
      montoA: g.monto * ((a?.ingreso ?? 0) / totalIngreso),
      montoB: g.monto * ((b?.ingreso ?? 0) / totalIngreso),
    }))
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
      }
    }

    const balanceA = pagadoA - debeA
    const tolerancia = 0.01

    let balance = 0
    let deudor: 'A' | 'B' | 'ninguno' = 'ninguno'

    if (Math.abs(balanceA) <= tolerancia) {
      balance = 0
      deudor = 'ninguno'
    } else if (balanceA < 0) {
      balance = Math.abs(balanceA)
      deudor = 'A'
    } else {
      balance = balanceA
      deudor = 'B'
    }

    return {
      totalGastos,
      ingresoTotal,
      aporteEsperadoA: debeA,
      aporteEsperadoB: debeB,
      aporteRealA: pagadoA,
      aporteRealB: pagadoB,
      balance,
      deudor,
    }
  }, [gastos, perfiles, splitPorGasto])

  return {
    mes,
    setMes,
    nombreDelMes,
    perfiles,
    gastos,
    metaAhorro,
    loading,
    error,
    offline,
    updatePerfil,
    updateMetaAhorro,
    addGasto,
    removeGasto,
    splitPorGasto,
    resumen,
  }
}
