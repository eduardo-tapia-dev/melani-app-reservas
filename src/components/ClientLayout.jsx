import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SALON_NAME } from '../lib/supabase'

const navItems = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/reservar', label: 'Reservar', icon: '📅' },
  { to: '/mis-citas', label: 'Mis citas', icon: '💅' },
]

export default function ClientLayout() {
  const { user, profile, signOut } = useAuth()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-brand-50">
      <header className="safe-top sticky top-0 z-10 border-b border-brand-100 bg-brand-50/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-xl">💕</span>
            <span className="font-semibold text-brand-700">{SALON_NAME}</span>
          </NavLink>
          {user ? (
            <button onClick={signOut} className="text-xs text-brand-500 underline">
              {profile?.full_name?.split(' ')[0] || 'Salir'}
            </button>
          ) : (
            <NavLink to="/ingresar" className="text-xs font-medium text-brand-600 underline">
              Ingresar
            </NavLink>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-brand-100 bg-white">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-xs font-medium ${
                  isActive ? 'text-brand-600' : 'text-brand-300'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
