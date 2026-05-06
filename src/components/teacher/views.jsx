import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Plus, Save, Search, Trash2, KeyRound, Sheet, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { DataOverlay, EmptyRows, LoadingButton } from './shared'

export function StudentsView() {
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
        <div className="overflow-hidden rounded-lg border relative">
          <DataOverlay loading={loading} />
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
              {!students.items.length && !loading && <EmptyRows label={search ? "No students matched your search." : "No students found in your assigned classes."} />}
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

export function MarksView() {
  const [examSubjects, setExamSubjects] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [sheetData, setSheetData] = useState(null)
  const [entries, setEntries] = useState({})
  const [saving, setSaving] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingSheet, setLoadingSheet] = useState(false)

  const selected = useMemo(
    () => examSubjects.find((item) => item.id === selectedId),
    [examSubjects, selectedId],
  )

  const rows = sheetData?.rows ?? []
  const enteredCount = Object.values(entries).filter(
    (entry) => entry.isAbsent || entry.theoryMarks !== '' || entry.practicalMarks !== '',
  ).length

  async function loadOptions() {
    setLoadingOptions(true)
    try {
      const items = await api('/teacher/exams')
      setExamSubjects(items)
      if (items[0]) setSelectedId(items[0].id)
    } finally {
      setLoadingOptions(false)
    }
  }

  const loadSheet = useCallback(async (item) => {
    if (!item) return
    setLoadingSheet(true)
    try {
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
    } finally {
      setLoadingSheet(false)
    }
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
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Assigned sheet</CardTitle>
            <CardDescription>Choose an exam sheet, then use Enter to move down the marks columns.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 w-full lg:flex-row lg:w-auto">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full lg:w-[28rem]">
                <SelectValue placeholder="Select exam, class, and subject" />
              </SelectTrigger>
              <SelectContent>
                {examSubjects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.exam.name} / {item.class.name}{item.section ? ` / ${item.section.name}` : ''} / {item.subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full lg:w-auto" disabled={!sheetData || sheetData.locked || saving} onClick={save}>
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

        {loadingOptions && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loadingOptions && !examSubjects.length && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Sheet className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">No assigned mark sheets yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Ask an admin to assign a class, subject, and exam to your account.</p>
          </div>
        )}

        {!!examSubjects.length && (
          <div className="relative border rounded-lg overflow-hidden min-h-[300px]">
            <DataOverlay loading={loadingSheet} />
            {!!rows.length && (
              <Table className="border-collapse">
                <TableHeader className="bg-muted/70 sticky top-0 z-20">
                  <TableRow className="h-8 md:h-10">
                    <TableHead className="w-8 px-1 text-center md:w-20 md:px-4">#</TableHead>
                    <TableHead className="px-2 md:px-4">Student</TableHead>
                    <TableHead className="w-16 px-1 text-center md:w-36 md:px-4 min-w-[60px]">TH</TableHead>
                    <TableHead className="w-16 px-1 text-center md:w-36 md:px-4 min-w-[60px]">PR</TableHead>
                    <TableHead className="w-10 px-1 text-center md:w-24 md:px-4">AB</TableHead>
                    <TableHead className="hidden md:table-cell w-24 px-4 text-center">State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ student }, index) => {
                    const entry = entries[student.id] ?? {}
                    const isComplete = entry.isAbsent || entry.theoryMarks !== '' || entry.practicalMarks !== ''

                    return (
                      <TableRow key={student.id} className={cn("h-10 md:h-12 border-b", index % 2 === 1 && 'bg-muted/5')}>
                        <TableCell className="px-1 text-center font-bold text-[10px] md:text-xs text-muted-foreground">{student.rollNo}</TableCell>
                        <TableCell className="px-2 py-1 overflow-hidden">
                          <div className="font-bold text-[11px] md:text-sm truncate">{student.name}</div>
                          <div className="text-[9px] text-muted-foreground truncate font-medium">
                            {student.class.name.replace(/grade\s+/gi, '')}/{student.section ? student.section.name : 'All'}
                          </div>
                        </TableCell>
                        <TableCell className="px-1 text-center md:px-4 min-w-[60px]">
                          <div className="flex justify-center">
                            <Input
                              data-mark-input="true"
                              disabled={sheetData.locked || entry.isAbsent}
                              className="h-7 md:h-9 w-full max-w-[50px] md:max-w-[90px] text-center font-mono text-[11px] px-1"
                              value={entry.theoryMarks ?? ''}
                              onChange={(event) => patchEntry(student.id, { theoryMarks: clampMarkValue(event.target.value, theoryFull) })}
                              onKeyDown={handleKeyDown}
                              type="number"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-1 text-center md:px-4 min-w-[60px]">
                          <div className="flex justify-center">
                            <Input
                              data-mark-input="true"
                              disabled={sheetData.locked || entry.isAbsent}
                              className="h-7 md:h-9 w-full max-w-[50px] md:max-w-[90px] text-center font-mono text-[11px] px-1"
                              value={entry.practicalMarks ?? ''}
                              onChange={(event) => patchEntry(student.id, { practicalMarks: clampMarkValue(event.target.value, practicalFull) })}
                              onKeyDown={handleKeyDown}
                              type="number"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-1 text-center md:px-4">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={entry.isAbsent}
                              disabled={sheetData.locked}
                              onCheckedChange={(checked) => patchEntry(student.id, { isAbsent: Boolean(checked) })}
                              className="size-3 md:size-4"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          {isComplete ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">Ready</Badge>
                          ) : (
                            <Badge variant="outline" className="border-dashed">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            {!rows.length && !loadingSheet && (
              <div className="p-20 text-center text-muted-foreground italic">No students found for this assignment.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AssignmentsView() {
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
        <div className="overflow-hidden rounded-lg border relative">
          <DataOverlay loading={loading} />
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
              {!assignments.length && <EmptyRows label="No assignments found." />}
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

export function ClassManagementView({ sections }) {
  const [selectedSection, setSelectedSection] = useState(sections[0]?.id || '')
  const [assignments, setAssignments] = useState([])
  const [resources, setResources] = useState({ teachers: [], subjects: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ teacherId: '', subjectId: '' })

  const loadData = useCallback(async () => {
    if (!selectedSection) return
    setLoading(true)
    try {
      const [assignmentsData, resourcesData] = await Promise.all([
        api(`/teacher/managed-sections/${selectedSection}/assignments`),
        api('/teacher/resources')
      ])
      setAssignments(assignmentsData)
      setResources(resourcesData)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedSection])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleAdd() {
    if (!newAssignment.teacherId || !newAssignment.subjectId) return toast.error('Please select both teacher and subject')
    setSaving(true)
    try {
      await api(`/teacher/managed-sections/${selectedSection}/assignments`, {
        method: 'POST',
        body: JSON.stringify(newAssignment)
      })
      toast.success('Sub-teacher assigned successfully')
      setNewAssignment({ teacherId: '', subjectId: '' })
      loadData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api(`/teacher/managed-sections/${selectedSection}/assignments/${id}`, { method: 'DELETE' })
      toast.success('Assignment removed')
      loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Class Management Oversight</CardTitle>
              <CardDescription>Assign sub-teachers and oversee your section.</CardDescription>
            </div>
            <div className="w-48">
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="bg-muted/50 border-0"><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.class.name} / {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Active Sub-Teachers</h3>
              <div className="rounded-md border bg-muted/30 relative">
                <DataOverlay loading={loading} />
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Assigned Teacher</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {assignments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.subject.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{a.teacher.name.charAt(0)}</div>
                            {a.teacher.name}
                          </div>
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="size-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {!assignments.length && <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No sub-teachers assigned.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Plus className="size-4" /> Quick Assign</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Select Subject</label>
                  <Select value={newAssignment.subjectId} onValueChange={id => setNewAssignment(p => ({ ...p, subjectId: id }))}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Choose subject..." /></SelectTrigger>
                    <SelectContent>{resources.subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Select Teacher</label>
                  <Select value={newAssignment.teacherId} onValueChange={id => setNewAssignment(p => ({ ...p, teacherId: id }))}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Choose teacher..." /></SelectTrigger>
                    <SelectContent>{resources.teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <LoadingButton loading={saving} onClick={handleAdd} className="w-full mt-2">Assign to Section</LoadingButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ProfileView() {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New password confirmation does not match')
    setPasswordSaving(true)
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
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
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><KeyRound className="size-5 text-primary" /></div>
          <div><CardTitle>Change Password</CardTitle><CardDescription>Update your login password</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-4">
        <div className="space-y-1.5"><label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current password</label><Input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></div>
        <div className="space-y-1.5"><label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New password</label><Input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></div>
        <div className="space-y-1.5"><label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confirm new password</label><Input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></div>
        <div className="pt-2"><Button disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword} onClick={changePassword}><KeyRound className="mr-2 size-4" />{passwordSaving ? 'Saving...' : 'Update password'}</Button></div>
      </CardContent>
    </Card>
  )
}
