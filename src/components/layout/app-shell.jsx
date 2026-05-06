import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Layers3,
  LogOut,
  PanelLeft,
  Save,
  Send,
  ShieldCheck,
  Users,
  LayoutDashboard,
  ClipboardList,
  UserCircle,
  Settings,
  Sun,
  Moon
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { DialogTitle } from '@/components/ui/dialog' // For accessibility

const navByRole = {
  SUPER_ADMIN: [{ to: '/super-admin', label: 'Dashboard', icon: ShieldCheck }],
  ADMIN: [{ to: '/admin', label: 'Dashboard', icon: ShieldCheck }],
  TEACHER: [{ to: '/teacher', label: 'Dashboard', icon: LayoutDashboard }],
}

const adminSidebarSections = [
  {
    label: 'School setup',
    items: [
      { view: 'classes', label: 'Class management', icon: Layers3 },
      { view: 'subjects', label: 'Subject management', icon: BookOpen },
      { view: 'students', label: 'Student register', icon: GraduationCap },
    ],
  },
  {
    label: 'Staff operations',
    items: [
      { view: 'teachers', label: 'Teacher management', icon: Users },
      { view: 'assignments', label: 'Assignments', icon: ShieldCheck },
    ],
  },
  {
    label: 'Assessment system',
    items: [
      { view: 'exams', label: 'Exam management', icon: CalendarDays },
      { view: 'grading', label: 'Grading rules', icon: Save },
      { view: 'publish', label: 'Report cards', icon: Send },
    ],
  },
]

const teacherSidebarSections = [
  {
    label: 'My Workspace',
    items: [
      { view: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { view: 'students', label: 'My Students', icon: GraduationCap },
      { view: 'marks', label: 'Enter Marks', icon: BookOpenCheck },
      { view: 'assignments', label: 'My Assignments', icon: ClipboardList },
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
    label: 'Platform Administration',
    items: [
      { view: 'schools', label: 'School Directory', icon: LayoutDashboard },
    ],
  },
]

const roleTone = {
  SUPER_ADMIN: 'System access',
  ADMIN: 'Principal access',
  TEACHER: 'Teacher access',
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const nav = navByRole[user?.role] ?? []
  const activeView = new URLSearchParams(location.search).get('view') ?? 'dashboard'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const sidebarSections = 
    user?.role === 'SUPER_ADMIN' ? superAdminSidebarSections :
    user?.role === 'ADMIN' ? adminSidebarSections : teacherSidebarSections

  async function onLogout() {
    await logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden" onClick={() => setDrawerOpen(false)}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
            {user?.school?.logoUrl ? (
              <img src={user.school.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className="size-5" />
            )}
          </span>
          <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
            <span className="font-semibold truncate">{user?.school?.name ?? 'GradeX'}</span>
            <span className="text-[11px] text-muted-foreground line-clamp-1">
              {user?.role === 'SUPER_ADMIN' ? 'Platform management' : 'School automation'}
            </span>
          </div>
        </Link>
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin?view=settings"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="School Profile"
          >
            <Settings className="size-4" />
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pt-3 pb-4">
        <div className="space-y-3 pt-1">
          {sidebarSections.map((section) => (
            <div key={section.label} className="rounded-xl bg-sidebar-accent/20 p-2">
              <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeView === item.view

                  return (
                    <Link
                      key={item.view}
                      to={`/${user?.role === 'ADMIN' ? 'admin' : 'teacher'}?view=${item.view}`}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        'text-sidebar-foreground/72 hover:-translate-y-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm',
                      )}
                    >
                      <item.icon className="size-4" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

    </>
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-sidebar text-sidebar-foreground shadow-sm md:flex md:flex-col z-30">
        <SidebarContent />
      </aside>

      <div className="flex-1 md:pl-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-7">
          <div className="flex items-center gap-3">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <PanelLeft />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground flex flex-col">
                <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-sm font-semibold md:text-base">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{roleTone[user?.role]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Badge variant="secondary" className="hidden sm:inline-flex">Live school workspace</Badge>
            <Button variant="outline" size="sm" onClick={onLogout} className="hidden sm:flex">
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout} className="sm:hidden text-muted-foreground">
              <LogOut className="size-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-screen-2xl p-4 md:p-7 pb-24 md:pb-7">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Teacher only for now to not disrupt admin) */}
      {user?.role === 'TEACHER' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-40 pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { view: 'dashboard', icon: LayoutDashboard, label: 'Home' },
              { view: 'students', icon: GraduationCap, label: 'Students' },
              { view: 'marks', icon: BookOpenCheck, label: 'Marks' },
              { view: 'profile', icon: UserCircle, label: 'Profile' },
            ].map((item) => {
              const isActive = activeView === item.view
              return (
                <Link
                  key={item.view}
                  to={`/teacher?view=${item.view}`}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn("size-5 mb-1", isActive && "fill-primary/20")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
