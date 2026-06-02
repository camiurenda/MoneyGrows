import { Heart } from 'lucide-react'
import { useSplit } from './hooks/useSplit'
import { ProfileCard } from './components/ProfileCard'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { SummaryPanel } from './components/SummaryPanel'

function App() {
  const { perfiles, gastos, loading, error, offline, updatePerfil, addGasto, removeGasto, splitPorGasto, resumen } =
    useSplit()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-light">
        Cargando...
      </div>
    )
  }

  const nombreA = perfiles[0]?.nombre ?? 'Pareja 1'
  const nombreB = perfiles[1]?.nombre ?? 'Pareja 2'

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <header className="text-center mb-2">
          <div className="inline-flex items-center gap-2 text-accent mb-1">
            <Heart size={24} fill="currentColor" />
            <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">MoneyGrows</h1>
          </div>
          <p className="text-text-light text-sm">Dividí gastos con tu media naranja, justo y proporcional.</p>
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
          <ProfileCard perfil={perfiles[0] ?? { id: 1, nombre: 'Ella', ingreso: 0, created_at: '' }} onUpdate={updatePerfil} color="accent" />
          <ProfileCard perfil={perfiles[1] ?? { id: 2, nombre: 'Él', ingreso: 0, created_at: '' }} onUpdate={updatePerfil} color="secondary" />
        </section>

        <ExpenseForm onAdd={addGasto} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-text">Gastos ({gastos.length})</h2>
          </div>
          <ExpenseList splits={splitPorGasto} nombreA={nombreA} nombreB={nombreB} onRemove={removeGasto} />
        </section>

        <SummaryPanel resumen={resumen} perfiles={perfiles} />

        <footer className="text-center text-xs text-text-light pt-4 pb-2">
          Hecho con onda para parejas
        </footer>
      </div>
    </div>
  )
}

export default App
