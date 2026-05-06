import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Upload, 
  FileSpreadsheet, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  Download,
  Loader2,
  ChevronRight,
  Users,
  BookOpen,
  Layers3
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { api, apiBase } from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const API_URL = apiBase

const CONFIG = {
  students: {
    title: 'Students',
    icon: UserPlus,
    endpoint: '/admin/students/bulk',
    templateHeaders: 'Name,Admission No,Roll No,Class ID,Section ID,Guardian Name,DOB AD,DOB BS',
    initialRow: { name: '', admissionNo: '', rollNo: '', classId: '', sectionId: '', guardianName: '', dobAd: '', dobBs: '' },
    columns: [
      { key: 'name', label: 'Full Name', width: '200px', placeholder: 'Student Name' },
      { key: 'admissionNo', label: 'ADM No', width: '120px', placeholder: 'ADM-001' },
      { key: 'rollNo', label: 'Roll', width: '80px', placeholder: '01' },
      { key: 'classId', label: 'Class', width: '140px', type: 'class-select' },
      { key: 'sectionId', label: 'Section', width: '140px', type: 'section-select' },
      { key: 'guardianName', label: 'Guardian', width: '180px', placeholder: 'Guardian' },
      { key: 'dobAd', label: 'DOB (AD)', width: '140px', placeholder: 'YYYY-MM-DD' },
      { key: 'dobBs', label: 'DOB (BS)', width: '140px', placeholder: 'YYYY-MM-DD' },
    ]
  },
  teachers: {
    title: 'Teachers',
    icon: Users,
    endpoint: '/admin/teachers/bulk',
    templateHeaders: 'Name,Username,Email,Password',
    initialRow: { name: '', username: '', email: '', password: 'Teacher@123' },
    columns: [
      { key: 'name', label: 'Full Name', width: '250px', placeholder: 'Teacher Name' },
      { key: 'username', label: 'Username', width: '180px', placeholder: 'jdoe' },
      { key: 'email', label: 'Email', width: '220px', placeholder: 'teacher@school.com' },
      { key: 'password', label: 'Password', width: '180px', placeholder: 'Teacher@123' },
    ]
  },
  subjects: {
    title: 'Subjects',
    icon: BookOpen,
    endpoint: '/admin/subjects/bulk',
    templateHeaders: 'Name,Code,Credit Hours,Theory Full Marks,Practical Full Marks,Pass Percentage',
    initialRow: { name: '', code: '', creditHours: '4', theoryFullMarks: '75', practicalFullMarks: '25', passPercentage: '40' },
    columns: [
      { key: 'name', label: 'Subject Name', width: '250px', placeholder: 'Mathematics' },
      { key: 'code', label: 'Code', width: '120px', placeholder: 'MATH101' },
      { key: 'creditHours', label: 'Credit Hrs', width: '100px', placeholder: '4' },
      { key: 'theoryFullMarks', label: 'Theory FM', width: '100px', placeholder: '75' },
      { key: 'practicalFullMarks', label: 'Prac FM', width: '100px', placeholder: '25' },
      { key: 'passPercentage', label: 'Pass %', width: '100px', placeholder: '40' },
    ]
  },
  classes: {
    title: 'Classes',
    icon: Layers3,
    endpoint: '/admin/classes/bulk',
    templateHeaders: 'Name,Sort Order,Sections',
    initialRow: { name: '', sortOrder: '0', sections: 'A,B' },
    columns: [
      { key: 'name', label: 'Class Name', width: '250px', placeholder: 'Grade 10' },
      { key: 'sortOrder', label: 'Sort Order', width: '120px', placeholder: '10' },
      { key: 'sections', label: 'Sections (Comma separated)', width: '300px', placeholder: 'A, B, C' },
    ]
  }
}

