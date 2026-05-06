import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, GraduationCap, Users, CalendarDays } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { api } from '@/lib/api'

// Modularized Components
import { MetricTile } from '@/components/teacher/shared'
import { 
  StudentsView, 
  MarksView, 
  AssignmentsView, 
  ClassManagementView, 
  ProfileView 
} from '@/components/teacher/views'

export function TeacherDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ students: 0, subjects: 0, classes: 0, pendingMarks: 0, lockedMarks: 0 })
  const [managedSections, setManagedSections] = useState([])

  const validViews = ['dashboard', 'students', 'marks', 'assignments', 'profile', 'class-management']
  const activeView = validViews.includes(searchParams.get('view')) ? searchParams.get('view') : 'dashboard'

  useEffect(() => {
    if (!validViews.includes(searchParams.get('view'))) {
      setSearchParams({ view: 'dashboard' }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsData, managedData] = await Promise.all([
          api('/teacher/stats'),
          api('/teacher/managed-sections')
        ])
        setStats(statsData)
        setManagedSections(managedData)
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <Tabs value={activeView} className="space-y-3">
        <TabsContent value="dashboard" className="mt-0 space-y-3">
          <section className="rounded-lg bg-card px-5 py-4 md:px-6 shadow-sm border">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">Teacher console</Badge>
                  <Badge variant="outline">{loading ? 'Syncing...' : 'Live'}</Badge>
                </div>
                <h1 className="text-2xl font-semibold md:text-3xl">Teacher Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Overview of your assigned classes, students, and marking progress.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Total Students" value={stats.students} icon={GraduationCap} loading={loading} />
            <MetricTile label="My Subjects" value={stats.subjects} icon={BookOpen} loading={loading} />
            <MetricTile label="Pending Marks" value={stats.pendingMarks} icon={CalendarDays} loading={loading} />
            <MetricTile label="Assigned Classes" value={stats.classes} icon={Users} loading={loading} />
          </div>
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <StudentsView />
        </TabsContent>

        <TabsContent value="marks" className="mt-0">
          <MarksView />
        </TabsContent>

        <TabsContent value="assignments" className="mt-0">
          <AssignmentsView />
        </TabsContent>

        <TabsContent value="class-management" className="mt-0">
          <ClassManagementView sections={managedSections} />
        </TabsContent>

        <TabsContent value="profile" className="mt-0">
          <ProfileView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
