"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRevOps } from "@/lib/revops-context"
import {
  CustomFieldDef,
  PRODUCTION_DYNAMIC_FIELD_DEFS,
  WeeklyEntry,
  getMetricValueFromEntry,
  percentChange,
} from "@/lib/revops-data"
import { HolographicCard } from "@/components/ui/holographic-card"

type DynamicMetricDef = CustomFieldDef
type KpiLens = "focus" | "revenue" | "delivery" | "production"

type MetricCard = {
  id: string
  label: string
  value: string
  change: number | null
  subtitle: string
  lenses: KpiLens[]
}

const lensMeta: Record<KpiLens, { title: string; description: string; empty: string }> = {
  focus: {
    title: "Focus",
    description: "Auto-curated: biggest KPI movers this week.",
    empty: "No movement yet. Add more weekly data to build focus insights.",
  },
  revenue: {
    title: "Revenue",
    description: "Acquisition and conversion performance.",
    empty: "No revenue metrics in this lens yet.",
  },
  delivery: {
    title: "Delivery",
    description: "Operational quality, incidents, and customer execution.",
    empty: "No delivery metrics in this lens yet.",
  },
  production: {
    title: "Production",
    description: "Dynamic production indicators from Metric Studio.",
    empty: "No production metrics active. Enable them in Enter Data -> Metric Studio.",
  },
}

