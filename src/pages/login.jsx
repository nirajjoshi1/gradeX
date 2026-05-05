import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, LockKeyhole, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'

const routeByRole = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
}

const demoAccounts = [
  ['Principal', 'admin'],
  ['Teacher', 'teacher'],
]

export function LoginPage() {
  const navigate = useNavigate()
  const { user, login } = useAuthStore()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password123')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={routeByRole[user.role] ?? '/'} replace />

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const loggedIn = await login({ username, password })
      navigate(routeByRole[loggedIn.role] ?? '/')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,oklch(0.18_0.018_255),oklch(0.29_0.03_235)_48%,oklch(0.82_0.1_165))] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_27rem]">
        <section className="max-w-2xl">
          <Badge className="mb-5 bg-white/12 text-white" variant="outline">
            <ShieldCheck />
            Secure school result management
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Gradex
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
            A role-based workspace for principals and teachers to manage marks,
            grading rules, teacher assignments, and printable report cards.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {demoAccounts.map(([role, account]) => (
              <button
                key={account}
                className="rounded-lg border border-white/15 bg-white/10 p-3 text-left text-sm transition hover:bg-white/15"
                type="button"
                onClick={() => setUsername(account)}
              >
                <span className="block font-medium">{role}</span>
                <span className="mt-1 block text-xs text-white/65">{account} / password123</span>
              </button>
            ))}
          </div>
        </section>

        <Card className="rounded-lg bg-white text-foreground shadow-2xl">
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your school account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Username
                </span>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Password
                </span>
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="Password"
                />
              </label>
              <Button className="w-full" disabled={busy} type="submit">
                <LockKeyhole />
                {busy ? 'Signing in...' : 'Open dashboard'}
                <ArrowRight />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
