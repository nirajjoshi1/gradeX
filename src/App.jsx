import { useEffect } from 'react'
import { GraduationCap } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes, useParams, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppShell } from '@/components/layout/app-shell'
import { ThemeProvider } from '@/components/theme-provider'
import { AdminDashboard } from '@/pages/admin-dashboard'
import { LoginPage } from '@/pages/login'
import { LandingPage } from '@/pages/landing'
import { SuperAdminDashboard } from '@/pages/super-admin-dashboard'
import { TeacherDashboard } from '@/pages/teacher-dashboard'
import { NotFoundPage } from '@/pages/error-page'
import BulkImport from '@/pages/bulk-import'
import { useAuthStore } from '@/stores/auth-store'

const homeByRole = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  TEACHER: '/teacher',
}

function RequireAuth({ role, children }) {
  const { user, loading } = useAuthStore()
  const { schoolSlug } = useParams()
  const { pathname } = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-16 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="size-6 animate-bounce" />
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">GradeX</h1>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <span className="inline-block size-1 animate-pulse rounded-full bg-primary" />
            Initializing Workspace
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    const loginPath = schoolSlug ? `/${schoolSlug}/login` : '/demo/login'
    if (pathname === loginPath) return children
    return <Navigate to={loginPath} replace />
  }

  // Redirect to correct dashboard if role doesn't match current route
  if (role && user.role !== role) {
    if (user.role === 'SUPER_ADMIN') {
      if (pathname === '/super-admin') return children
      return <Navigate to="/super-admin" replace />
    }
    const slug = user.school?.slug || schoolSlug || 'demo'
    const target = `/${slug}${homeByRole[user.role] ?? '/login'}`
    if (pathname === target) return children
    return <Navigate to={target} replace />
  }

  return children
}

function App() {
  const { user, loadMe } = useAuthStore()

  useEffect(() => {
    loadMe()
  }, [loadMe])

  return (
    <ThemeProvider defaultTheme="light" storageKey="gradex-theme" attribute="class">
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* General/Super Admin Login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Super Admin with Shell - Placed ABOVE greedy schoolSlug */}
          <Route
            element={
              <RequireAuth role="SUPER_ADMIN">
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
          </Route>

          <Route path="/:schoolSlug">
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<LoginPage />} />
            
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="admin" element={<RequireAuth role="ADMIN"><AdminDashboard /></RequireAuth>} />
              <Route path="admin/bulk-import" element={<RequireAuth role="ADMIN"><BulkImport /></RequireAuth>} />
              <Route path="teacher" element={<RequireAuth role="TEACHER"><TeacherDashboard /></RequireAuth>} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster richColors closeButton />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
