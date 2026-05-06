import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableCell, TableRow } from '@/components/ui/table'

export function MetricTile({ label, value, icon: Icon, loading = false }) {
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

export function LoadingButton({ loading, children, disabled, ...props }) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : children}
      {loading ? 'Working...' : null}
    </Button>
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
