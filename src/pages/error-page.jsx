import { useNavigate, useParams } from 'react-router-dom'
import { GraduationCap, Home, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { schoolSlug } = useParams()

  const homePath = '/'

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.14_0.025_260)_0%,oklch(0.18_0.032_250)_40%,oklch(0.22_0.04_230)_70%,oklch(0.28_0.06_195)_100%)]" />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[500px] rounded-full bg-[oklch(0.55_0.22_262)] opacity-[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-[420px] rounded-full bg-[oklch(0.72_0.2_162)] opacity-[0.09] blur-3xl" />

      <div className="relative z-10 text-center max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-24 items-center justify-center rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
            <ShieldAlert className="size-12 text-rose-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-8xl font-black text-white leading-none">404</h1>
            <p className="text-xl font-bold text-white/80 uppercase tracking-widest">Page Not Found</p>
          </div>
        </div>

        <p className="text-white/40 text-lg font-light leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            className="h-12 px-8 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
          >
            <ArrowLeft className="mr-2 size-4" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate(homePath)} 
            className="h-12 px-8 rounded-xl bg-[linear-gradient(135deg,oklch(0.52_0.19_262),oklch(0.62_0.21_250))] text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <Home className="mr-2 size-4" />
            Back to Home
          </Button>
        </div>

        <div className="pt-12 flex items-center justify-center gap-2 opacity-20">
          <GraduationCap className="size-5 text-white" />
          <span className="text-sm font-bold tracking-tighter text-white">GradeX v2</span>
        </div>
      </div>
    </main>
  )
}
