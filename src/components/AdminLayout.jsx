import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin/calendario', label: 'Calendario', icon: '🗓️' },
  { to: '/admin/servicios', label: 'Servicios', icon: '💼' },
  { to: '/admin/recordatorios', label: 'Recordatorios', icon: '📲' },
  { to: '/admin/resenas', label: 'Reseñas', icon: '⭐' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-dvh bg-brand-50">
      <header className="safe-top border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-brand-400">Panel de administración</p>
            <p className="font-semibold text-brand-700">Hola, {profile?.full_name?.split(' ')[0] || 'Melani'} 👋</p>
          </div>
          <button onClick={signOut} className="text-sm font-medium text-brand-500 underline">
            Cerrar sesión
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-600'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
