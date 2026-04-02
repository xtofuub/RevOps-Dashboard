"use client"

import { IconTrash } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRevOps } from "@/lib/revops-context"

export function RevOpsWeeklyTable() {
  const { entries, monthly, removeEntry } = useRevOps()

  if (entries.length === 0) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>KPI Table</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-sm">No data yet.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>KPI Overview</CardTitle>
          <CardDescription>Weekly and monthly metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly">
            <TabsList className="mb-4">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>New Cust.</TableHead>
                      <TableHead>Pipeline</TableHead>
                      <TableHead>Close %</TableHead>
                      <TableHead>Cycle (d)</TableHead>
                      <TableHead>Retention %</TableHead>
                      <TableHead>Offers</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Incidents</TableHead>
                      <TableHead>Meetings</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...entries].reverse().map((w) => (
                      <TableRow key={w.week}>
                        <TableCell className="font-medium">{w.week}</TableCell>
                        <TableCell>{w.newCustomers}</TableCell>
                        <TableCell>€{(w.pipelineValue / 1000).toFixed(0)}k</TableCell>
                        <TableCell>{w.closeRate}%</TableCell>
                        <TableCell>{w.salesCycleDays}</TableCell>
                        <TableCell>{w.feedRetention}%</TableCell>
                        <TableCell>{w.offersSent}</TableCell>
                        <TableCell>{w.ordersReceived}</TableCell>
                        <TableCell>{w.feedSlaScore}</TableCell>
                        <TableCell>
                          <Badge variant={w.incidentCount === 0 ? "secondary" : "destructive"}>{w.incidentCount}</Badge>
                        </TableCell>
                        <TableCell>{w.customerMeetings}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => removeEntry(w.week)} aria-label="Delete">
                            <IconTrash className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="monthly">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>New Cust.</TableHead>
                      <TableHead>Avg Pipeline</TableHead>
                      <TableHead>Avg Close %</TableHead>
                      <TableHead>Avg Cycle (d)</TableHead>
                      <TableHead>Avg Retention %</TableHead>
                      <TableHead>Offers</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Avg SLA</TableHead>
                      <TableHead>Incidents</TableHead>
                      <TableHead>Meetings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...monthly].reverse().map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">{m.monthLabel}</TableCell>
                        <TableCell>{m.newCustomers}</TableCell>
                        <TableCell>€{(m.pipelineValueAvg / 1000).toFixed(0)}k</TableCell>
                        <TableCell>{m.closeRateAvg}%</TableCell>
                        <TableCell>{m.salesCycleDaysAvg}</TableCell>
                        <TableCell>{m.feedRetentionAvg}%</TableCell>
                        <TableCell>{m.offersSent}</TableCell>
                        <TableCell>{m.ordersReceived}</TableCell>
                        <TableCell>{m.feedSlaScoreAvg}</TableCell>
                        <TableCell>{m.incidentCount}</TableCell>
                        <TableCell>{m.customerMeetings}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

