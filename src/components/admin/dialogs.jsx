import { useState, useEffect, useMemo } from 'react'
import { Plus, Save, Layers3, Loader2, Trash2, ShieldCheck, Send, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ActionDialog, Field, LoadingButton, Selector, DataOverlay } from './shared'
import { cn } from '@/lib/utils'

export function CreateClassDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
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

export function CreateSubjectDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
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

export function CreateExamDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
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

export function CreateTeacherDialog({ editId, forms, setForms, loading, open, setOpen, onSubmit }) {
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

export function CreateStudentDialog({ editId, forms, setForms, selected, setSelected, classes, sections, loading, open, setOpen, onSubmit, syncDobFromAd, syncDobFromBs }) {
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

export function AssignTeacherDialog({ selected, setSelected, teachers, classes, sections, subjects, loading, open, setOpen, onSubmit }) {
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

export function AttachSubjectDialog({ selected, setSelected, exams, classes, subjects, loading, open, setOpen, onSubmit }) {
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

export function ClassManagementDialog({ classItem, teachers, allSubjects, open, setOpen, onUpdate }) {
  const [sections, setSections] = useState([])
  const [newSection, setNewSection] = useState('')
  const [classForms, setClassForms] = useState({ name: '', sortOrder: 1 })
  const [updatingId, setUpdatingId] = useState(null)
  const [savingClass, setSavingClass] = useState(false)
  const [activeTab, setActiveTab] = useState('sections')

  useEffect(() => {
    if (classItem) {
      setSections(classItem.sections || [])
      setClassForms({ name: classItem.name, sortOrder: classItem.sortOrder })
    }
  }, [classItem])

  const assignedTeacherIds = useMemo(() => new Set(sections.map(s => s.classTeacherId).filter(Boolean)), [sections])

  async function addSection() {
    if (!newSection) return
    setUpdatingId('new')
    try {
      await api(`/admin/classes/${classItem.id}/sections`, { method: 'POST', body: JSON.stringify({ name: newSection }) })
      setNewSection('')
      onUpdate()
    } finally { setUpdatingId(null) }
  }

  async function updateSection(id, data) {
    setUpdatingId(id)
    try {
      await api(`/admin/classes/${classItem.id}/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      onUpdate()
    } finally { setUpdatingId(null) }
  }

  async function deleteSection(id) {
    if (!confirm('Delete section?')) return
    setUpdatingId(id)
    try {
      await api(`/admin/classes/${classItem.id}/sections/${id}`, { method: 'DELETE' })
      onUpdate()
    } finally { setUpdatingId(null) }
  }

  async function saveClassInfo() {
    setSavingClass(true)
    try {
      await api(`/admin/classes/${classItem.id}`, { method: 'PUT', body: JSON.stringify(classForms) })
      toast.success('Class updated')
      onUpdate()
    } finally { setSavingClass(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl overflow-hidden p-0 border-0 bg-slate-950 text-white shadow-2xl">
        <div className="flex px-6 border-b border-white/10 bg-white/5 pt-2">
          {['sections', 'curriculum', 'info'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 text-sm font-bold transition-all border-b-2 capitalize tracking-wide",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-white/30 hover:text-white/60"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">Manage Class</h2>
            <p className="text-sm text-white/40 mt-1">Configure parameters for {classItem?.name}</p>
          </div>

          {activeTab === 'sections' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex gap-3">
                <Input 
                  placeholder="New section (e.g. A)" 
                  value={newSection} 
                  onChange={e => setNewSection(e.target.value)}
                  className="h-11 bg-white/5 border-white/10 text-white"
                />
                <Button onClick={addSection} disabled={updatingId === 'new'} className="h-11 bg-primary text-white px-6">
                  {updatingId === 'new' ? <Loader2 className="animate-spin" /> : "Add"}
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Section</TableHead>
                      <TableHead className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Teacher</TableHead>
                      <TableHead className="text-white/40 text-right text-[10px] font-bold uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections.map(s => (
                      <TableRow key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <TableCell className="font-bold py-3.5 text-white/90">{s.name}</TableCell>
                        <TableCell className="py-3.5">
                          <Select 
                            disabled={updatingId === s.id}
                            value={s.classTeacherId || "__none__"} 
                            onValueChange={val => updateSection(s.id, { name: s.name, classTeacherId: val === "__none__" ? null : val })}
                          >
                            <SelectTrigger className="h-9 w-full max-w-[180px] bg-white/5 border-white/10 text-white text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                              <SelectItem value="__none__">Unassigned</SelectItem>
                              {teachers.filter(t => !assignedTeacherIds.has(t.id) || t.id === s.classTeacherId).map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          <button onClick={() => deleteSection(s.id)} className="p-2 text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="relative space-y-6 animate-in fade-in duration-300 min-h-[200px]">
              {updatingId === 'curriculum' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px] rounded-xl transition-all">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Updating Curriculum...</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white/90">Add Subject</h4>
                  <p className="text-[11px] text-white/40">Select a subject to add to this class.</p>
                </div>
                <Select onValueChange={id => {
                  const currentIds = (classItem.subjects || []).map(s => s.id)
                  if (!currentIds.includes(id)) {
                    setUpdatingId('curriculum')
                    api(`/admin/classes/${classItem.id}`, { method: 'PUT', body: JSON.stringify({ ...classForms, subjects: [...currentIds, id] }) })
                      .then(() => { toast.success('Subject added'); onUpdate(); })
                      .finally(() => setUpdatingId(null))
                  }
                }}>
                  <SelectTrigger className="h-10 w-40 bg-white/10 border-white/10 text-white text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {allSubjects.filter(s => !(classItem?.subjects || []).some(cs => cs.id === s.id)).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Subject</TableHead>
                      <TableHead className="text-white/40 text-right text-[10px] font-bold uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(classItem?.subjects || []).map(sub => (
                      <TableRow key={sub.id} className="border-b border-white/5 hover:bg-white/5 group">
                        <TableCell className="py-3.5 font-medium text-white/80">{sub.name} <span className="ml-2 text-[10px] text-white/30 uppercase">{sub.code}</span></TableCell>
                        <TableCell className="py-3.5 text-right">
                          <button onClick={() => {
                            const remaining = classItem.subjects.filter(s => s.id !== sub.id).map(s => s.id)
                            setUpdatingId('curriculum')
                            api(`/admin/classes/${classItem.id}`, { method: 'PUT', body: JSON.stringify({ ...classForms, subjects: remaining }) })
                              .then(() => { toast.success('Subject removed'); onUpdate(); })
                              .finally(() => setUpdatingId(null))
                          }} className="p-2 text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid gap-5 sm:grid-cols-2 p-5 rounded-xl border border-white/10 bg-white/5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Class Name</label>
                  <Input value={classForms.name} onChange={e => setClassForms({ ...classForms, name: e.target.value })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Sort Weight</label>
                  <Input type="number" value={classForms.sortOrder} onChange={e => setClassForms({ ...classForms, sortOrder: Number(e.target.value) })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div className="flex justify-end">
                <LoadingButton loading={savingClass} onClick={saveClassInfo} className="h-11 px-8 bg-primary text-white shadow-lg shadow-primary/20">
                  <Save className="size-4 mr-2" /> Save Changes
                </LoadingButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SubjectManagerDialog({ subject, allClasses, open, setOpen, onUpdate, onDelete }) {
  const [form, setForm] = useState({ name: '', code: '', creditHours: 0, theoryFullMarks: 0, practicalFullMarks: 0, passPercentage: 40 })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info') 
  const [syncingId, setSyncingId] = useState(null)
  const [localAssignedIds, setLocalAssignedIds] = useState(new Set())

  useEffect(() => {
    if (subject) {
      setForm({ 
        name: subject.name, 
        code: subject.code, 
        creditHours: Number(subject.creditHours), 
        theoryFullMarks: Number(subject.theoryFullMarks), 
        practicalFullMarks: Number(subject.practicalFullMarks),
        passPercentage: Number(subject.passPercentage || 40)
      })
      setLocalAssignedIds(new Set((subject.classes || []).map(c => c.id)))
    }
  }, [subject])

  async function handleSave() {
    setLoading(true)
    try {
      await api(`/admin/subjects/${subject.id}`, { method: 'PUT', body: JSON.stringify(form) })
      toast.success('Subject updated')
      await onUpdate()
    } finally { setLoading(false) }
  }

  async function toggleClass(classId) {
    const nextIds = new Set(localAssignedIds)
    const wasAssigned = nextIds.has(classId)
    
    if (wasAssigned) nextIds.delete(classId)
    else nextIds.add(classId)

    setLocalAssignedIds(nextIds)
    setSyncingId(classId)
    
    try {
      await api(`/admin/subjects/${subject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, classes: Array.from(nextIds) })
      })
      toast.success(wasAssigned ? 'Subject disabled for class' : 'Subject enabled for class')
      await onUpdate()
    } catch (err) {
      setLocalAssignedIds(new Set((subject.classes || []).map(c => c.id)))
      toast.error(err.message)
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl overflow-hidden p-0 border-0 bg-slate-950 text-white shadow-2xl">
        {/* Tabs at the very top */}
        <div className="flex px-6 border-b border-white/10 bg-white/5 pt-2">
          <button 
            onClick={() => setActiveTab('info')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all border-b-2 tracking-wide",
              activeTab === 'info' ? "border-primary text-primary" : "border-transparent text-white/30 hover:text-white/60"
            )}
          >
            General Settings
          </button>
          <button 
            onClick={() => setActiveTab('classes')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all border-b-2 tracking-wide",
              activeTab === 'classes' ? "border-primary text-primary" : "border-transparent text-white/30 hover:text-white/60"
            )}
          >
            Class Assignments
          </button>
        </div>
        
        <div className="p-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Manage Subject</h2>
              <p className="text-sm text-white/40 mt-1">Configure parameters for {subject?.name}</p>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{subject?.code}</span>
            </div>
          </div>

          {activeTab === 'info' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Subject Name</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-11 bg-white/5 border-white/10 text-white focus:border-primary focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Subject Code</label>
                  <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="h-11 bg-white/5 border-white/10 text-white focus:border-primary focus:ring-primary/20" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Credits</label>
                  <Input type="number" value={form.creditHours} onChange={e => setForm({ ...form, creditHours: Number(e.target.value) })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Theory FM</label>
                  <Input type="number" value={form.theoryFullMarks} onChange={e => setForm({ ...form, theoryFullMarks: Number(e.target.value) })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Practical FM</label>
                  <Input type="number" value={form.practicalFullMarks} onChange={e => setForm({ ...form, practicalFullMarks: Number(e.target.value) })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Pass %</label>
                  <Input type="number" value={form.passPercentage} onChange={e => setForm({ ...form, passPercentage: Number(e.target.value) })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-rose-400 hover:bg-rose-400/10 hover:text-rose-400">
                      <Trash2 className="size-4 mr-2" /> Delete Subject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {subject?.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { onDelete(subject.id); setOpen(false) }} className="bg-rose-500 text-white hover:bg-rose-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <LoadingButton loading={loading} onClick={handleSave} className="h-11 px-8 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Save className="size-4 mr-2" /> Update Parameters
                </LoadingButton>
              </div>
            </div>
          ) : (
            <div className="relative space-y-4 animate-in slide-in-from-right-2 duration-300 min-h-[200px]">
              {syncingId && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px] rounded-xl transition-all">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Syncing Changes...</span>
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
                <div className="max-h-[320px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-white/10 hover:bg-transparent">
                        <TableHead className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Class Name</TableHead>
                        <TableHead className="text-white/40 text-center text-[10px] font-bold uppercase tracking-widest w-24">Enable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allClasses.map(c => (
                        <TableRow key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium py-3.5 text-sm text-white/80">{c.name}</TableCell>
                          <TableCell className="text-center py-3.5">
                            <Checkbox
                              checked={localAssignedIds.has(c.id)} 
                              onCheckedChange={() => toggleClass(c.id)}
                              disabled={!!syncingId}
                              className="size-5 rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">i</div>
                <p className="text-[11px] leading-relaxed text-white/50">
                  Select the classes where this subject is taught. This will automatically include it in those classes' result ledgers and exams.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



export function TeacherAssignmentManagerDialog({ teacher, assignments, classes, subjects, open, setOpen, onUpdate }) {
  const [activeTab, setActiveTab] = useState('info')
  const [form, setForm] = useState({ name: '', username: '', password: '', isActive: true })
  const [assignForm, setAssignForm] = useState({ classId: '', sectionId: '', subjectId: '' })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (teacher) setForm({ name: teacher.name, username: teacher.username, password: '', isActive: teacher.isActive })
  }, [teacher])

  const selectedClass = classes.find(c => c.id === assignForm.classId)
  const sections = selectedClass?.sections || []

  async function handleSaveInfo() {
    setLoading(true)
    try {
      await api(`/admin/teachers/${teacher.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, password: form.password || undefined })
      })
      toast.success('Teacher info updated')
      await onUpdate()
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  async function handleDeleteTeacher() {
    if (!confirm('Permanently delete this teacher?')) return
    setLoading(true)
    try {
      await api(`/admin/teachers/${teacher.id}`, { method: 'DELETE' })
      toast.success('Teacher deleted')
      setOpen(false)
      await onUpdate()
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  async function handleAddAssignment() {
    if (!assignForm.classId || !assignForm.subjectId) return
    setSyncing(true)
    try {
      await api('/admin/assignments', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: teacher.id,
          classId: assignForm.classId,
          sectionId: assignForm.sectionId === '__all__' ? null : assignForm.sectionId || null,
          subjectId: assignForm.subjectId
        })
      })
      toast.success('Assignment added')
      await onUpdate()
    } catch (err) {
      toast.error(err.message)
    } finally { setSyncing(false) }
  }

  async function handleRemoveAssignment(id) {
    setSyncing(true)
    try {
      await api(`/admin/assignments/${id}`, { method: 'DELETE' })
      toast.success('Assignment removed')
      await onUpdate()
    } catch (err) {
      toast.error(err.message)
    } finally { setSyncing(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl overflow-hidden p-0 border-0 bg-slate-950 text-white shadow-2xl">
        <div className="flex px-6 border-b border-white/10 bg-white/5 pt-2">
          {['info', 'assignments'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 text-sm font-bold transition-all border-b-2 capitalize tracking-wide",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-white/30 hover:text-white/60"
              )}
            >
              {tab === 'info' ? 'Account Details' : 'Subject Assignments'}
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">Manage Teacher</h2>
            <p className="text-sm text-white/40 mt-1">Configure access and responsibilities for {teacher?.name}</p>
          </div>

          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid gap-5 sm:grid-cols-2 p-6 rounded-xl border border-white/10 bg-white/5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Full Name</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Username</label>
                  <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="h-11 bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">New Password (optional)</label>
                  <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-11 bg-white/5 border-white/10 text-white" placeholder="Leave blank to keep current" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Account Status</label>
                  <Select value={form.isActive ? 'active' : 'inactive'} onValueChange={val => setForm({ ...form, isActive: val === 'active' })}>
                    <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <button onClick={handleDeleteTeacher} className="text-rose-400 hover:text-rose-300 text-sm font-bold uppercase tracking-widest transition-colors flex items-center">
                  <Trash2 className="size-4 mr-2" /> Delete Account
                </button>
                <LoadingButton loading={loading} onClick={handleSaveInfo} className="h-11 px-8 bg-primary text-white shadow-lg shadow-primary/20">
                  <Save className="size-4 mr-2" /> Save Account Info
                </LoadingButton>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="relative space-y-6 animate-in fade-in duration-300 min-h-[400px]">
              {syncing && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl">
                  <div className="relative flex items-center justify-center size-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white animate-pulse">Syncing Changes...</p>
                </div>
              )}
              
              <div className="grid gap-3 p-5 rounded-xl border border-white/10 bg-white/5 sm:grid-cols-4 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-white/30 ml-1">Class</label>
                  <Select value={assignForm.classId} onValueChange={val => setAssignForm({ ...assignForm, classId: val, sectionId: '' })}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-white/30 ml-1">Section</label>
                  <Select value={assignForm.sectionId} onValueChange={val => setAssignForm({ ...assignForm, sectionId: val })}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="__all__">All Sections</SelectItem>
                      {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-white/30 ml-1">Subject</label>
                  <Select value={assignForm.subjectId} onValueChange={val => setAssignForm({ ...assignForm, subjectId: val })}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddAssignment} className="h-10 bg-primary text-white hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
                  <Plus className="mr-2 size-4" /> Assign
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Responsibility</TableHead>
                      <TableHead className="text-white/40 text-right text-[10px] font-bold uppercase tracking-widest px-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(a => (
                      <TableRow key={a.id} className="border-b border-white/5 group transition-colors hover:bg-white/[0.02]">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white/10 text-white border border-white/10">{a.class.name}</span>
                              {a.section && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary/20 text-primary border border-primary/20">{a.section.name}</span>}
                            </div>
                            <span className="text-white/20 text-[10px] font-bold uppercase tracking-wider">teaching</span>
                            <span className="font-bold text-white/80">{a.subject.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <button onClick={() => handleRemoveAssignment(a.id)} className="p-2 text-white/10 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all">
                            <Trash2 className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!assignments.length && (
                      <TableRow><TableCell colSpan={2} className="text-center py-16 text-white/20 italic tracking-wide">No assignments yet for this teacher.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