function formatEurK(value: number): string {
  const kValue = value / 1000
  const abs = Math.abs(kValue)
  const fractionDigits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2
  const formatted = kValue
    .toFixed(fractionDigits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1")
  return `€${formatted}k`
}

function getDynamicMetricValue(entry: WeeklyEntry, id: string): string | number | undefined {
  return getMetricValueFromEntry(entry, id)
}

function formatChangeLabel(change: number): string {
  const abs = Math.abs(change)
  const decimal = Number.isInteger(abs) ? abs.toString() : abs.toFixed(1)
  return `${change >= 0 ? "+" : "-"}${decimal}%`
}

function formatDynamicMetricValue(value: string | number | undefined, suffix?: string): string {
  if (value === undefined || value === null || value === "") return "-"
  if (typeof value === "number") {
    if (!suffix) return String(value)
    if (suffix === "%") return `${value}%`
    return `${value} ${suffix}`
  }
  return value
}

export function RevOpsKpiCards() {
  const { latestEntry: latest, prevEntry: prev, customFieldDefs, hiddenMetricIds } = useRevOps()
  const [lens, setLens] = React.useState<KpiLens>("revenue")

  if (!latest) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">
          No data yet. Add your first week in the &ldquo;Enter Data&rdquo; tab.
        </p>
      </div>
    )
  }

  const coreMetrics: MetricCard[] = [
    {
      id: "newCustomers",
      label: "New Customers",
      value: latest.newCustomers.toString(),
      change: prev ? percentChange(latest.newCustomers, prev.newCustomers) : null,
      subtitle: "Signed this week",
      lenses: ["revenue"],
    },
    {
      id: "pipelineValue",
      label: "Pipeline Value",
      value: formatEurK(latest.pipelineValue),
      change: prev ? percentChange(latest.pipelineValue, prev.pipelineValue) : null,
      subtitle: "Active pipeline",
      lenses: ["revenue"],
    },
    {
      id: "closeRate",
      label: "Close Rate",
      value: `${latest.closeRate}%`,
      change: prev ? percentChange(latest.closeRate, prev.closeRate) : null,
      subtitle: "Win rate on proposals",
      lenses: ["revenue"],
    },
    {
      id: "salesCycleDays",
      label: "Sales Cycle",
      value: `${latest.salesCycleDays}d`,
      change: prev ? -percentChange(latest.salesCycleDays, prev.salesCycleDays) : null,
      subtitle: "Avg days to close",
      lenses: ["revenue"],
    },
    {
      id: "feedRetention",
      label: "Feed Retention",
      value: `${latest.feedRetention}%`,
      change: prev ? percentChange(latest.feedRetention, prev.feedRetention) : null,
      subtitle: "Customer feed retention",
      lenses: ["delivery"],
    },
    {
      id: "offersToOrders",
      label: "Offers → Orders",
      value: `${latest.offersSent} → ${latest.ordersReceived}`,
      change: prev ? percentChange(latest.ordersReceived, prev.ordersReceived) : null,
      subtitle:
        latest.offersSent > 0
          ? `${Math.round((latest.ordersReceived / latest.offersSent) * 100)}% conversion`
          : "No offers yet",
      lenses: ["delivery"],
    },
    {
      id: "feedSlaScore",
      label: "Feed SLA Score",
      value: latest.feedSlaScore.toString(),
      change: prev ? percentChange(latest.feedSlaScore, prev.feedSlaScore) : null,
      subtitle: "Quality indicator (0-100)",
      lenses: ["delivery"],
    },
    {
      id: "incidents",
      label: "Incidents",
      value: latest.incidentCount.toString(),
      change:
        prev !== null
          ? -percentChange(latest.incidentCount + 1, prev.incidentCount + 1)
          : null,
      subtitle: latest.incidentCount === 0 ? "No incidents" : "Open incidents",
      lenses: ["delivery"],
    },
    {
      id: "customerMeetings",
      label: "Customer Meetings",
      value: latest.customerMeetings.toString(),
      change: prev ? percentChange(latest.customerMeetings, prev.customerMeetings) : null,
      subtitle: "Meetings this week",
      lenses: ["delivery"],
    },
  ]

  const customDynamicMetrics: DynamicMetricDef[] = customFieldDefs
    .filter((d) => !PRODUCTION_DYNAMIC_FIELD_DEFS.some((base) => base.id === d.id) && !hiddenMetricIds.includes(d.id))
    .map((d) => ({ id: d.id, label: d.label, type: d.type, suffix: d.suffix }))

  const visibleProductionMetrics = PRODUCTION_DYNAMIC_FIELD_DEFS.filter(
    (metric) => !hiddenMetricIds.includes(metric.id)
  )

  const dynamicMetrics: MetricCard[] = [...visibleProductionMetrics, ...customDynamicMetrics].map((metric) => {
    const current = getDynamicMetricValue(latest, metric.id)
    const previous = prev ? getDynamicMetricValue(prev, metric.id) : undefined

    const change =
      metric.type === "number" && typeof current === "number" && typeof previous === "number"
        ? percentChange(current, previous)
        : null

    return {
      id: metric.id,
      label: metric.label,
      value: formatDynamicMetricValue(current, metric.suffix),
      change,
      subtitle: "Dynamic production metric",
      lenses: ["production"],
    }
  })

  const allMetrics = [...coreMetrics, ...dynamicMetrics]

  const focusMetrics = (() => {
    const byChange = [...allMetrics]
      .filter((metric) => metric.change !== null)
      .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0))

    const picked: MetricCard[] = []
    const pickedIds = new Set<string>()

    for (const metric of byChange) {
      if (picked.length >= 4) break
      picked.push(metric)
      pickedIds.add(metric.id)
    }

    const fallbackOrder = [
      "pipelineValue",
      "closeRate",
      "feedSlaScore",
      "incidents",
      "newCustomers",
    ]

    for (const id of fallbackOrder) {
      if (picked.length >= 4) break
      if (pickedIds.has(id)) continue
      const metric = allMetrics.find((item) => item.id === id)
      if (!metric) continue
      picked.push(metric)
      pickedIds.add(id)
    }

    return picked
  })()

  const visibleMetrics =
    lens === "focus"
      ? focusMetrics
      : allMetrics.filter((metric) => metric.lenses.includes(lens))

  const topMovers = visibleMetrics
    .filter((metric) => metric.change !== null)
    .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0))
    .slice(0, 3)

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>KPI Command Center</CardTitle>
              <CardDescription>
                {lensMeta[lens].title}: {lensMeta[lens].description}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">{latest.week}</Badge>
          </div>

          <Tabs value={lens} onValueChange={(value) => setLens(value as KpiLens)}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="focus">Focus</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        {topMovers.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {topMovers.map((metric) => (
                <Badge key={`mover-${metric.id}`} variant="outline" className="gap-1.5">
                  {metric.change !== null && metric.change >= 0 ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
                  {metric.label} {metric.change !== null ? formatChangeLabel(metric.change) : ""}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {visibleMetrics.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {visibleMetrics.map((metric) => (
            <HolographicCard key={metric.id} className="h-full">
              <Card className="@container/card h-full">
                <CardHeader>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {metric.value}
                  </CardTitle>
                  {metric.change !== null && (
                    <CardAction>
                      <Badge variant="outline">
                        {metric.change >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                        {formatChangeLabel(metric.change)}
                      </Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">{metric.subtitle}</div>
                  <div className="text-muted-foreground">{latest.week}</div>
                </CardFooter>
              </Card>
            </HolographicCard>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {lensMeta[lens].empty}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

