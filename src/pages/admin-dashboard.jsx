import { useEffect, useMemo, useState } from 'react'
import { ADToBS, BSToAD } from 'bikram-sambat-js'
import { useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Layers3,
  Plus,
  Save,
  Users,
  FileSpreadsheet
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { syncDobFromAd, syncDobFromBs } from '@/lib/utils'

// Modularized Components
import { MetricTile, WorkflowPanel, LoadingButton } from '@/components/admin/shared'
import { 
  ClassTable, 
  SubjectTable, 
  ExamTable, 
  TeacherTable, 
  StudentTable, 
  AssignmentTable,
  ExamSubjectSummary 
} from '@/components/admin/tables'
import { 
  CreateClassDialog, 
  CreateSubjectDialog, 
  CreateExamDialog, 
  CreateTeacherDialog, 
  CreateStudentDialog, 
  AssignTeacherDialog, 
  AttachSubjectDialog,
  ClassManagementDialog,
  SubjectManagerDialog,
  TeacherAssignmentManagerDialog
} from '@/components/admin/dialogs'
import { GradeRuleEditor, ReportCardManager, ResultLedger, SettingsView } from '@/components/admin/specialized'

const defaultRules = [
  { label: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4 },
  { label: 'A', minPercentage: 80, maxPercentage: 89.99, gpa: 3.6 },
  { label: 'B+', minPercentage: 70, maxPercentage: 79.99, gpa: 3.2 },
  { label: 'B', minPercentage: 60, maxPercentage: 69.99, gpa: 2.8 },
  { label: 'C+', minPercentage: 50, maxPercentage: 59.99, gpa: 2.4 },
  { label: 'C', minPercentage: 40, maxPercentage: 49.99, gpa: 2 },
  { label: 'NG', minPercentage: 0, maxPercentage: 39.99, gpa: 0 },
]

const adminViews = new Set(['dashboard', 'classes', 'subjects', 'exams', 'teachers', 'students', 'grading', 'publish', 'settings', 'ledger'])

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
  sections: '', 
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

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({
    overview: {},
    classes: [],
    subjects: [],
    teachers: [],
    students: { items: [] },
    teachers: [],
    students: { items: [] },
    exams: [],
    gradeRules: [],
  })
  const [forms, setForms] = useState(initialForms)
  const [selected, setSelected] = useState({})
  const [ruleDraft, setRuleDraft] = useState(defaultRules)
  const [loading, setLoading] = useState({ page: true })
  const [openDialog, setOpenDialog] = useState(null)
  const [editId, setEditId] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const activeView = adminViews.has(searchParams.get('view')) ? searchParams.get('view') : 'dashboard'

  useEffect(() => {
    if (!adminViews.has(searchParams.get('view'))) {
      setSearchParams({ view: 'dashboard' }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function load() {
    const promise = Promise.all([
          api('/admin/overview'),
          api('/admin/classes'),
          api('/admin/subjects'),
          api('/admin/teachers'),
          api('/admin/students?pageSize=20'),
          api('/admin/exams'),
          api('/admin/grade-rules'),
        ])

    try {
      const [overview, classes, subjects, teachers, students, exams, gradeRules] = await promise
      setData({ overview, classes, subjects, teachers, students, exams, gradeRules })
      setRuleDraft(gradeRules.length ? gradeRules : defaultRules)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading((current) => ({ ...current, page: false }))
    }
    return promise
  }

  useEffect(() => {
    load()
  }, [])

  const sectionsForClass = useMemo(
    () => data.classes.find((item) => item.id === selected.studentClassId)?.sections ?? [],
    [data.classes, selected.studentClassId],
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
      sortOrder: Number(forms.className.match(/\d+/)?.[0] ?? 1),
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
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/bulk-import?type=classes" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Bulk Import
                  </Link>
                </Button>
                <CreateClassDialog editId={editId} forms={forms} setForms={setForms} loading={loading.class} open={openDialog === 'class'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('class')} onSubmit={saveClass} />
              </div>
            }
            description="Create grade levels and their sections."
            title="Class management"
          >
            <ClassTable 
              classes={data.classes} 
              loading={loading.page} 
              onManage={(item) => { setSelectedClass(item); setOpenDialog('manageSections') }}
            />
            <ClassManagementDialog 
              classItem={selectedClass} 
              teachers={data.teachers} 
              allClasses={data.classes}
              allSubjects={data.subjects}
              open={openDialog === 'manageSections'} 
              setOpen={(open) => setOpenDialog(open ? 'manageSections' : null)} 
              onUpdate={load} 
              onDeleteClass={(id) => executeDelete(`/admin/classes/${id}`, 'Class')}
            />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="subjects" className="mt-0">
          <WorkflowPanel
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/bulk-import?type=subjects" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Bulk Import
                  </Link>
                </Button>
                <CreateSubjectDialog editId={editId} forms={forms} setForms={setForms} loading={loading.subject} open={openDialog === 'subject'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('subject')} onSubmit={saveSubject} />
              </div>
            }
            description="Configure full marks, practical marks, and credit hours per subject."
            title="Subject system"
          >
            <SubjectTable 
              subjects={data.subjects} 
              loading={loading.page} 
              onManage={(item) => { setSelectedSubject(item); setOpenDialog('manageSubject') }}
            />
            <SubjectManagerDialog
              subject={selectedSubject}
              allClasses={data.classes}
              open={openDialog === 'manageSubject'}
              setOpen={(open) => setOpenDialog(open ? 'manageSubject' : null)}
              onUpdate={load}
              onDelete={(id) => executeDelete(`/admin/subjects/${id}`, 'Subject')}
            />
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

        <TabsContent value="teachers" className="mt-0 space-y-6">
          <WorkflowPanel
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/bulk-import?type=teachers" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Bulk Import
                  </Link>
                </Button>
                <CreateTeacherDialog editId={editId} forms={forms} setForms={setForms} loading={loading.teacher} open={openDialog === 'teacher'} setOpen={(open) => !open ? setOpenDialog(null) : openCreate('teacher')} onSubmit={saveTeacher} />
              </div>
            }
            description="Create teacher accounts and manage their access."
            title="Teacher accounts"
          >
            <TeacherTable 
              teachers={data.teachers} 
              loading={loading.page} 
              onManageAssignments={(teacherId) => {
                setSelected({ ...selected, teacherId })
                setOpenDialog('manageTeacherAssignments')
              }}
            />
            <TeacherAssignmentManagerDialog 
              teacher={data.teachers.find(t => t.id === selected.teacherId)}
              assignments={data.teachers.find(t => t.id === selected.teacherId)?.teacherAssignments || []}
              classes={data.classes}
              subjects={data.subjects}
              open={openDialog === 'manageTeacherAssignments'}
              setOpen={(open) => setOpenDialog(open ? 'manageTeacherAssignments' : null)}
              onUpdate={load}
            />
          </WorkflowPanel>
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <WorkflowPanel
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/bulk-import?type=students" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Bulk Import
                  </Link>
                </Button>
                <CreateStudentDialog 
                  editId={editId} 
                  forms={forms} 
                  setForms={setForms} 
                  selected={selected} 
                  setSelected={setSelected} 
                  classes={data.classes} 
                  sections={sectionsForClass} 
                  loading={loading.student} 
                  open={openDialog === 'student'} 
                  setOpen={(open) => !open ? setOpenDialog(null) : openCreate('student')} 
                  onSubmit={saveStudent}
                  syncDobFromAd={(sf, f, v) => syncDobFromAd(sf, f, v, ADToBS)}
                  syncDobFromBs={(sf, f, v) => syncDobFromBs(sf, f, v, BSToAD)}
                />
              </div>
            }
            description="Enroll students into class and section records."
            title="Student register"
          >
            <StudentTable students={data.students.items} loading={loading.page} onEdit={(id, item) => { setSelected({ ...selected, studentClassId: item.classId, studentSectionId: item.sectionId }); openEdit('student', id, { studentName: item.name, admissionNo: item.admissionNo, rollNo: item.rollNo, guardianName: item.guardianName ?? '', dobAd: item.dobAd ?? '', dobBs: item.dobBs ?? '' }) }} onDelete={(id) => executeDelete(`/admin/students/${id}`, 'Student')} />
          </WorkflowPanel>
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
        <TabsContent value="ledger" className="mt-0">
          <WorkflowPanel
            description="View full class-wise exam ledger with subject marks and grades."
            title="Result Ledger"
          >
            <ResultLedger exams={data.exams} classes={data.classes} />
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
        <TabsContent value="settings">
          <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
