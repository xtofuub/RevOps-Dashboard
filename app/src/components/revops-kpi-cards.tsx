"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRevOps } from "@/lib/revops-context"
import { percentChange } from "@/lib/revops-data"
import { HolographicCard } from "@/components/ui/holographic-card"

export function RevOpsKpiCards() {
  const { latestEntry: latest, prevEntry: prev } = useRevOps()

  if (!latest) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">
          No data yet. Add your first week in the &ldquo;Enter Data&rdquo; tab.
        </p>
      </div>
    )
  }

  const metrics = [
    {
      label: "New Customers",
      value: latest.newCustomers.toString(),
      change: prev ? percentChange(latest.newCustomers, prev.newCustomers) : null,
      subtitle: "Signed this week",
    },
    {
      label: "Pipeline Value",
      value: `€${(latest.pipelineValue / 1000).toFixed(0)}k`,
      change: prev ? percentChange(latest.pipelineValue, prev.pipelineValue) : null,
      subtitle: "Active pipeline",
    },
    {
      label: "Close Rate",
      value: `${latest.closeRate}%`,
      change: prev ? percentChange(latest.closeRate, prev.closeRate) : null,
      subtitle: "Win rate on proposals",
    },
    {
      label: "Sales Cycle",
      value: `${latest.salesCycleDays}d`,
      change: prev ? -percentChange(latest.salesCycleDays, prev.salesCycleDays) : null,
      subtitle: "Avg days to close",
    },
    {
      label: "Feed Retention",
      value: `${latest.feedRetention}%`,
      change: prev ? percentChange(latest.feedRetention, prev.feedRetention) : null,
      subtitle: "Customer feed retention",
    },
    {
      label: "Offers → Orders",
      value: `${latest.offersSent} → ${latest.ordersReceived}`,
      change: prev ? percentChange(latest.ordersReceived, prev.ordersReceived) : null,
      subtitle:
        latest.offersSent > 0
          ? `${Math.round((latest.ordersReceived / latest.offersSent) * 100)}% conversion`
          : "No offers yet",
    },
    {
      label: "Feed SLA Score",
      value: latest.feedSlaScore.toString(),
      change: prev ? percentChange(latest.feedSlaScore, prev.feedSlaScore) : null,
      subtitle: "Quality indicator (0-100)",
    },
    {
      label: "Incidents",
      value: latest.incidentCount.toString(),
      change:
        prev !== null
          ? -percentChange(latest.incidentCount + 1, prev.incidentCount + 1)
          : null,
      subtitle: latest.incidentCount === 0 ? "No incidents" : "Open incidents",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {metrics.map((metric) => (
        <HolographicCard key={metric.label}>
          <Card className="@container/card border-0 bg-card/80 backdrop-blur-sm w-full">
          <CardHeader>
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metric.value}
            </CardTitle>
            {metric.change !== null && (
              <CardAction>
                <Badge variant="outline">
                  {metric.change >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {metric.change >= 0 ? "+" : ""}
                  {metric.change}%
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {metric.subtitle}
            </div>
            <div className="text-muted-foreground">{latest.week}</div>
          </CardFooter>
          </Card>
        </HolographicCard>
      ))}
    </div>
  )
}

