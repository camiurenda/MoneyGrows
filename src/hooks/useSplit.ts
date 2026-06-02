import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Perfil, Gasto, SplitPorGasto, Resumen } from '../types'

const PERFIL_IDS = [1, 2]

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  const setStored = useCallback((v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      // noop
    }
  }, [key])
  return [value, setStored]
}

export function useSplit() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const [localPerfiles, setLocalPerfiles] = useLocalStorage<Perfil[]>('mg_perfiles', [
    { id: 1, nombre: 'Ella', ingreso: 0, created_at: new Date().toISOString() },
    { id: 2, nombre: 'Él', ingreso: 0, created_at: new Date().toISOString() },
  ])
  const [localGastos, setLocalGastos] = useLocalStorage<Gasto[]>('mg_gastos', [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: perfilesData, error: perfilesErr } = await supabase
        .from('perfiles')
        .select('*')
        .in('id', PERFIL_IDS)
        .order('id')

      if (perfilesErr) throw perfilesErr

      const { data: gastosData, error: gastosErr } = await supabase
        .from('gastos')
        .select('*')
        .order('created_at', { ascending: false })

      if (gastosErr) throw gastosErr

      const fetchedPerfiles = (perfilesData ?? []) as Perfil[]
      if (fetchedPerfiles.length === 0) {
        // seed inicial
        const seeds = localPerfiles
        for (const p of seeds) {
          await supabase.from('perfiles').insert({ id: p.id, nombre: p.nombre, ingreso: p.ingreso } as any)
        }
        setPerfiles(seeds)
      } else {
        setPerfiles(fetchedPerfiles)
        setLocalPerfiles(fetchedPerfiles)
      }

      const fetchedGastos = (gastosData ?? []) as Gasto[]
      setGastos(fetchedGastos)
      setLocalGastos(fetchedGastos)
      setOffline(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setOffline(true)
        setPerfiles(localPerfiles)
        setGastos(localGastos)
      } else {
        setError('No se pudo conectar con la base. Se usa modo local.')
        setOffline(true)
        setPerfiles(localPerfiles)
        setGastos(localGastos)
      }
    } finally {
      setLoading(false)
    }
  }, [localPerfiles, localGastos, setLocalPerfiles, setLocalGastos])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updatePerfil = useCallback(
    async (id: number, partial: Partial<Pick<Perfil, 'nombre' | 'ingreso'>>) => {
      const next = perfiles.map((p) => (p.id === id ? { ...p, ...partial } : p))
      setPerfiles(next)
      setLocalPerfiles(next)

      if (!offline) {
        const { error: err } = await supabase.from('perfiles').update(partial as any).eq('id', id)
        if (err) {
          console.warn('Error guardando perfil:', err)
        }
      }
    },
    [perfiles, offline, setLocalPerfiles]
  )

  const addGasto = useCallback(
    async (nombre: string, monto: number) => {
      const nuevo: Gasto = {
        id: crypto.randomUUID(),
        nombre,
        monto,
        created_at: new Date().toISOString(),
      }
      const next = [nuevo, ...gastos]
      setGastos(next)
      setLocalGastos(next)

      if (!offline) {
        const { error: err } = await supabase.from('gastos').insert({ nombre, monto } as any)
        if (err) {
          console.warn('Error guardando gasto:', err)
        } else {
          // recargar para tener el UUID real de la base
          loadData()
        }
      }
    },
    [gastos, offline, setLocalGastos, loadData]
  )

  const removeGasto = useCallback(
    async (id: string) => {
      const next = gastos.filter((g) => g.id !== id)
      setGastos(next)
      setLocalGastos(next)

      if (!offline) {
        const { error: err } = await supabase.from('gastos').delete().eq('id', id)
        if (err) {
          console.warn('Error borrando gasto:', err)
        }
      }
    },
    [gastos, offline, setLocalGastos]
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

    const aporteRealA = splitPorGasto.reduce((s, sp) => s + sp.montoA, 0)
    const aporteRealB = splitPorGasto.reduce((s, sp) => s + sp.montoB, 0)

    if (ingresoTotal === 0) {
      return {
        totalGastos,
        ingresoTotal: 0,
        aporteEsperadoA: totalGastos / 2,
        aporteEsperadoB: totalGastos / 2,
        aporteRealA,
        aporteRealB,
        balance: 0,
        deudor: 'ninguno',
      }
    }

    const aporteEsperadoA = totalGastos * ((a?.ingreso ?? 0) / ingresoTotal)
    const aporteEsperadoB = totalGastos * ((b?.ingreso ?? 0) / ingresoTotal)

    const diferenciaA = aporteRealA - aporteEsperadoA
    const tolerancia = 0.01

    let balance = 0
    let deudor: 'A' | 'B' | 'ninguno' = 'ninguno'

    if (Math.abs(diferenciaA) <= tolerancia) {
      balance = 0
      deudor = 'ninguno'
    } else if (diferenciaA < 0) {
      balance = Math.abs(diferenciaA)
      deudor = 'A'
    } else {
      balance = diferenciaA
      deudor = 'B'
    }

    return {
      totalGastos,
      ingresoTotal,
      aporteEsperadoA,
      aporteEsperadoB,
      aporteRealA,
      aporteRealB,
      balance,
      deudor,
    }
  }, [gastos, perfiles, splitPorGasto])

  return {
    perfiles,
    gastos,
    loading,
    error,
    offline,
    updatePerfil,
    addGasto,
    removeGasto,
    splitPorGasto,
    resumen,
  }
}
