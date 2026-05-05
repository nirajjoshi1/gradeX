import { useEffect, useMemo, useState } from 'react'
import { ADToBS, BSToAD } from 'bikram-sambat-js'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { api, apiBase } from '@/lib/api'

const defaultRules = [
  { label: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4 },
  { label: 'A', minPercentage: 80, maxPercentage: 89.99, gpa: 3.6 },
  { label: 'B+', minPercentage: 70, maxPercentage: 79.99, gpa: 3.2 },
  { label: 'B', minPercentage: 60, maxPercentage: 69.99, gpa: 2.8 },
  { label: 'C+', minPercentage: 50, maxPercentage: 59.99, gpa: 2.4 },
  { label: 'C', minPercentage: 40, maxPercentage: 49.99, gpa: 2 },
  { label: 'NG', minPercentage: 0, maxPercentage: 39.99, gpa: 0 },
]

const adminViews = new Set(['dashboard', 'classes', 'subjects', 'exams', 'teachers', 'students', 'assignments', 'grading', 'publish'])

const initialForms = {
  className: 'Grade 10',
  sections: 'A,B',
  subjectName: 'Mathematics',
  subjectCode: 'MATH10',
  creditHours: 4,
  theoryFullMarks: 75,
  practicalFullMarks: 25,
  teacherName: 'New Teacher',
  teacherUsername: 'new.teacher',
  teacherPassword: 'password123',
  studentName: 'New Student',
  admissionNo: 'GDX-002',
  rollNo: '2',
  guardianName: 'Guardian',
  dobAd: '',
  dobBs: '',
  examName: 'Final Term',
}

const initialEditForms = {
  className: '',
  sections: '', // Not used during edit
  subjectName: '',
  subjectCode: '',
  creditHours: 0,
  theoryFullMarks: 0,
  practicalFullMarks: 0,
  teacherName: '',
  teacherUsername: '',
  teacherPassword: '',
  teacherIsActive: true,
  studentName: '',
  admissionNo: '',
  rollNo: '',
  guardianName: '',
  dobAd: '',
  dobBs: '',
  examName: '',
}

function syncDobFromAd(setForms, forms, dobAd) {
  try {
    setForms({ ...forms, dobAd, dobBs: dobAd ? ADToBS(dobAd) : '' })
    return
  } catch {
    setForms({ ...forms, dobAd })
  }
}

