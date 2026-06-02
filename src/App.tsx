import { Feather, ChevronLeft, ChevronRight, Bird, Leaf } from 'lucide-react'
import { useSplit } from './hooks/useSplit'
import { ProfileCard } from './components/ProfileCard'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { SummaryPanel } from './components/SummaryPanel'
import { SavingsGoal } from './components/SavingsGoal'

function cambiarMes(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function App() {
  const { mes, setMes, nombreDelMes, perfiles, gastos, metaAhorro, loading, error, offline, updatePerfil, updateMetaAhorro, addGasto, removeGasto, splitPorGasto, resumen } =
    useSplit()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-light">
        Construyendo el nido...
      </div>
    )
  }

  const nombreA = perfiles[0]?.nombre ?? 'Camila'
  const nombreB = perfiles[1]?.nombre ?? 'Lucía'
  const ahorroActual = Math.max(0, resumen.ingresoTotal - resumen.totalGastos)

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <header className="text-center mb-2">
          <div className="inline-flex items-center gap-2 text-accent mb-1">
            <Feather size={24} />
            <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">MoneyGrows</h1>
            <Bird size={24} className="text-secondary" />
          </div>
          <p className="text-text-light text-sm">Construyendo el nido juntas. Gastos justos y proporcionales para su hogar.</p>

          <div className="inline-flex items-center gap-2 mt-3 bg-card rounded-full shadow-[var(--shadow-card)] px-1 py-1">
            <button
              onClick={() => setMes(cambiarMes(mes, -1))}
              className="p-2 rounded-full hover:bg-bg text-text-light hover:text-text transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text min-w-[140px] text-center select-none">
              {nombreDelMes(mes)}
            </span>
            <button
              onClick={() => setMes(cambiarMes(mes, 1))}
              className="p-2 rounded-full hover:bg-bg text-text-light hover:text-text transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {offline && (
            <span className="inline-block mt-2 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
              Modo local (sin conexión a base)
            </span>
          )}
          {error && !offline && (
            <span className="inline-block mt-2 text-xs bg-danger/10 text-danger px-2 py-1 rounded-full">
              {error}
            </span>
          )}
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProfileCard perfil={perfiles[0] ?? { id: 1, nombre: 'Camila', ingreso: 0, mes, created_at: '' }} onUpdate={updatePerfil} color="accent" />
          <ProfileCard perfil={perfiles[1] ?? { id: 2, nombre: 'Lucía', ingreso: 0, mes, created_at: '' }} onUpdate={updatePerfil} color="secondary" />
        </section>

        <SavingsGoal meta={metaAhorro} ahorroActual={ahorroActual} onUpdate={updateMetaAhorro} />

        <ExpenseForm onAdd={addGasto} nombreA={nombreA} nombreB={nombreB} />

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Leaf size={18} className="text-secondary" />
            <h2 className="text-base font-semibold text-text">Gastos del mes ({gastos.length})</h2>
          </div>
          <ExpenseList splits={splitPorGasto} nombreA={nombreA} nombreB={nombreB} onRemove={removeGasto} />
        </section>

        <SummaryPanel resumen={resumen} perfiles={perfiles} />

        <footer className="text-center text-xs text-text-light pt-4 pb-2">
          Hecho con amor para su nido
        </footer>
      </div>
    </div>
  )
}

export default App
