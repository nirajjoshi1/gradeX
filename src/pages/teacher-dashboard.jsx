import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, BookOpen, BookOpenCheck, CheckCircle2, GraduationCap, KeyRound, Lock, Save, Sheet, ShieldCheck, Unlock, Loader2, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

function MetricTile({ label, value, icon: Icon, loading = false }) {
  return (
    <Card className="rounded-lg border-0 bg-card/95 shadow-none transition hover:-translate-y-0.5 hover:bg-muted/20">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">
          {loading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

function LoadingButton({ loading, children, disabled, ...props }) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : children}
      {loading ? 'Working...' : null}
    </Button>
  )
}

export function TeacherDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeView = ['dashboard', 'students', 'marks', 'assignments', 'profile'].includes(searchParams.get('view')) ? searchParams.get('view') : 'dashboard'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ students: 0, subjects: 0, classes: 0, pendingMarks: 0, lockedMarks: 0 })

  useEffect(() => {
    if (!['dashboard', 'students', 'marks', 'assignments', 'profile'].includes(searchParams.get('view'))) {
      setSearchParams({ view: 'dashboard' }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api('/teacher/stats')
        setStats(data)
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
             <MetricTile label="Assigned Classes" value={stats.classes} icon={BookOpen} loading={loading} />
             <MetricTile label="Pending Marks" value={stats.pendingMarks} icon={Sheet} loading={loading} />
             <MetricTile label="Locked Marks" value={stats.lockedMarks} icon={Lock} loading={loading} />
          </div>
        </TabsContent>

        {/* Placeholders for other tabs */}
        <TabsContent value="students" className="mt-0">
           <StudentsView />
        </TabsContent>
        <TabsContent value="marks" className="mt-0">
           <MarksView />
        </TabsContent>
        <TabsContent value="assignments" className="mt-0">
           <AssignmentsView />
        </TabsContent>
        <TabsContent value="profile" className="mt-0">
           <ProfileView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyRows({ label, loading }) {
  return (
    <TableRow>
      <TableCell className="py-10 text-center text-muted-foreground" colSpan={8}>
        {loading ? <Loader2 className="mx-auto size-5 animate-spin" /> : label}
      </TableCell>
    </TableRow>
  )
}

function StudentsView() {
  const [students, setStudents] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadStudents() {
      setLoading(true)
      try {
        const data = await api(`/teacher/students?search=${encodeURIComponent(search)}`)
        setStudents(data)
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    const timeoutId = setTimeout(loadStudents, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My Students</CardTitle>
            <CardDescription>All students in classes assigned to you.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, roll, admission no..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/70">
              <TableRow>
                <TableHead className="w-20">Roll</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Admission No</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!students.items.length && <EmptyRows loading={loading} label={search ? "No students matched your search." : "No students found in your assigned classes."} />}
              {students.items.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs">{student.rollNo}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    {student.class.name}
                    {student.section ? ` / ${student.section.name}` : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.admissionNo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
function MarksView() {
  const [examSubjects, setExamSubjects] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [sheetData, setSheetData] = useState(null)
  const [entries, setEntries] = useState({})
  const [saving, setSaving] = useState(false)

  const selected = useMemo(
    () => examSubjects.find((item) => item.id === selectedId),
    [examSubjects, selectedId],
  )

  const rows = sheetData?.rows ?? []
  const enteredCount = Object.values(entries).filter(
    (entry) => entry.isAbsent || entry.theoryMarks !== '' || entry.practicalMarks !== '',
  ).length

  async function loadOptions() {
    const items = await api('/teacher/exams')
    setExamSubjects(items)
    if (items[0]) setSelectedId(items[0].id)
  }

  const loadSheet = useCallback(async (item) => {
    if (!item) return
    const data = await api(
      `/teacher/marks?examId=${item.examId}&classId=${item.classId}&subjectId=${item.subjectId}${item.sectionId ? `&sectionId=${item.sectionId}` : ''}&pageSize=120`,
    )
    setSheetData(data)
    setEntries(
      Object.fromEntries(
        data.rows.map(({ student, mark }) => [
          student.id,
          {
            studentId: student.id,
            theoryMarks: mark?.theoryMarks ?? '',
            practicalMarks: mark?.practicalMarks ?? '',
            isAbsent: mark?.isAbsent ?? false,
            remarks: mark?.remarks ?? '',
          },
        ]),
      ),
    )
  }, [])

  useEffect(() => {
    loadOptions().catch((error) => toast.error(error.message))
  }, [])

  useEffect(() => {
    if (selected) loadSheet(selected).catch((error) => toast.error(error.message))
  }, [loadSheet, selected])

  const theoryFull = Number(sheetData?.subject?.theoryFullMarks ?? 0)
  const practicalFull = Number(sheetData?.subject?.practicalFullMarks ?? 0)

  function patchEntry(studentId, patch) {
    setEntries((current) => ({
      ...current,
      [studentId]: { ...current[studentId], ...patch },
    }))
  }

  function clampMarkValue(value, max) {
    if (value === '') return ''

    const numeric = Number(value)
    if (Number.isNaN(numeric)) return ''
    if (numeric < 0) return '0'
    if (numeric > max) return String(max)

    return value
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const inputs = [...document.querySelectorAll('[data-mark-input="true"]')]
    const index = inputs.indexOf(event.currentTarget)
    inputs[index + 1]?.focus()
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      await api('/teacher/marks/bulk', {
        method: 'PUT',
        body: JSON.stringify({
          examId: selected.examId,
          classId: selected.classId,
          subjectId: selected.subjectId,
          sectionId: selected.sectionId ?? null,
          entries: Object.values(entries).map((entry) => ({
            ...entry,
            theoryMarks: entry.theoryMarks === '' ? null : Number(entry.theoryMarks),
            practicalMarks: entry.practicalMarks === '' ? null : Number(entry.practicalMarks),
          })),
        }),
      })
      toast.success('Marks saved')
      await loadSheet(selected)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Assigned sheet</CardTitle>
            <CardDescription>
              Choose an exam sheet, then use Enter to move down the marks columns.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full sm:w-[28rem]">
                <SelectValue placeholder="Select exam, class, and subject" />
              </SelectTrigger>
              <SelectContent>
                {examSubjects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.exam.name} / {item.class.name}{item.section ? ` / Section ${item.section.name}` : ''} / {item.subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!sheetData || sheetData.locked || saving} onClick={save}>
              <Save />
              {saving ? 'Saving...' : 'Save marks'}
            </Button>
          </div>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground mt-2">
            <span>Students: {rows.length}</span>
            <span>&bull;</span>
            <span>Entered: {enteredCount}</span>
            <span>&bull;</span>
            <span>Pending: {Math.max(rows.length - enteredCount, 0)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {sheetData?.locked && (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 text-destructive" />
            <span>This mark sheet is locked because the exam was finalized for report-card generation.</span>
          </div>
        )}

        {!examSubjects.length && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Sheet className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">No assigned mark sheets yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask an admin to assign a class, subject, and exam to your account.
            </p>
          </div>
        )}

        {!!rows.length && (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/70">
                <TableRow>
                  <TableHead className="w-20">Roll</TableHead>
                  <TableHead className="min-w-52">Student</TableHead>
                  <TableHead className="w-36">
                    Theory / {Number(sheetData?.subject?.theoryFullMarks ?? 0)}
                  </TableHead>
                  <TableHead className="w-36">
                    Practical / {Number(sheetData?.subject?.practicalFullMarks ?? 0)}
                  </TableHead>
                  <TableHead className="w-24 text-center">Absent</TableHead>
                  <TableHead className="min-w-56">Remarks</TableHead>
                  <TableHead className="w-24">State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ student }, index) => {
                  const entry = entries[student.id] ?? {}
                  const isComplete =
                    entry.isAbsent || entry.theoryMarks !== '' || entry.practicalMarks !== ''

                  return (
                    <TableRow key={student.id} className={cn(index % 2 === 1 && 'bg-muted/20')}>
                      <TableCell className="font-mono text-xs">{student.rollNo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.section ? `Section ${student.section.name}` : 'No section'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          data-mark-input="true"
                          disabled={sheetData.locked || entry.isAbsent}
                          className="h-9 w-28 text-right font-mono"
                          value={entry.theoryMarks ?? ''}
                          min={0}
                          max={theoryFull}
                          onChange={(event) =>
                            patchEntry(student.id, {
                              theoryMarks: clampMarkValue(event.target.value, theoryFull),
                            })
                          }
                          onKeyDown={handleKeyDown}
                          type="number"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          data-mark-input="true"
                          disabled={sheetData.locked || entry.isAbsent}
                          className="h-9 w-28 text-right font-mono"
                          value={entry.practicalMarks ?? ''}
                          min={0}
                          max={practicalFull}
                          onChange={(event) =>
                            patchEntry(student.id, {
                              practicalMarks: clampMarkValue(event.target.value, practicalFull),
                            })
                          }
                          onKeyDown={handleKeyDown}
                          type="number"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={entry.isAbsent}
                          disabled={sheetData.locked}
                          onCheckedChange={(checked) =>
                            patchEntry(student.id, { isAbsent: Boolean(checked) })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          disabled={sheetData.locked}
                          value={entry.remarks ?? ''}
                          onChange={(event) => patchEntry(student.id, { remarks: event.target.value })}
                          placeholder="Optional"
                        />
                      </TableCell>
                      <TableCell>
                        {isComplete ? (
                          <Badge variant="secondary"><CheckCircle2 /> Ready</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssignmentsView() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAssignments() {
      try {
        const data = await api('/teacher/assignments')
        setAssignments(data)
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    loadAssignments()
  }, [])

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>My Assignments</CardTitle>
        <CardDescription>Classes and subjects assigned to you.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/70">
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Credit Hrs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!assignments.length && <EmptyRows loading={loading} label="No assignments found." />}
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.class.name}</TableCell>
                  <TableCell>{assignment.section ? assignment.section.name : 'All'}</TableCell>
                  <TableCell>
                    {assignment.subject.name}
                    <div className="text-xs text-muted-foreground">{assignment.subject.code}</div>
                  </TableCell>
                  <TableCell>{Number(assignment.subject.creditHours)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileView() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordSaving, setPasswordSaving] = useState(false)

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password confirmation does not match')
      return
    }

    setPasswordSaving(true)
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      toast.success('Password changed')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <Card className="rounded-lg shadow-sm max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your login password</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current password</label>
          <Input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New password</label>
          <Input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confirm new password</label>
          <Input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} />
        </div>
        <div className="pt-2">
           <Button disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword} onClick={changePassword}>
              <KeyRound className="mr-2 size-4" />
              {passwordSaving ? 'Saving...' : 'Update password'}
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}
