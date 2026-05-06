import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Upload, Trash2, Globe, Mail, Phone, MapPin, Image as ImageIcon, PenTool, Save, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, apiBase } from '@/lib/api'
import { LoadingButton, DataOverlay, EmptyRows } from './shared'

export function GradeRuleEditor({ rules, updateRule }) {
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

export function ReportCardManager({ exams, loading, publishing, onFinalize }) {
  const [selectedExamId, setSelectedExamId] = useState('')
  const [payload, setPayload] = useState(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    const nextId = exams[0]?.id ?? ''
    setSelectedExamId((current) => current || nextId)
  }, [exams])

  useEffect(() => {
    if (!selectedExamId) {
      setPayload(null)
      return
    }

    setFetching(true)
    api(`/admin/exams/${selectedExamId}/report-cards`)
      .then(setPayload)
      .catch((error) => toast.error(error.message))
      .finally(() => setFetching(false))
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
        <DataOverlay loading={loading} />
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Print</TableHead></TableRow></TableHeader>
          <TableBody>
            {!selectedExamId && <EmptyRows label="No exams available." />}
            {selectedExamId && !payload?.students?.length && (
              <EmptyRows label={fetching ? "Loading report cards..." : "No student report cards for this exam yet."} />
            )}
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

export function ResultLedger({ exams, classes }) {
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedClass = classes.find(c => c.id === selectedClassId)

  const fetchLedger = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    try {
      const query = new URLSearchParams({
        classId: selectedClassId,
        ...(selectedSectionId !== 'all' ? { sectionId: selectedSectionId } : {})
      })
      const res = await api(`/admin/exams/${selectedExamId}/ledger?${query}`)
      setData(res)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger()
  }, [selectedExamId, selectedClassId, selectedSectionId])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Exam</p>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>
                {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Class</p>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Section</p>
            <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
              <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {selectedClass?.sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="w-full lg:w-auto" onClick={fetchLedger} disabled={loading || !selectedExamId || !selectedClassId}>
          {loading ? "Syncing..." : "Refresh Ledger"}
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted">
          <Table className="text-xs sm:text-sm">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 sm:w-16 sticky left-0 bg-muted/50 z-10 border-r text-center px-1">Roll</TableHead>
                <TableHead className="min-w-[150px] sm:min-w-[200px] sticky left-12 sm:left-16 bg-muted/50 z-10 border-r px-2">Student Name</TableHead>
                {data?.subjects.map(sub => (
                  <TableHead key={sub.id} className="text-center min-w-[100px] sm:min-w-[120px] border-r px-1">
                    <div className="font-bold truncate">{sub.code}</div>
                    <div className="text-[9px] sm:text-[10px] font-normal opacity-70 truncate">{sub.name}</div>
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold bg-primary/5 min-w-[80px] sm:min-w-[100px]">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <EmptyRows label="Loading ledger data..." />}
              {!loading && !data?.ledger.length && (
                <EmptyRows label={!selectedExamId || !selectedClassId ? "Select filters to view ledger" : "No results found for this selection"} />
              )}
              {data?.ledger.map((row) => (
                <TableRow key={row.student.id} className="hover:bg-muted/30">
                  <TableCell className="sticky left-0 bg-card z-10 border-r font-medium text-center px-1">{row.student.rollNo}</TableCell>
                  <TableCell className="sticky left-12 sm:left-16 bg-card z-10 border-r px-2">
                    <div className="font-medium truncate max-w-[120px] sm:max-w-none">{row.student.name}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{row.student.admissionNo}</div>
                  </TableCell>
                  {row.subjects.map((s, idx) => (
                    <TableCell key={idx} className="text-center border-r p-0 min-w-[100px] sm:min-w-[120px]">
                      <div className="flex flex-col h-full">
                        {s.isAbsent ? (
                          <div className="py-2 text-destructive font-bold text-[9px] sm:text-xs bg-destructive/5">ABSENT</div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 text-[9px] sm:text-[10px] border-b bg-muted/20">
                              <span className="p-1 border-r">TH: {s.theory ?? '-'}</span>
                              <span className="p-1">PR: {s.practical ?? '-'}</span>
                            </div>
                            <div className="py-1 font-bold text-xs sm:text-sm">{s.grade || '-'}</div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-center bg-primary/5 font-bold text-xs sm:text-sm">
                    {row.subjects.some(s => s.grade === 'NG') ? (
                      <span className="text-destructive">NG</span>
                    ) : (
                      <span className="text-primary">{Math.max(...row.subjects.map(s => s.gpa || 0)).toFixed(2)} GPA</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export function SettingsView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState(null)
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    signatureUrl: '',
  })

  const fileInputRef = useRef(null)

  async function loadSettings() {
    try {
      const data = await api('/admin/settings')
      setSettings({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        logoUrl: data.logoUrl || '',
        signatureUrl: data.signatureUrl || '',
      })
    } catch (error) {
      toast.error('Failed to load school settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      })
      toast.success('School settings updated successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleNativeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingField) return

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = 'gradex_unsigned'

    if (!cloudName) {
      toast.error('VITE_CLOUDINARY_CLOUD_NAME is missing in .env')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    const loadingToast = toast.loading(`Uploading ${uploadingField === 'logoUrl' ? 'Logo' : 'Signature'}...`)

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setSettings({ ...settings, [uploadingField]: data.secure_url })
      toast.success('Upload successful', { id: loadingToast })
    } catch (error) {
      toast.error('Upload failed', { id: loadingToast })
    } finally {
      setUploadingField(null)
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>

  return (
    <div className="mx-auto max-w-4xl py-6">
      <Card className="rounded-xl shadow-lg overflow-hidden border-none bg-card/50 backdrop-blur-xl">
        <CardHeader className="bg-primary/5 pb-8 pt-8 px-8 border-b border-primary/10">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <PenTool className="size-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">School Branding</CardTitle>
              <CardDescription className="text-base">Customize your school's identity on report cards and dashboard.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSave} className="space-y-8">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleNativeUpload} />
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-all hover:border-primary/50">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="School Logo" className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-10 opacity-20" />
                      <p className="text-sm font-medium">Upload School Logo</p>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => { setUploadingField('logoUrl'); fileInputRef.current?.click() }}>
                      <Upload className="size-4" /> Change Logo
                    </Button>
                  </div>
                </div>
                <div className="group relative h-32 w-full overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-all hover:border-primary/50">
                  {settings.signatureUrl ? (
                    <img src={settings.signatureUrl} alt="Principal Signature" className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <PenTool className="size-8 opacity-20" />
                      <p className="text-sm font-medium">Principal Signature</p>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => { setUploadingField('signatureUrl'); fileInputRef.current?.click() }}>
                      <Upload className="size-4" /> Change Signature
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2"><Building2 className="size-4 text-primary" /> School Name</label>
                  <Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} placeholder="Ex: Himalayan Public School" className="h-11 bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2"><MapPin className="size-4 text-primary" /> Address</label>
                  <Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Street name, City" className="h-11 bg-background/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2"><Phone className="size-4 text-primary" /> Phone</label>
                    <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+977..." className="h-11 bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2"><Mail className="size-4 text-primary" /> Email</label>
                    <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} placeholder="contact@school.com" className="h-11 bg-background/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2"><Globe className="size-4 text-primary" /> Website</label>
                  <Input value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })} placeholder="https://..." className="h-11 bg-background/50" />
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t pt-8">
              <LoadingButton loading={saving} type="submit" size="lg" className="h-12 px-10 gap-2 shadow-lg shadow-primary/20">
                <Save className="size-5" /> Save School Identity
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
