import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Trash2, Building2, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

export function SuperAdminDashboard() {
  const location = useLocation()
  const view = new URLSearchParams(location.search).get('view') ?? 'schools'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Administration</h1>
        <p className="text-muted-foreground">Manage school workspaces and accounts</p>
      </div>
      {view === 'schools' && <SchoolManagement />}
    </div>
  )
}

function SchoolManagement() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [createdInfo, setCreatedInfo] = useState(null)

  const [forms, setForms] = useState({
    name: '',
    address: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
  })

  async function load() {
    try {
      const data = await api('/super-admin/schools')
      setSchools(data)
    } catch (error) {
      toast.error('Failed to load schools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const data = await api('/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(forms),
      })
      setCreatedInfo(data)
      setCreateOpen(false)
      setSuccessOpen(true)
      setForms({ name: '', address: '', adminUsername: '', adminEmail: '', adminPassword: '' })
      await load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleDelete(id) {
    try {
      await api(`/super-admin/schools/${id}`, { method: 'DELETE' })
      toast.success('School deleted permanently')
      await load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copied to clipboard')
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h3 className="font-semibold leading-none tracking-tight">School Directory</h3>
          <p className="text-sm text-muted-foreground mt-1.5">Register and manage client schools.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" /> Register New School
        </Button>
      </div>

      <div className="p-6 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Principal Account</TableHead>
              <TableHead className="text-center">Students</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading schools...</TableCell>
              </TableRow>
            ) : !schools.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No schools registered yet.</TableCell>
              </TableRow>
            ) : (
              schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      <Building2 className="size-4 text-primary" /> {school.name}
                    </div>
                    {school.address && <div className="text-xs text-muted-foreground mt-0.5">{school.address}</div>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        /{school.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {school.users?.[0] ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{school.users[0].username}</Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">No admin</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{school._count?.students || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(school.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(`${window.location.origin}/${school.slug}/login`)}
                      >
                        <Copy className="size-4 text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={school.id === 'seed-school'}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {school.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the school, all its staff, students, and exam records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(school.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Register New School</DialogTitle>
              <DialogDescription>
                Create a new school workspace and its Principal administrator account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">School Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={forms.name}
                  onChange={(e) => setForms({ ...forms, name: e.target.value })}
                  placeholder="e.g. Springfield High"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address / Location</Label>
                <Input
                  id="address"
                  value={forms.address}
                  onChange={(e) => setForms({ ...forms, address: e.target.value })}
                  placeholder="e.g. 123 Education Lane"
                />
              </div>
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">Principal Account Details</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="adminUsername">Admin Username <span className="text-destructive">*</span></Label>
                    <Input
                      id="adminUsername"
                      value={forms.adminUsername}
                      onChange={(e) => setForms({ ...forms, adminUsername: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      placeholder="e.g. springfield_admin"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={forms.adminEmail}
                      onChange={(e) => setForms({ ...forms, adminEmail: e.target.value })}
                      placeholder="e.g. principal@school.edu.np"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminPassword">Admin Password <span className="text-destructive">*</span></Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={forms.adminPassword}
                      onChange={(e) => setForms({ ...forms, adminPassword: e.target.value })}
                      placeholder="Choose a strong password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create School</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-[425px] text-center">
          <div className="flex justify-center mb-4">
            <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-10 text-emerald-500" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">School Registered Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              {createdInfo?.school?.name} is ready. Share the login URL below with the principal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-bold tracking-widest">School Login URL</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={`${window.location.origin}/${createdInfo?.school?.slug}/login`}
                  className="bg-muted font-mono text-sm"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => copyToClipboard(`${window.location.origin}/${createdInfo?.school?.slug}/login`)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 text-left">
              <h5 className="text-sm font-semibold text-amber-600 mb-1">Important</h5>
              <p className="text-xs text-amber-700 leading-relaxed">
                Provide the username <strong>{createdInfo?.admin?.username}</strong> and the password you just set to the principal so they can log in and begin setup.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto px-8" 
              onClick={() => window.open(`${window.location.origin}/${createdInfo?.school?.slug}/login`, '_blank')}
            >
              Visit Portal
            </Button>
            <Button className="w-full sm:w-auto px-8" onClick={() => setSuccessOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