function syncDobFromBs(setForms, forms, dobBs) {
  try {
    setForms({ ...forms, dobBs, dobAd: dobBs ? BSToAD(dobBs) : '' })
    return
  } catch {
    setForms({ ...forms, dobBs })
  }
}

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({
    overview: {},
    classes: [],
    subjects: [],
    teachers: [],
    students: { items: [] },
    assignments: [],
    exams: [],
    gradeRules: [],
  })
  const [forms, setForms] = useState(initialForms)
  const [selected, setSelected] = useState({})
  const [ruleDraft, setRuleDraft] = useState(defaultRules)
  const [loading, setLoading] = useState({ page: true })
  const [openDialog, setOpenDialog] = useState(null)
  const [editId, setEditId] = useState(null)
  const activeView = adminViews.has(searchParams.get('view')) ? searchParams.get('view') : 'dashboard'

  useEffect(() => {
    if (!adminViews.has(searchParams.get('view'))) {
      setSearchParams({ view: 'dashboard' }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function load() {
    setLoading((current) => ({ ...current, page: true }))
    try {
      const [overview, classes, subjects, teachers, students, assignments, exams, gradeRules] =
        await Promise.all([
          api('/admin/overview'),
          api('/admin/classes'),
          api('/admin/subjects'),
          api('/admin/teachers'),
          api('/admin/students?pageSize=20'),
          api('/admin/assignments'),
          api('/admin/exams'),
          api('/admin/grade-rules'),
        ])

      setData({ overview, classes, subjects, teachers, students, assignments, exams, gradeRules })
      setRuleDraft(gradeRules.length ? gradeRules : defaultRules)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading((current) => ({ ...current, page: false }))
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sectionsForClass = useMemo(
    () => data.classes.find((item) => item.id === selected.studentClassId)?.sections ?? [],
    [data.classes, selected.studentClassId],
  )

  const sectionsForAssignmentClass = useMemo(
    () => data.classes.find((item) => item.id === selected.classId)?.sections ?? [],
    [data.classes, selected.classId],
  )

  const stats = useMemo(
    () => [
      { label: 'Students', value: data.overview.students ?? 0, icon: GraduationCap },
      { label: 'Teachers', value: data.overview.teachers ?? 0, icon: Users },
      { label: 'Classes', value: data.overview.classes ?? 0, icon: Layers3 },
      { label: 'Subjects', value: data.overview.subjects ?? 0, icon: BookOpen },
      { label: 'Exams', value: data.overview.exams ?? 0, icon: CalendarDays },
    ],
    [data.overview],
  )

  async function runAction(key, label, action, close = true) {
    setLoading((current) => ({ ...current, [key]: true }))
    try {
      await action()
      toast.success(label)
      if (close) setOpenDialog(null)
      await load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading((current) => ({ ...current, [key]: false }))
    }
  }

  async function executeDelete(url, label) {
    setLoading((current) => ({ ...current, page: true }))
    try {
      await api(url, { method: 'DELETE' })
      toast.success(`${label} deleted`)
      await load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading((current) => ({ ...current, page: false }))
    }
  }

  function openCreate(type) {
    setForms(initialForms)
    setEditId(null)
    setOpenDialog(type)
  }

  function openEdit(type, id, formState) {
    setForms({ ...initialEditForms, ...formState })
    setEditId(id)
    setOpenDialog(type)
  }

  async function saveClass() {
    const url = editId ? `/admin/classes/${editId}` : '/admin/classes'
    const method = editId ? 'PUT' : 'POST'
    const body = {
      name: forms.className,
      sortOrder: Number(forms.className.match(/\d+/)?.[0] ?? 0),
      ...(editId ? {} : { sections: forms.sections.split(',').map((section) => section.trim()).filter(Boolean) }),
    }

    await runAction('class', editId ? 'Class updated' : 'Class created', () =>
      api(url, { method, body: JSON.stringify(body) }),
    )
  }

  async function saveSubject() {
    const url = editId ? `/admin/subjects/${editId}` : '/admin/subjects'
    const method = editId ? 'PUT' : 'POST'
    const body = {
      code: forms.subjectCode,
      name: forms.subjectName,
      creditHours: Number(forms.creditHours),
      theoryFullMarks: Number(forms.theoryFullMarks),
      practicalFullMarks: Number(forms.practicalFullMarks),
      passPercentage: 40,
    }

    await runAction('subject', editId ? 'Subject updated' : 'Subject created', () =>
      api(url, { method, body: JSON.stringify(body) }),
    )
  }

  async function saveTeacher() {
    const url = editId ? `/admin/teachers/${editId}` : '/admin/teachers'
    const method = editId ? 'PUT' : 'POST'
    const body = {
      name: forms.teacherName,
      username: forms.teacherUsername,
      password: forms.teacherPassword || undefined,
      isActive: forms.teacherIsActive,
    }

    await runAction('teacher', editId ? 'Teacher updated' : 'Teacher created', () =>
      api(url, { method, body: JSON.stringify(body) }),
    )
  }

  async function saveStudent() {
    const url = editId ? `/admin/students/${editId}` : '/admin/students'
    const method = editId ? 'PUT' : 'POST'
    const body = {
      name: forms.studentName,
      admissionNo: forms.admissionNo,
      rollNo: forms.rollNo,
      guardianName: forms.guardianName,
      dobAd: forms.dobAd,
      dobBs: forms.dobBs,
      classId: selected.studentClassId,
      sectionId: selected.studentSectionId,
    }

    await runAction('student', editId ? 'Student updated' : 'Student enrolled', () =>
      api(url, { method, body: JSON.stringify(body) }),
    )
  }

  async function saveExam() {
    const url = editId ? `/admin/exams/${editId}` : '/admin/exams'
    const method = editId ? 'PUT' : 'POST'
    const body = { name: forms.examName }

    await runAction('exam', editId ? 'Exam updated' : 'Exam created', () =>
      api(url, { method, body: JSON.stringify(body) }),
    )
  }

  async function assignTeacher() {
    await runAction('assignment', 'Teacher assigned', () =>
      api('/admin/assignments', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: selected.teacherId,
          classId: selected.classId,
          sectionId: selected.assignmentSectionId || null,
          subjectId: selected.subjectId,
        }),
      }),
    )
  }

  async function attachSubject() {
    await runAction('attachSubject', 'Subject attached to exam', () =>
      api(`/admin/exams/${selected.examId}/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          classId: selected.classId,
          subjectId: selected.subjectId,
        }),
      }),
    )
  }

  async function saveRules() {
    await runAction(
      'grading',
      'Grading system saved',
      () =>
        api('/admin/grade-rules', {
          method: 'PUT',
          body: JSON.stringify({
            rules: ruleDraft.map((rule) => ({
              label: rule.label,
              minPercentage: Number(rule.minPercentage),
              maxPercentage: Number(rule.maxPercentage),
              gpa: Number(rule.gpa),
              remarks: rule.remarks ?? '',
            })),
          }),
        }),
      false,
    )
  }

  async function finalizeExamReports(examId) {
    await runAction('publish', 'Report cards generated and exam locked', () =>
      api(`/admin/exams/${examId}/report-cards`, { method: 'POST' }),
    )
  }

  function updateRule(index, key, value) {
    setRuleDraft((current) =>
      current.map((rule, itemIndex) =>
        itemIndex === index ? { ...rule, [key]: value } : rule,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeView} className="space-y-3">
        <TabsContent value="dashboard" className="mt-0 space-y-3">
          <section className="rounded-lg bg-card px-5 py-4 md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">Principal console</Badge>
                  <Badge variant="outline">{loading.page ? 'Syncing...' : 'Live'}</Badge>
                </div>
                <h1 className="text-2xl font-semibold md:text-3xl">School result operations</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  School overview, progress tracking, and quick counts live here only.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[26rem]">
                {stats.slice(0, 3).map((stat) => (
                  <MetricTile key={stat.label} {...stat} loading={loading.page} compact />
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <MetricTile key={stat.label} {...stat} loading={loading.page} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="classes" className="mt-0">
          <WorkflowPanel
            action={<CreateClassDialog editId={editId} forms={forms} setForms={setForms} loading={loading.class} open={openDialog === 'class'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('class')} onSubmit={saveClass} />}
            description="Create grade levels and their sections."
            title="Class management"
          >
            <ClassTable classes={data.classes} loading={loading.page} onEdit={(id, item) => openEdit('class', id, { className: item.name })} onDelete={(id) => executeDelete(`/admin/classes/${id}`, 'Class')} />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="subjects" className="mt-0">
          <WorkflowPanel
            action={<CreateSubjectDialog editId={editId} forms={forms} setForms={setForms} loading={loading.subject} open={openDialog === 'subject'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('subject')} onSubmit={saveSubject} />}
            description="Configure full marks, practical marks, and credit hours per subject."
            title="Subject system"
          >
            <SubjectTable subjects={data.subjects} loading={loading.page} onEdit={(id, item) => openEdit('subject', id, { subjectCode: item.code, subjectName: item.name, creditHours: item.creditHours, theoryFullMarks: item.theoryFullMarks, practicalFullMarks: item.practicalFullMarks })} onDelete={(id) => executeDelete(`/admin/subjects/${id}`, 'Subject')} />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="exams" className="mt-0">
          <WorkflowPanel
            action={<CreateExamDialog editId={editId} forms={forms} setForms={setForms} loading={loading.exam} open={openDialog === 'exam'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('exam')} onSubmit={saveExam} />}
            description="Create exam cycles before attaching class-subject rows."
            title="Exam management"
          >
            <ExamTable exams={data.exams} loading={loading.page} onEdit={(id, item) => openEdit('exam', id, { examName: item.name })} onDelete={(id) => executeDelete(`/admin/exams/${id}`, 'Exam')} />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="teachers" className="mt-0">
          <WorkflowPanel
            action={<CreateTeacherDialog editId={editId} forms={forms} setForms={setForms} loading={loading.teacher} open={openDialog === 'teacher'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('teacher')} onSubmit={saveTeacher} />}
            description="Create teacher accounts and manage their access."
            title="Teacher accounts"
          >
            <TeacherTable teachers={data.teachers} loading={loading.page} onEdit={(id, item) => openEdit('teacher', id, { teacherName: item.name, teacherUsername: item.username, teacherIsActive: item.isActive })} onDelete={(id) => executeDelete(`/admin/teachers/${id}`, 'Teacher')} />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <WorkflowPanel
            action={<CreateStudentDialog editId={editId} forms={forms} setForms={setForms} selected={selected} setSelected={setSelected} classes={data.classes} sections={sectionsForClass} loading={loading.student} open={openDialog === 'student'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('student')} onSubmit={saveStudent} />}
            description="Enroll students into class and section records."
            title="Student register"
          >
            <StudentTable students={data.students.items} loading={loading.page} onEdit={(id, item) => { setSelected({ ...selected, studentClassId: item.classId, studentSectionId: item.sectionId }); openEdit('student', id, { studentName: item.name, admissionNo: item.admissionNo, rollNo: item.rollNo, guardianName: item.guardianName ?? '', dobAd: item.dobAd ?? '', dobBs: item.dobBs ?? '' }) }} onDelete={(id) => executeDelete(`/admin/students/${id}`, 'Student')} />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="assignments" className="mt-0">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <WorkflowPanel
            action={<AssignTeacherDialog selected={selected} setSelected={setSelected} teachers={data.teachers} classes={data.classes} sections={sectionsForAssignmentClass} subjects={data.subjects} loading={loading.assignment} open={openDialog === 'assignment'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('assignment')} onSubmit={assignTeacher} />}
            description="Map teacher to class, section, and subject. Backend RBAC uses this table."
            title="Teacher assignments"
            >
              <AssignmentTable assignments={data.assignments} loading={loading.page} onDelete={(id) => executeDelete(`/admin/assignments/${id}`, 'Assignment')} />
            </WorkflowPanel>

            <WorkflowPanel
              action={<AttachSubjectDialog selected={selected} setSelected={setSelected} exams={data.exams} classes={data.classes} subjects={data.subjects} loading={loading.attachSubject} open={openDialog === 'attach'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('attach')} onSubmit={attachSubject} />}
              description="Attach class-subject rows to an exam for marks entry."
              title="Exam subject setup"
            >
              <ExamSubjectSummary exams={data.exams} loading={loading.page} onDelete={(examId, examSubjectId) => executeDelete(`/admin/exams/${examId}/subjects/${examSubjectId}`, 'Attached Subject')} />
            </WorkflowPanel>
          </div>
        </TabsContent>

        <TabsContent value="grading" className="mt-0">
          <WorkflowPanel
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRuleDraft([...ruleDraft, { label: '', minPercentage: 0, maxPercentage: 0, gpa: 0 }])}>
                  <Plus /> Rule
                </Button>
                <LoadingButton loading={loading.grading} onClick={saveRules}>
                  <Save /> Save grading
                </LoadingButton>
              </div>
            }
            description="Every result uses these dynamic percentage boundaries."
            title="Grading rules"
          >
            <GradeRuleEditor rules={ruleDraft} updateRule={updateRule} />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="publish" className="mt-0">
          <WorkflowPanel
            description="Finalize an exam, generate report cards, and print each student PDF from here."
            title="Report card center"
          >
            <ReportCardManager exams={data.exams} loading={loading.page} publishing={loading.publish} onFinalize={finalizeExamReports} />
          </WorkflowPanel>
        </TabsContent>
      </Tabs>
    </div>
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

function MetricTile({ label, value, icon: Icon, compact = false, loading = false }) {
  return (
    <Card className="rounded-lg border-0 bg-card/95 shadow-none transition hover:-translate-y-0.5 hover:bg-muted/20">
      <CardHeader className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <CardTitle className={compact ? 'text-xl' : 'text-2xl'}>
          {loading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

function WorkflowPanel({ title, description, action, children }) {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ActionDialog({ open, setOpen, title, description, trigger, children, footer }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">{children}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

function Selector({ label, items, value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ActionMenu({ onEdit, onDelete, disabled }) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit} disabled={disabled} className="size-8 text-muted-foreground hover:text-foreground">
          <Pencil className="size-4" />
        </Button>
      )}
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled} className="size-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this record and any dependent data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

function CreateClassDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
  return (
    <ActionDialog
      open={open}
      setOpen={setOpen}
      title={editId ? "Edit class" : "Add class"}
      description="Create one class and optional comma-separated sections."
      trigger={<Button><Plus /> Add class</Button>}
      footer={<LoadingButton loading={loading} onClick={onSubmit}><Save /> {editId ? "Save changes" : "Create class"}</LoadingButton>}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
        <Field label="Class name">
          <Input value={forms.className} onChange={(e) => setForms({ ...forms, className: e.target.value })} />
        </Field>
        {!editId && (
          <Field label="Sections">
            <Input value={forms.sections} onChange={(e) => setForms({ ...forms, sections: e.target.value })} />
          </Field>
        )}
      </div>
      {!editId && (
        <Alert>
          <Layers3 />
          <AlertTitle>Example</AlertTitle>
          <AlertDescription>Use `Grade 10` with sections like `A,B,C`.</AlertDescription>
        </Alert>
      )}
    </ActionDialog>
  )
}

function CreateSubjectDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
  return (
    <ActionDialog
      open={open}
      setOpen={setOpen}
      title={editId ? "Edit subject" : "Add subject"}
      description="Define marks split and credit hours. GPA weighting uses credit hours."
      trigger={<Button><Plus /> Add subject</Button>}
      footer={<LoadingButton loading={loading} onClick={onSubmit}><Save /> {editId ? "Save changes" : "Create subject"}</LoadingButton>}
    >
      <div className="grid gap-3 md:grid-cols-[9rem_1fr]">
        <Field label="Code">
          <Input value={forms.subjectCode} onChange={(e) => setForms({ ...forms, subjectCode: e.target.value })} />
        </Field>
        <Field label="Subject name">
          <Input value={forms.subjectName} onChange={(e) => setForms({ ...forms, subjectName: e.target.value })} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Credit hours">
          <Input type="number" value={forms.creditHours} onChange={(e) => setForms({ ...forms, creditHours: e.target.value })} />
        </Field>
        <Field label="Theory marks">
          <Input type="number" value={forms.theoryFullMarks} onChange={(e) => setForms({ ...forms, theoryFullMarks: e.target.value })} />
        </Field>
        <Field label="Practical marks">
          <Input type="number" value={forms.practicalFullMarks} onChange={(e) => setForms({ ...forms, practicalFullMarks: e.target.value })} />
        </Field>
      </div>
    </ActionDialog>
  )
}

function CreateExamDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
  return (
    <ActionDialog
      open={open}
      setOpen={setOpen}
      title={editId ? "Edit exam" : "Create exam"}
      description="Create an exam cycle. Attach class-subject rows after creation."
      trigger={<Button><Plus /> Create exam</Button>}
      footer={<LoadingButton loading={loading} onClick={onSubmit}><Save /> {editId ? "Save changes" : "Create exam"}</LoadingButton>}
    >
      <Field label="Exam name">
        <Input value={forms.examName} onChange={(e) => setForms({ ...forms, examName: e.target.value })} />
      </Field>
    </ActionDialog>
  )
}

function CreateTeacherDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
  return (
    <ActionDialog
      open={open}
      setOpen={setOpen}
      title={editId ? "Edit teacher account" : "Create teacher account"}
      description={editId ? "Update teacher details or reset their password." : "Create the username and temporary password that you will share with the teacher."}
      trigger={<Button><Plus /> Add teacher</Button>}
      footer={<LoadingButton loading={loading} onClick={onSubmit}><Save /> {editId ? "Save changes" : "Create teacher"}</LoadingButton>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Teacher name">
          <Input value={forms.teacherName} onChange={(e) => setForms({ ...forms, teacherName: e.target.value })} />
        </Field>
        <Field label="Username">
          <Input value={forms.teacherUsername} onChange={(e) => setForms({ ...forms, teacherUsername: e.target.value })} />
        </Field>
        <Field label={editId ? "New password (optional)" : "Temporary password"}>
          <Input type="password" placeholder={editId ? "Leave blank to keep current" : ""} value={forms.teacherPassword} onChange={(e) => setForms({ ...forms, teacherPassword: e.target.value })} />
        </Field>
        {editId && (
          <Field label="Status">
            <Select value={forms.teacherIsActive ? 'active' : 'inactive'} onValueChange={(val) => setForms({ ...forms, teacherIsActive: val === 'active' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>
    </ActionDialog>
  )
}

function CreateStudentDialog({ editId, forms, setForms, selected, setSelected, classes, sections, loading, open, setOpen, onSubmit }) {
  return (
    <ActionDialog
      open={open}
      setOpen={setOpen}
      title={editId ? "Edit student" : "Enroll student"}
      description="Add student identity and class placement."
      trigger={<Button><Plus /> Enroll student</Button>}
      footer={<LoadingButton loading={loading} disabled={!selected.studentClassId} onClick={onSubmit}><Save /> {editId ? "Save changes" : "Enroll student"}</LoadingButton>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Student name">
          <Input value={forms.studentName} onChange={(e) => setForms({ ...forms, studentName: e.target.value })} />
        </Field>
        <Field label="Guardian">
          <Input value={forms.guardianName} onChange={(e) => setForms({ ...forms, guardianName: e.target.value })} />
        </Field>
        <Field label="Admission number">
          <Input value={forms.admissionNo} onChange={(e) => setForms({ ...forms, admissionNo: e.target.value })} />
        </Field>
        <Field label="Roll number">
          <Input value={forms.rollNo} onChange={(e) => setForms({ ...forms, rollNo: e.target.value })} />
        </Field>
        <Field label="DOB (AD)">
          <Input type="date" value={forms.dobAd} onChange={(e) => syncDobFromAd(setForms, forms, e.target.value)} />
        </Field>
        <Field label="DOB (BS)">
          <Input value={forms.dobBs} onChange={(e) => syncDobFromBs(setForms, forms, e.target.value)} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label="Class">
          <Selector label="Select class" items={classes} value={selected.studentClassId} onValueChange={(studentClassId) => setSelected({ ...selected, studentClassId, studentSectionId: undefined })} />
        </Field>
        <Field label="Section">
          <Selector label="Select section" items={sections} value={selected.studentSectionId} onValueChange={(studentSectionId) => setSelected({ ...selected, studentSectionId })} />
        </Field>
      </div>
    </ActionDialog>
  )
}

function AssignTeacherDialog({ selected, setSelected, teachers, classes, sections, subjects, loading, open, setOpen, onSubmit }) {
  return (
    <ActionDialog
      open={open}
      setOpen={setOpen}
      title="Assign teacher"
      description="This creates the authorization row checked by marks APIs."
      trigger={<Button><ShieldCheck /> Assign teacher</Button>}
      footer={<LoadingButton loading={loading} disabled={!selected.teacherId || !selected.classId || !selected.subjectId} onClick={onSubmit}><ShieldCheck /> Save assignment</LoadingButton>}
    >
      <div className="grid gap-3">
        <Selector label="Teacher" items={teachers} value={selected.teacherId} onValueChange={(teacherId) => setSelected({ ...selected, teacherId })} />
        <Selector label="Class" items={classes} value={selected.classId} onValueChange={(classId) => setSelected({ ...selected, classId, assignmentSectionId: '' })} />
        <Field label="Section">
          <Select value={selected.assignmentSectionId || '__all__'} onValueChange={(value) => setSelected({ ...selected, assignmentSectionId: value === '__all__' ? '' : value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sections</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Selector label="Subject" items={subjects} value={selected.subjectId} onValueChange={(subjectId) => setSelected({ ...selected, subjectId })} />
      </div>
    </ActionDialog>
  )
}

function AttachSubjectDialog({ selected, setSelected, exams, classes, subjects, loading, open, setOpen, onSubmit }) {
  return (
    <ActionDialog
      open={open}
      setOpen={setOpen}
      title="Attach subject to exam"
      description="Marks entry appears only after a class-subject is attached to an exam."
      trigger={<Button><Send /> Attach subject</Button>}
      footer={<LoadingButton loading={loading} disabled={!selected.examId || !selected.classId || !selected.subjectId} onClick={onSubmit}><Send /> Attach</LoadingButton>}
    >
      <div className="grid gap-3">
        <Selector label="Exam" items={exams} value={selected.examId} onValueChange={(examId) => setSelected({ ...selected, examId })} />
        <Selector label="Class" items={classes} value={selected.classId} onValueChange={(classId) => setSelected({ ...selected, classId })} />
        <Selector label="Subject" items={subjects} value={selected.subjectId} onValueChange={(subjectId) => setSelected({ ...selected, subjectId })} />
      </div>
    </ActionDialog>
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

function DataOverlay({ loading, hasData }) {
  if (!loading || !hasData) return null
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-[2px] transition-all duration-200">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}

function ClassTable({ classes, loading, onEdit, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} hasData={classes.length > 0} />
      <Table>
        <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Sections</TableHead><TableHead>Order</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!classes.length && <EmptyRows loading={loading} label="No classes yet." />}
          {classes.map((item) => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.sections.map((section) => section.name).join(', ') || '-'}</TableCell><TableCell>{item.sortOrder}</TableCell><TableCell><ActionMenu onEdit={() => onEdit(item.id, item)} onDelete={() => onDelete(item.id)} /></TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function SubjectTable({ subjects, loading, onEdit, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} hasData={subjects.length > 0} />
      <Table>
        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Subject</TableHead><TableHead>Credit</TableHead><TableHead>Theory</TableHead><TableHead>Practical</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!subjects.length && <EmptyRows loading={loading} label="No subjects yet." />}
          {subjects.map((item) => (
            <TableRow key={item.id}><TableCell>{item.code}</TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell>{Number(item.creditHours)}</TableCell><TableCell>{Number(item.theoryFullMarks)}</TableCell><TableCell>{Number(item.practicalFullMarks)}</TableCell><TableCell><ActionMenu onEdit={() => onEdit(item.id, item)} onDelete={() => onDelete(item.id)} /></TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ExamTable({ exams, loading, onEdit, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} hasData={exams.length > 0} />
      <Table>
        <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Subjects</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!exams.length && <EmptyRows loading={loading} label="No exams yet." />}
          {exams.map((item) => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.examSubjects?.length ?? 0}</TableCell><TableCell><Badge variant={item.isPublished ? 'default' : 'secondary'}>{item.isPublished ? 'Finalized' : 'Draft'}</Badge></TableCell><TableCell><ActionMenu onEdit={() => onEdit(item.id, item)} onDelete={() => onDelete(item.id)} /></TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TeacherTable({ teachers, loading, onEdit, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} hasData={teachers.length > 0} />
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!teachers.length && <EmptyRows loading={loading} label="No teachers yet." />}
          {teachers.map((item) => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.username}</TableCell><TableCell><Badge variant={item.isActive ? 'default' : 'destructive'}>{item.isActive ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell><ActionMenu onEdit={() => onEdit(item.id, item)} onDelete={() => onDelete(item.id)} /></TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function StudentTable({ students, loading, onEdit, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} hasData={students.length > 0} />
      <Table>
        <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Admission</TableHead><TableHead>DOB</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!students.length && <EmptyRows loading={loading} label="No students yet." />}
          {students.map((student) => (
            <TableRow key={student.id}><TableCell>{student.rollNo}</TableCell><TableCell className="font-medium">{student.name}</TableCell><TableCell>{student.class.name}{student.section ? ` / ${student.section.name}` : ''}</TableCell><TableCell>{student.admissionNo}</TableCell><TableCell>{student.dobBs ?? student.dobAd ?? '-'}</TableCell><TableCell><ActionMenu onEdit={() => onEdit(student.id, student)} onDelete={() => onDelete(student.id)} /></TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function AssignmentTable({ assignments, loading, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} hasData={assignments.length > 0} />
      <Table>
        <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!assignments.length && <EmptyRows loading={loading} label="No teacher assignments yet." />}
          {assignments.map((item) => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.teacher.name}</TableCell><TableCell>{item.class.name}</TableCell><TableCell>{item.section?.name ?? 'All'}</TableCell><TableCell>{item.subject.name}</TableCell><TableCell><ActionMenu onDelete={() => onDelete(item.id)} /></TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ExamSubjectSummary({ exams, loading, onDelete }) {
  return (
    <div className="relative grid gap-3">
      <DataOverlay loading={loading} hasData={exams.length > 0} />
      {!exams.length && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{loading ? 'Loading...' : 'No exams yet.'}</div>}
      {exams.map((exam) => (
        <div key={exam.id} className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">{exam.name}</p>
            <Badge variant={exam.isPublished ? 'default' : 'secondary'}>{exam.isPublished ? 'Finalized' : `${exam.examSubjects?.length ?? 0} rows`}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {exam.examSubjects?.map((item) => (
              <Badge key={item.id} variant="outline" className="flex items-center gap-1 group">
                {item.class.name} / {item.subject.name}
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground opacity-50 group-hover:opacity-100 focus:opacity-100 outline-none">
                        <Trash2 className="size-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove subject from exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete any entered marks for this subject in this exam.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(exam.id, item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GradeRuleEditor({ rules, updateRule }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Minimum %</TableHead><TableHead>Maximum %</TableHead><TableHead>GPA</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
      <TableBody>
        {rules.map((rule, index) => (
          <TableRow key={`${rule.label}-${index}`}>
            <TableCell><Input className="w-20" value={rule.label} onChange={(e) => updateRule(index, 'label', e.target.value)} /></TableCell>
            <TableCell><Input type="number" value={rule.minPercentage} onChange={(e) => updateRule(index, 'minPercentage', e.target.value)} /></TableCell>
            <TableCell><Input type="number" value={rule.maxPercentage} onChange={(e) => updateRule(index, 'maxPercentage', e.target.value)} /></TableCell>
            <TableCell><Input type="number" value={rule.gpa} onChange={(e) => updateRule(index, 'gpa', e.target.value)} /></TableCell>
            <TableCell><Input value={rule.remarks ?? ''} onChange={(e) => updateRule(index, 'remarks', e.target.value)} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ReportCardManager({ exams, loading, publishing, onFinalize }) {
  const [selectedExamId, setSelectedExamId] = useState('')
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    const nextId = exams[0]?.id ?? ''
    setSelectedExamId((current) => current || nextId)
  }, [exams])

  useEffect(() => {
    if (!selectedExamId) {
      setPayload(null)
      return
    }

    api(`/admin/exams/${selectedExamId}/report-cards`)
      .then(setPayload)
      .catch((error) => toast.error(error.message))
  }, [selectedExamId, publishing])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-medium">Exam report cards</p>
          <p className="text-sm text-muted-foreground">
            Finalize the exam once, then print a PDF report card for each student.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <LoadingButton loading={publishing} disabled={!selectedExamId || payload?.exam?.isPublished} onClick={() => onFinalize(selectedExamId)}>
            {payload?.exam?.isPublished ? <CheckCircle2 /> : <Upload />}
            {payload?.exam?.isPublished ? 'Finalized' : 'Finalize exam'}
          </LoadingButton>
        </div>
      </div>

      <div className="relative">
        <DataOverlay loading={loading} hasData={!!selectedExamId} />
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Print</TableHead></TableRow></TableHeader>
          <TableBody>
            {!selectedExamId && <EmptyRows loading={loading} label="No exams available." />}
            {selectedExamId && !payload?.students?.length && <EmptyRows loading={loading} label="No student report cards for this exam yet." />}
            {payload?.students?.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-xs text-muted-foreground">{student.admissionNo} / Roll {student.rollNo}</div>
                </TableCell>
                <TableCell>{student.className}{student.sectionName ? ` / ${student.sectionName}` : ''}</TableCell>
                <TableCell>
                  <Badge variant={payload.exam.isPublished ? 'default' : 'secondary'}>
                    {payload.exam.isPublished ? 'Printable' : 'Pending finalization'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" disabled={!payload.exam.isPublished || !student.hasResults}>
                    <a href={`${apiBase}/admin/exams/${payload.exam.id}/report-cards/${student.id}.pdf`} target="_blank" rel="noreferrer">
                      Print PDF
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
