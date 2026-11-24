import { Routes, Route } from 'react-router-dom'
import ClientLayout from './components/ClientLayout'
import AdminLayout from './components/AdminLayout'
import { RequireClient, RequireAdmin } from './components/ProtectedRoute'

import Home from './pages/client/Home'
import Login from './pages/client/Login'
import Book from './pages/client/Book'
import MisCitas from './pages/client/MisCitas'
import DejarResena from './pages/client/DejarResena'

import AdminLogin from './pages/admin/AdminLogin'
import Calendar from './pages/admin/Calendar'
import Services from './pages/admin/Services'
import Reminders from './pages/admin/Reminders'
import AdminReviews from './pages/admin/AdminReviews'

function App() {
  return (
    <Routes>
      {/* Zona de administración */}
      <Route path="/admin/ingresar" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Calendar />} />
        <Route path="calendario" element={<Calendar />} />
        <Route path="servicios" element={<Services />} />
        <Route path="recordatorios" element={<Reminders />} />
        <Route path="resenas" element={<AdminReviews />} />
      </Route>

      {/* Zona de clientas */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ingresar" element={<Login />} />
        <Route path="/reservar" element={<Book />} />
        <Route
          path="/mis-citas"
          element={
            <RequireClient>
              <MisCitas />
            </RequireClient>
          }
        />
        <Route
          path="/mis-citas/:id/resena"
          element={
            <RequireClient>
              <DejarResena />
            </RequireClient>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
