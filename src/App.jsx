import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppShell } from '@/components/layout/app-shell'
import { AdminDashboard } from '@/pages/admin-dashboard'
import { LoginPage } from '@/pages/login'
import { SuperAdminDashboard } from '@/pages/super-admin-dashboard'
import { TeacherDashboard } from '@/pages/teacher-dashboard'
import { useAuthStore } from '@/stores/auth-store'

const homeByRole = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  TEACHER: '/teacher',
}

function RequireAuth({ role, children }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading...</div>
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={homeByRole[user.role] ?? '/login'} replace />

  return children
}

function App() {
  const { user, loadMe } = useAuthStore()

  useEffect(() => {
    loadMe()
  }, [loadMe])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/super-admin" element={<RequireAuth role="SUPER_ADMIN"><SuperAdminDashboard /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth role="ADMIN"><AdminDashboard /></RequireAuth>} />
          <Route path="/teacher" element={<RequireAuth role="TEACHER"><TeacherDashboard /></RequireAuth>} />
        </Route>
        <Route path="*" element={<Navigate to={user ? homeByRole[user.role] : '/login'} replace />} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  )
}

export default App
