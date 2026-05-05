import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Award, Download, FileText, GraduationCap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, apiBase } from '@/lib/api'

export function StudentResultsPage() {
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    api('/student/results')
      .then(setPayload)
      .catch((error) => toast.error(error.message))
  }, [])

  const latest = payload?.results?.[0]

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card px-5 py-5 shadow-sm md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">Student portal</Badge>
              {latest && <Badge variant={latest.summary.status === 'PASS' ? 'default' : 'destructive'}>{latest.summary.status}</Badge>}
            </div>
            <h1 className="text-2xl font-semibold md:text-3xl">
              {payload?.student?.name ?? 'Your report cards'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {payload?.student
                ? `${payload.student.class.name}${payload.student.section ? ` / Section ${payload.student.section.name}` : ''} / Roll ${payload.student.rollNo}`
                : 'Published results will appear here.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:w-72">
            <ResultStat icon={Award} label="Latest GPA" value={latest?.summary.finalGpa ?? '-'} />
            <ResultStat icon={FileText} label="Reports" value={payload?.results?.length ?? 0} />
          </div>
        </div>
      </section>

      {!payload?.results?.length && (
        <Card className="rounded-lg border-dashed shadow-sm">
          <CardContent className="grid place-items-center py-16 text-center">
            <GraduationCap className="mb-3 size-10 text-muted-foreground" />
            <CardTitle>No published results yet</CardTitle>
            <CardDescription className="mt-2">
              Your school will publish report cards after marks are verified and locked.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {payload?.results.map(({ exam, summary }) => (
        <Card key={exam.id} className="overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <CardHeader className="border-b bg-[linear-gradient(135deg,oklch(0.98_0.01_95)_0%,oklch(0.95_0.025_175)_100%)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge variant="outline" className="mb-3 bg-background/80">Report card</Badge>
                <CardTitle className="text-xl">{exam.name}</CardTitle>
                <CardDescription>
                  {summary.subjects.length} subjects calculated with credit-hour weighted GPA.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-lg border bg-muted/40 px-3 py-2">
                  <div className="text-xs text-muted-foreground">Final GPA</div>
                  <div className="text-xl font-semibold">{summary.finalGpa}</div>
                </div>
                <Badge variant={summary.status === 'PASS' ? 'default' : 'destructive'}>
                  {summary.status}
                </Badge>
                <Button asChild variant="outline" className="bg-background/80 hover:bg-background">
                  <a href={`${apiBase}/student/reports/${exam.id}.pdf`}>
                    <Download />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/70">
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Theory</TableHead>
                    <TableHead>Practical</TableHead>
                    <TableHead>Final Grade</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.subjects.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.subject.name}</TableCell>
                      <TableCell>{result.theoryGrade ?? '-'}</TableCell>
                      <TableCell>{result.practicalGrade ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{result.finalGrade ?? '-'}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{Number(result.finalGpa ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={result.status === 'PASS' ? 'outline' : 'destructive'}>
                          {result.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ResultStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}
