import { useState, useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, GraduationCap, LayoutDashboard, LockKeyhole, ShieldCheck, Sparkles, Users, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { NotFoundPage } from './error-page'

const routeByRole = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  SUPER_ADMIN: '/super-admin',
}

const demoAccounts = [
  { role: 'Principal', account: 'admin', description: 'Full administrative access' },
  { role: 'Teacher', account: 'teacher', description: 'Marks entry & class view' },
]

const features = [
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Principals and teachers each get their own workspace' },
  { icon: BookOpen, title: 'Smart Grading', desc: 'Configurable grade rules with automatic GPA calculation' },
  { icon: LayoutDashboard, title: 'Live Ledger', desc: 'Class-wide result ledger updated in real time' },
  { icon: Users, title: 'Report Cards', desc: 'Professional PDF report cards in one click' },
]

const reservedSlugs = ['admin', 'teacher', 'super-admin', 'demo']

export function LoginPage() {
  const navigate = useNavigate()
  const { schoolSlug } = useParams()
  const { user, login } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [branding, setBranding] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [checking, setChecking] = useState(!!schoolSlug)

  // Load branding by slug on mount
  useEffect(() => {
    if (!schoolSlug) {
      setChecking(false)
      return
    }

    // Immediately block reserved words if they hit the school slug route
    if (reservedSlugs.includes(schoolSlug)) {
      setNotFound(true)
      setChecking(false)
      return
    }

    if (schoolSlug === 'demo') {
      setBranding(null) // Generic GradeX branding
      setChecking(false)
      return
    }

    setChecking(true)
    api(`/auth/school/${schoolSlug}`)
      .then((data) => {
        setBranding(data)
        setNotFound(false)
      })
      .catch((err) => {
        if (err.status === 404 || err.message.includes('404')) {
          setNotFound(true)
        }
      })
      .finally(() => setChecking(false))
  }, [schoolSlug])

  // Fetch school branding when username changes (on blur) - for generic login
  async function onUsernameBlur() {
    if (!username || branding || schoolSlug) return
    try {
      const data = await api(`/auth/identify/${username}`)
      if (data) setBranding(data)
    } catch (e) {
      // Keep existing branding if any
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(135deg,oklch(0.14_0.025_260)_0%,oklch(0.18_0.032_250)_40%,oklch(0.22_0.04_230)_70%,oklch(0.28_0.06_195)_100%)] text-white">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-16 animate-ping rounded-full bg-white/10" />
          <div className="relative flex size-12 items-center justify-center rounded-full bg-white/10 text-white shadow-xl backdrop-blur-md border border-white/20">
            <GraduationCap className="size-6 animate-bounce" />
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">GradeX</h1>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            <span className="inline-block size-1 animate-pulse rounded-full bg-emerald-400" />
            Verifying Institution
          </div>
        </div>
      </div>
    )
  }

  if (notFound) return <NotFoundPage />
  if (user) return <Navigate to={routeByRole[user.role] ?? '/'} replace />

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const loggedIn = await login({ username, password, schoolSlug })
      
      if (loggedIn.role === 'SUPER_ADMIN') {
        navigate('/super-admin')
      } else {
        const slug = loggedIn.school?.slug || schoolSlug || 'demo'
        navigate(`/${slug}${routeByRole[loggedIn.role] ?? '/'}`)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.14_0.025_260)_0%,oklch(0.18_0.032_250)_40%,oklch(0.22_0.04_230)_70%,oklch(0.28_0.06_195)_100%)]" />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[500px] rounded-full bg-[oklch(0.55_0.22_262)] opacity-[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-[420px] rounded-full bg-[oklch(0.72_0.2_162)] opacity-[0.09] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-[oklch(0.45_0.15_240)] opacity-[0.05] blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40 overflow-hidden">
          {/* Card top accent */}
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,oklch(0.52_0.19_262),oklch(0.7_0.18_162))]" />

          <div className="p-8 sm:p-10">
            {/* Card header */}
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,oklch(0.52_0.19_262),oklch(0.62_0.21_250))] shadow-xl shadow-primary/20 overflow-hidden mb-5">
                {branding?.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <GraduationCap className="size-8 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">
                {branding ? `Sign in to ${branding.name}` : 'Sign in to your school account'}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={onUsernameBlur}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-base focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-base focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-xl font-bold text-base bg-[linear-gradient(135deg,oklch(0.52_0.19_262),oklch(0.62_0.21_250))] text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:translate-y-0 mt-4"
                disabled={busy}
                type="submit"
              >
                {busy ? 'Signing in…' : (
                  <>
                    <LockKeyhole className="size-5" />
                    Open Dashboard
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-center text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                Protected by role-based authentication · GradeX v2
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
