import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableCell, TableRow } from '@/components/ui/table'

export function LoadingButton({ loading, children, disabled, className, ...props }) {
  return (
    <Button 
      disabled={loading || disabled} 
      className={cn("relative transition-all active:scale-[0.98]", className)} 
      {...props}
    >
      {loading && <Loader2 className="absolute left-1/2 -translate-x-1/2 size-4 animate-spin" />}
      <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {children}
      </span>
    </Button>
  )
}

export function MetricTile({ label, value, icon: Icon, compact = false, loading = false }) {
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

export function WorkflowPanel({ title, description, action, children }) {
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

export function ActionDialog({ open, setOpen, title, description, trigger, children, footer }) {
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

export function Field({ label, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
        {label}
      </span>
      {children}
    </div>
  )
}

export function Selector({ label, items, value, onValueChange }) {
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

export function ActionMenu({ onEdit, onDelete, disabled }) {
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

export function EmptyRows({ label }) {
  return (
    <TableRow>
      <TableCell className="py-10 text-center text-muted-foreground" colSpan={8}>
        {label}
      </TableCell>
    </TableRow>
  )
}

export function DataOverlay({ loading }) {
  if (!loading) return null
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-[2px] transition-all duration-200">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}