export default function BulkImport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'students'
  const config = CONFIG[type] || CONFIG.students

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState('upload') // 'upload' or 'manual'
  
  // File Upload State
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Manual Entry State
  const [manualRows, setManualRows] = useState([
    { id: Date.now(), ...config.initialRow }
  ])

  useEffect(() => {
    fetchData()
    // Reset manual rows when type changes
    setManualRows([{ id: Date.now(), ...config.initialRow }])
    setFile(null)
  }, [type])

  const fetchData = async () => {
    try {
      if (type === 'students') {
        const data = await api('/admin/classes')
        setClasses(data)
      }
    } catch (error) {
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      toast.success(`Selected: ${selectedFile.name}`)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const selectedFile = e.dataTransfer.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      toast.success(`Dropped: ${selectedFile.name}`)
    }
  }

  const addManualRow = () => {
    setManualRows([
      ...manualRows,
      { id: Date.now(), ...config.initialRow }
    ])
  }

  const removeManualRow = (id) => {
    if (manualRows.length === 1) return
    setManualRows(manualRows.filter(r => r.id !== id))
  }

  const updateManualRow = (id, field, value) => {
    setManualRows(manualRows.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (mode === 'upload') {
        if (!file) {
          toast.error('Please select a file first')
          return
        }
        const formData = new FormData()
        formData.append('file', file)
        
        await axios.post(`${API_URL}${config.endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        })
      } else {
        const rows = manualRows.filter(r => Object.values(r).some(v => v && String(v).trim() !== ''))
        if (rows.length === 0) {
          toast.error('Please fill in at least one record completely')
          return
        }
        
        // Prepare payload based on type
        const payload = { [type]: rows }
        await api(config.endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }
      
      toast.success(`Bulk ${type} import successful!`)
      // Navigate to relevant view
      const targetView = type === 'teachers' ? 'teachers' : type === 'subjects' ? 'subjects' : type === 'classes' ? 'classes' : 'students'
      navigate(`/admin?view=${targetView}`)
    } catch (error) {
      const errorData = error.response?.data || error
      if (errorData?.errors) {
        errorData.errors.forEach(err => {
          toast.error(`Row ${err.row}: ${err.error}`, { duration: 5000 })
        })
      } else {
        toast.error(errorData?.message || errorData?.error || `Failed to import ${type}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([config.templateHeaders + '\n'], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gradex_${type}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && type === 'students') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <config.icon className="w-8 h-8" />
             </div>
             <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Bulk {config.title} Addition</h1>
                <p className="text-muted-foreground mt-1">Onboard many {type} in a single go.</p>
             </div>
          </div>
          <div className="flex items-center gap-3 bg-card p-1 rounded-xl shadow-sm border border-border">
            <button 
              onClick={() => setMode('upload')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                mode === 'upload' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <FileSpreadsheet className="w-4 h-4" />
              File Upload
            </button>
            <button 
              onClick={() => setMode('manual')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                mode === 'manual' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <UserPlus className="w-4 h-4" />
              Manual Entry
            </button>
          </div>
        </div>

        {/* Action Card */}
        <Card className="border-border shadow-xl bg-card overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === 'upload' ? 'Upload Spreadsheet' : 'Manual Bulk Entry'}</CardTitle>
                <CardDescription>
                  {mode === 'upload' 
                    ? `Upload an Excel or CSV file with ${type} details.` 
                    : `Add multiple ${type} by filling out the table below.`}
                </CardDescription>
              </div>
              {mode === 'upload' && (
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" />
                  Get Template
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {mode === 'upload' ? (
              <div className="p-12">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all duration-300",
                    isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-muted-foreground/30",
                    file ? "bg-muted/30" : "bg-card"
                  )}
                >
                  <input 
                    type="file" 
                    id="student-file" 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                  />
                  
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                    {file ? <FileSpreadsheet className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                  </div>

                  {file ? (
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-foreground">{file.name}</h3>
                      <p className="text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-4 text-destructive hover:bg-destructive/10"
                      >
                        Remove and select another
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-foreground">Drag & Drop file here</h3>
                      <p className="text-muted-foreground mt-1">or click to browse from your computer</p>
                      <Label 
                        htmlFor="student-file" 
                        className="mt-6 inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-xl cursor-pointer hover:bg-primary/90 transition-all font-medium"
                      >
                        Browse Files
                      </Label>
                    </div>
                  )}

                  {!file && (
                    <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Excel (.xlsx)</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> CSV Files</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Bulk Processing</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <ScrollArea className="h-[600px] w-full border-b">
                  <Table className="min-w-[1300px] relative">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                      <TableRow>
                        {config.columns.map(col => (
                          <TableHead key={col.key} style={{ width: col.width }} className="whitespace-nowrap">
                            {col.label}
                          </TableHead>
                        ))}
                        <TableHead className="w-[50px] whitespace-nowrap"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualRows.map((row, index) => {
                        const selectedClass = classes.find(c => c.id === row.classId)
                        return (
                          <TableRow key={row.id} className="hover:bg-muted/30 group">
                            {config.columns.map(col => (
                              <TableCell key={col.key} className="p-1">
                                {col.type === 'class-select' ? (
                                  <Select 
                                    value={row[col.key]} 
                                    onValueChange={(v) => updateManualRow(row.id, col.key, v)}
                                  >
                                    <SelectTrigger className="border-transparent focus:border-primary bg-transparent text-sm h-8">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : col.type === 'section-select' ? (
                                  <Select 
                                    value={row[col.key]} 
                                    onValueChange={(v) => updateManualRow(row.id, col.key, v)}
                                    disabled={!row.classId}
                                  >
                                    <SelectTrigger className="border-transparent focus:border-primary bg-transparent text-sm h-8">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedClass?.sections.map(sec => (
                                        <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input 
                                    placeholder={col.placeholder}
                                    value={row[col.key]}
                                    onChange={(e) => updateManualRow(row.id, col.key, e.target.value)}
                                    className="border-transparent focus:border-primary bg-transparent transition-all text-sm h-8"
                                  />
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="p-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeManualRow(row.id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all h-8 w-8"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    onClick={addManualRow} 
                    className="gap-2 bg-card hover:bg-muted"
                  >
                    <Plus className="w-4 h-4" />
                    Add More Rows
                  </Button>
                  <div className="text-sm text-muted-foreground font-medium">
                    Total: {manualRows.length} {type} records
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 flex flex-col items-center gap-6">
            <div className="w-full h-px bg-border" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Double-check your data before submitting.</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || (mode === 'upload' && !file)}
                  className="min-w-[160px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Start Bulk Import
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Tips / Help */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Column Names</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ensure your file headers match common names defined in the template.
            </p>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Data Integrity</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Required fields must be filled. Unique fields like Username or Code will be checked for collisions.
            </p>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Bulk Capacity</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              GradeX can process thousands of records efficiently. We recommend batches of 2000 for optimal speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardFooter({ children, className }) {
  return (
    <div className={cn("px-6 py-4 border-t", className)}>
      {children}
    </div>
  )
}
