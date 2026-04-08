"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRevOps } from "@/lib/revops-context"

export function ProductMarketSignals() {
  const { entries, latestEntry: latest } = useRevOps()

  if (entries.length === 0 || !latest) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <Card><CardHeader><CardTitle>Why Deals Are Lost</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-sm">No data yet.</CardContent></Card>
        <Card><CardHeader><CardTitle>Recurring Customer Requests</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-sm">No data yet.</CardContent></Card>
      </div>
    )
  }

  const reasonCounts = new Map<string, number>()
  const requestCounts = new Map<string, number>()
  for (const e of entries) {
    for (const r of [e.dealLossReason1, e.dealLossReason2, e.dealLossReason3].filter(Boolean)) {
      reasonCounts.set(r, (reasonCounts.get(r) || 0) + 1)
    }
    for (const r of [e.customerRequest1, e.customerRequest2].filter(Boolean)) {
      requestCounts.set(r, (requestCounts.get(r) || 0) + 1)
    }
  }
  const maxR = Math.max(...reasonCounts.values(), 1)
  const maxQ = Math.max(...requestCounts.values(), 1)

  const sortedReasons = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const sortedRequests = [...requestCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Why Deals Are Lost</CardTitle>
          <CardDescription>Aggregated across all weeks — this week: {[latest.dealLossReason1, latest.dealLossReason2, latest.dealLossReason3].filter(Boolean).join(", ") || "—"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedReasons.map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between gap-3">
                <span className="text-sm">{reason}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-chart-2" style={{ width: `${(count / maxR) * 80}px` }} />
                  <Badge variant="secondary" className="tabular-nums">{count}×</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recurring Customer Requests</CardTitle>
          <CardDescription>This week: {[latest.customerRequest1, latest.customerRequest2].filter(Boolean).join(", ") || "—"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedRequests.map(([req, count]) => (
              <div key={req} className="flex items-center justify-between gap-3">
                <span className="text-sm">{req}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-chart-1" style={{ width: `${(count / maxQ) * 80}px` }} />
                  <Badge variant="secondary" className="tabular-nums">{count}×</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

