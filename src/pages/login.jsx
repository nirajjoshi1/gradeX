import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
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

const reservedSlugs = ['admin', 'teacher', 'super-admin']

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
  if (user) {
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />
    const slug = user.school?.slug || schoolSlug || 'demo'
    return <Navigate to={`/${slug}${routeByRole[user.role] ?? '/'}`} replace />
  }

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

      <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
        {/* Back to Home Link - Top left anchor */}
        <Link 
          to="/" 
          className="mb-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all w-fit"
        >
          <ArrowRight className="size-3 rotate-180" />
          Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
          {/* Main Login Card */}
          <div className="w-full lg:w-[380px] shrink-0 rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40 overflow-hidden">
            {/* Card top accent */}
            <div className="h-1 w-full bg-[linear-gradient(90deg,oklch(0.52_0.19_262),oklch(0.7_0.18_162))]" />

            <div className="p-6 sm:p-8">
              {/* Card header */}
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,oklch(0.52_0.19_262),oklch(0.62_0.21_250))] shadow-lg shadow-primary/20 overflow-hidden mb-4">
                  {branding?.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <GraduationCap className="size-7 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {branding ? `Sign in to ${branding.name}` : 'Sign in to your school'}
                </p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={onUsernameBlur}
                    placeholder="Username"
                    autoComplete="username"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      autoComplete="current-password"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full h-11 rounded-xl font-bold text-sm bg-[linear-gradient(135deg,oklch(0.52_0.19_262),oklch(0.62_0.21_250))] text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? 'Opening…' : (
                    <>
                      <LockKeyhole className="size-4" />
                      Open Dashboard
                    </>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-6 flex flex-col items-center">
                <p className="text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  GradeX v2 Secure Login
                </p>
              </div>
            </div>
          </div>

          {/* Demo Quick Access - Beside on LG, below on mobile */}
          {schoolSlug === 'demo' && (
            <div className="flex-1 p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1.5 tracking-tight">Try the Demo</h3>
                <p className="text-xs text-white/30 leading-relaxed max-w-xs">
                  Explore how GradeX handles multi-tenant school operations.
                </p>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { role: 'School Admin', user: 'admin', desc: 'Full Control', icon: ShieldCheck, color: 'text-emerald-400' },
                  { role: 'Teacher', user: 'teacher', desc: 'Marks Entry', icon: Users, color: 'text-sky-400' }
                ].map((acc) => (
                  <button
                    key={acc.user}
                    onClick={() => {
                      setUsername(acc.user)
                      setPassword('password123')
                    }}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 text-left hover:border-white/20 hover:bg-white/10 transition-all"
                  >
                    <div className={`size-10 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 transition-all ${acc.color}`}>
                      <acc.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{acc.role}</p>
                      <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{acc.desc}</p>
                    </div>
                    <ArrowRight className="ml-auto size-3.5 text-white/20 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center gap-2.5 text-[10px] text-white/20 uppercase tracking-widest font-bold">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  St. Marys Academy Live
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
