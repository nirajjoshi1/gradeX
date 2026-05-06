import { useMemo } from 'react'
import { Loader2, Plus, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyRows, DataOverlay, ActionMenu, LoadingButton } from './shared'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ClassTable({ classes, loading, onManage }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} />
      <Table>
        <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Sections & Class Teachers</TableHead><TableHead>Order</TableHead><TableHead className="w-16 text-right"></TableHead></TableRow></TableHeader>
        <TableBody>
          {!classes.length && <EmptyRows label="No classes yet." />}
          {classes.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {item.sections.map((section) => (
                    <Badge key={section.id} variant="secondary" className="font-normal">
                      {section.name} {section.classTeacher && <span className="ml-1 opacity-70 border-l pl-1">T: {section.classTeacher.name}</span>}
                    </Badge>
                  )) || '-'}
                </div>
              </TableCell>
              <TableCell>{item.sortOrder}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={() => onManage(item)}>
                  <Settings className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function SubjectTable({ subjects, loading, onManage }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} />
      <Table>
        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Subject</TableHead><TableHead>Credit</TableHead><TableHead>Theory</TableHead><TableHead>Practical</TableHead><TableHead className="w-16 text-right"></TableHead></TableRow></TableHeader>
        <TableBody>
          {!subjects.length && <EmptyRows label="No subjects yet." />}
          {subjects.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-[10px]">{item.code}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{Number(item.creditHours)}</TableCell>
              <TableCell>{Number(item.theoryFullMarks)}</TableCell>
              <TableCell>{Number(item.practicalFullMarks)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => onManage(item)}>
                  <Settings className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ExamTable({ exams, loading, onEdit, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} />
      <Table>
        <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Subjects</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!exams.length && <EmptyRows label="No exams yet." />}
          {exams.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.examSubjects?.length ?? 0}</TableCell>
              <TableCell><Badge variant={item.isPublished ? 'default' : 'secondary'}>{item.isPublished ? 'Finalized' : 'Draft'}</Badge></TableCell>
              <TableCell><ActionMenu onEdit={() => onEdit(item.id, item)} onDelete={() => onDelete(item.id)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function TeacherTable({ teachers, loading, onManageAssignments }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} />
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!teachers.length && <EmptyRows label="No teachers yet." />}
          {teachers.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.username}</TableCell>
              <TableCell><Badge variant={item.isActive ? 'default' : 'destructive'}>{item.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={() => onManageAssignments(item.id)}>
                  <Settings className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function StudentTable({ students, loading, onEdit, onDelete }) {
  return (
    <div className="relative">
      <DataOverlay loading={loading} />
      <Table>
        <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Admission</TableHead><TableHead>DOB</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {!students.length && <EmptyRows label="No students yet." />}
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.rollNo}</TableCell>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{student.class.name}{student.section ? ` / ${student.section.name}` : ''}</TableCell>
              <TableCell>{student.admissionNo}</TableCell>
              <TableCell>{student.dobBs ?? student.dobAd ?? '-'}</TableCell>
              <TableCell><ActionMenu onEdit={() => onEdit(student.id, student)} onDelete={() => onDelete(student.id)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function AssignmentTable({ assignments, loading, onManage }) {
  const grouped = useMemo(() => {
    const map = new Map()
    assignments.forEach(a => {
      if (!map.has(a.teacherId)) map.set(a.teacherId, { teacher: a.teacher, items: [] })
      map.get(a.teacherId).items.push(a)
    })
    return Array.from(map.values())
  }, [assignments])

  return (
    <div className="relative">
      <DataOverlay loading={loading} />
      <Table>
        <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead>Assigned Responsibilities</TableHead><TableHead className="w-16 text-right"></TableHead></TableRow></TableHeader>
        <TableBody>
          {!grouped.length && <EmptyRows label="No teacher assignments yet." />}
          {grouped.map((group) => (
            <TableRow key={group.teacher.id}>
              <TableCell className="font-medium align-top py-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {group.teacher.name.charAt(0)}
                  </div>
                  {group.teacher.name}
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex flex-wrap gap-2">
                  {group.items.map(a => (
                    <Badge key={a.id} variant="secondary" className="font-normal text-[10px] py-0.5">
                      {a.class.name}{a.section ? `/${a.section.name}` : ''} • {a.subject.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right py-4">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => onManage(group.teacher.id)}>
                  <Settings className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ExamSubjectSummary({ exams, loading, onDelete }) {
  return (
    <div className="relative grid gap-3">
      <DataOverlay loading={loading} />
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
                        <AlertDialogDescription>This will delete any entered marks for this subject in this exam.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(exam.id, item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
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
