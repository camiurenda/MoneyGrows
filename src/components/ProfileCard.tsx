import { useState } from 'react'
import { Egg, DollarSign } from 'lucide-react'
import type { Perfil } from '../types'

interface ProfileCardProps {
  perfil: Perfil
  onUpdate: (id: number, partial: Partial<Pick<Perfil, 'nombre' | 'ingreso'>>) => void
  color: 'accent' | 'secondary'
}

export function ProfileCard({ perfil, onUpdate, color }: ProfileCardProps) {
  const [nombre, setNombre] = useState(perfil.nombre)
  const [ingreso, setIngreso] = useState(String(perfil.ingreso))

  const commitNombre = () => {
    if (nombre.trim()) onUpdate(perfil.id, { nombre: nombre.trim() })
  }

  const commitIngreso = () => {
    const n = parseFloat(ingreso)
    onUpdate(perfil.id, { ingreso: isNaN(n) ? 0 : n })
  }

  const ringColor = color === 'accent' ? 'focus:ring-accent' : 'focus:ring-secondary'
  const iconBg = color === 'accent' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'

  return (
    <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <Egg size={20} />
        </div>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={commitNombre}
          className={`text-lg font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-text focus:outline-none ${ringColor} focus:ring-1 rounded px-1 w-full transition-colors`}
          placeholder="Nombre"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-text-light">Ingreso mensual</label>
        <div className="relative">
          <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type="number"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
            onBlur={commitIngreso}
            className={`w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none ${ringColor} focus:ring-1 transition-all`}
            placeholder="0"
            min={0}
          />
        </div>
      </div>
    </div>
  )
}
