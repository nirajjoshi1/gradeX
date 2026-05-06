import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Layers3,
  Moon,
  PanelLeft,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sun,
  UserCircle,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DialogTitle } from '@/components/ui/dialog'

/* ─── Navigation config ─────────────────────────────────────────────────── */

const adminSidebarSections = [
  {
    label: 'School Setup',
    items: [
      { view: 'classes',  label: 'Classes',         icon: Layers3 },
      { view: 'subjects', label: 'Subjects',         icon: BookOpen },
      { view: 'students', label: 'Students',         icon: GraduationCap },
    ],
  },
  {
    label: 'Staff',
    items: [
      { view: 'teachers',    label: 'Teachers',     icon: Users },
    ],
  },
  {
    label: 'Assessments',
    items: [
      { view: 'exams',   label: 'Exams',          icon: CalendarDays },
      { view: 'grading', label: 'Grading Rules',  icon: Save },
      { view: 'ledger',  label: 'Result Ledger',  icon: ClipboardList },
      { view: 'publish', label: 'Report Cards',   icon: Send },
    ],
  },
]

const teacherSidebarSections = [
  {
    label: 'My Workspace',
    items: [
      { view: 'dashboard',   label: 'Overview',        icon: LayoutDashboard },
      { view: 'students',    label: 'My Students',     icon: GraduationCap },
      { view: 'marks',       icon: BookOpenCheck,      label: 'Enter Marks' },
    ],
  },
  {
    label: 'Account',
    items: [
      { view: 'profile', label: 'Profile Settings', icon: UserCircle },
    ],
  },
]

const superAdminSidebarSections = [
  {
    label: 'Platform',
    items: [
      { view: 'schools', label: 'School Directory', icon: LayoutDashboard },
    ],
  },
]

/* Mobile bottom nav items per role */
const adminBottomNav = [
  { view: 'dashboard',   icon: LayoutDashboard, label: 'Home'     },
  { view: 'classes',     icon: Layers3,          label: 'Classes'  },
  { view: 'students',    icon: GraduationCap,    label: 'Students' },
  { view: 'exams',       icon: CalendarDays,     label: 'Exams'    },
  { view: 'publish',     icon: Send,             label: 'Reports'  },
]

const teacherBottomNav = [
  { view: 'dashboard',   icon: LayoutDashboard, label: 'Home'    },
  { view: 'students',    icon: GraduationCap,   label: 'Students'},
  { view: 'marks',       icon: BookOpenCheck,   label: 'Marks'   },
  { view: 'profile',     icon: UserCircle,      label: 'Profile' },
]

const roleTone = {
  SUPER_ADMIN: 'Platform admin',
  ADMIN: 'Principal',
  TEACHER: 'Teacher',
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { schoolSlug } = useParams()
  const activeView = new URLSearchParams(location.search).get('view') ?? 'dashboard'
  
  const slug = user?.school?.slug || schoolSlug || 'demo'
  const basePath = user?.role === 'ADMIN' ? `/${slug}/admin` : user?.role === 'SUPER_ADMIN' ? '/super-admin' : `/${slug}/teacher`

  const sidebarSections =
    user?.role === 'SUPER_ADMIN' ? superAdminSidebarSections
    : user?.role === 'ADMIN'     ? adminSidebarSections
    : teacherSidebarSections

  const bottomNavItems =
    user?.role === 'ADMIN' ? adminBottomNav
    : user?.role === 'TEACHER' ? teacherBottomNav
    : []

  async function onLogout() {
    await logout()
    navigate(`/${slug}/login`)
  }

  /* ── Sidebar inner content (shared desktop/mobile) ─────────────────── */
  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Brand header */}
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-sidebar-border/60">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,oklch(0.52_0.19_262),oklch(0.62_0.21_250))] shadow-md shadow-primary/30 overflow-hidden border border-white/10">
              {user?.school?.logoUrl ? (
                <img src={user.school.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <GraduationCap className="size-5 text-white" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-sidebar-foreground leading-none">
                {user?.school?.name || 'GradeX'}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {user?.role === 'SUPER_ADMIN' ? 'Platform management' : user?.school?.address || 'Educational Excellence'}
              </p>
            </div>
          </Link>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin?view=settings"
              onClick={() => setDrawerOpen(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title="Settings"
            >
              <Settings className="size-4" />
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeView === item.view
                  return (
                    <Link
                      key={item.view}
                      to={`${basePath}?view=${item.view}`}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-[linear-gradient(135deg,oklch(0.52_0.19_262),oklch(0.62_0.21_250))] text-white shadow-sm shadow-primary/25'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5',
                      )}
                    >
                      <item.icon className={cn('size-4 shrink-0', !isActive && 'text-muted-foreground group-hover:text-sidebar-accent-foreground')} />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto size-1.5 rounded-full bg-white/70" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>


      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border/60 bg-sidebar shadow-sm md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div className="flex min-h-screen w-full flex-col md:pl-64">

        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile drawer trigger */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-xl md:hidden text-muted-foreground hover:bg-muted"
                >
                  <PanelLeft className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border/60">
                <DialogTitle className="sr-only">Navigation</DialogTitle>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* User info */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight max-w-[140px] sm:max-w-xs">
                {user?.name}
              </p>
              <p className="text-[11px] text-muted-foreground">{roleTone[user?.role]}</p>
            </div>
          </div>

          {/* Header right */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl text-muted-foreground"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>



            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="size-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:hidden"
            >
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="hidden md:flex rounded-xl h-9 px-3 gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 mx-auto w-full max-w-screen-2xl p-3 sm:p-5 md:p-7 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────── */}
      {bottomNavItems.length > 0 && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md">
          <div className="flex items-stretch justify-around px-1 py-1 safe-area-inset-bottom">
            {bottomNavItems.map((item) => {
              const isActive = activeView === item.view
              return (
                <Link
                  key={item.view}
                  to={`${basePath}?view=${item.view}`}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center size-8 rounded-xl transition-all',
                    isActive && 'bg-primary/12',
                  )}>
                    <item.icon className={cn('size-5', isActive && 'stroke-[2.2]')} />
                  </div>
                  <span className={cn('text-[9.5px] font-semibold tracking-wide', isActive && 'text-primary')}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
