"use client"

import * as React from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Line, LineChart, XAxis, YAxis,
} from "recharts"
import { format } from "date-fns"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRevOps } from "@/lib/revops-context"
import {
  PRODUCTION_DYNAMIC_FIELD_DEFS,
  WeeklyEntry,
  getMetricValueFromEntry,
} from "@/lib/revops-data"
import { DateRangeFilter, applyDateRange, type DateRange } from "@/components/date-range-filter"

type MetricKey = string
type ChartType = "area" | "bar" | "line"

type MetricOption = { value: MetricKey; label: string; suffix?: string }

const coreMetricOptions: MetricOption[] = [
  { value: "pipelineValue", label: "Pipeline Value (€k)" },
  { value: "closeRate", label: "Close Rate (%)", suffix: "%" },
  { value: "newCustomers", label: "New Customers" },
  { value: "salesCycleDays", label: "Sales Cycle (days)" },
  { value: "feedRetention", label: "Feed Retention (%)", suffix: "%" },
  { value: "offersSent", label: "Offers Sent" },
  { value: "ordersReceived", label: "Orders Received" },
  { value: "incidentCount", label: "Incidents" },
  { value: "customerMeetings", label: "Customer Meetings" },
  { value: "feedSlaScore", label: "Feed SLA Score" },
]

function metricValue(entry: WeeklyEntry, metric: MetricKey): number {
  switch (metric) {
    case "pipelineValue":
      return entry.pipelineValue / 1000
    case "closeRate":
      return entry.closeRate
    case "newCustomers":
      return entry.newCustomers
    case "salesCycleDays":
      return entry.salesCycleDays
    case "feedRetention":
      return entry.feedRetention
    case "offersSent":
      return entry.offersSent
    case "ordersReceived":
      return entry.ordersReceived
    case "incidentCount":
      return entry.incidentCount
    case "customerMeetings":
      return entry.customerMeetings
    case "feedSlaScore":
      return entry.feedSlaScore
    default: {
      const value = getMetricValueFromEntry(entry, metric)
      if (typeof value === "number") return value
      if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
      }
      return 0
    }
  }
}

export function RevOpsCharts() {
  const { entries, customFieldDefs, hiddenMetricIds } = useRevOps()
  const [metric, setMetric] = React.useState<MetricKey>("pipelineValue")
  const [chartType, setChartType] = React.useState<ChartType>("area")
  const [viewMode, setViewMode] = React.useState<"weekly" | "monthly">("weekly")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

  const productionMetricOptions = React.useMemo(
    () =>
      PRODUCTION_DYNAMIC_FIELD_DEFS
        .filter((def) => !hiddenMetricIds.includes(def.id) && def.type === "number")
        .map((def) => ({ value: def.id, label: def.label, suffix: def.suffix })),
    [hiddenMetricIds]
  )

  const customMetricOptions = React.useMemo(
    () =>
      customFieldDefs
        .filter(
          (def) =>
            def.type === "number" &&
            !PRODUCTION_DYNAMIC_FIELD_DEFS.some((base) => base.id === def.id) &&
            !hiddenMetricIds.includes(def.id)
        )
        .map((def) => ({ value: def.id, label: `${def.label} (custom)`, suffix: def.suffix })),
    [customFieldDefs, hiddenMetricIds]
  )

  const metricOptions = React.useMemo(
    () => [...coreMetricOptions, ...productionMetricOptions, ...customMetricOptions],
    [customMetricOptions, productionMetricOptions]
  )

  React.useEffect(() => {
    if (!metricOptions.some((option) => option.value === metric)) {
      setMetric("pipelineValue")
    }
  }, [metricOptions, metric])

  const weeklyData = entries.map((e) => ({ date: e.weekStart, value: metricValue(e, metric) }))
  const monthlyData = React.useMemo(() => {
    const groups = new Map<string, { total: number; count: number }>()
    for (const entry of entries) {
      const month = entry.weekStart.slice(0, 7)
      const current = groups.get(month) ?? { total: 0, count: 0 }
      const value = metricValue(entry, metric)
      groups.set(month, { total: current.total + value, count: current.count + 1 })
    }

    return [...groups.entries()]
      .map(([month, agg]) => ({
        date: `${month}-15`,
        value: Math.round((agg.total / agg.count) * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [entries, metric])

  const allData = viewMode === "weekly" ? weeklyData : monthlyData
  const data = applyDateRange(allData, dateRange)
  const selectedMetric = metricOptions.find((m) => m.value === metric)

  const chartConfig = {
    value: { label: selectedMetric?.label ?? "Value", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const fmtVal = (v: number) => {
    if (metric === "pipelineValue") return `€${v.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")}k`
    if (selectedMetric?.suffix === "%") return `${v}%`
    if (selectedMetric?.suffix) return `${v} ${selectedMetric.suffix}`
    return String(v)
  }

  if (allData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{selectedMetric?.label}</CardTitle></CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
          No data yet.
        </CardContent>
      </Card>
    )
  }

  const sharedAxes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32}
        tickFormatter={(v) => format(new Date(v), "MMM d")} />
      <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={fmtVal} />
      <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")} indicator="dot" />} />
    </>
  )

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{selectedMetric?.label}</CardTitle>
        <CardDescription>{viewMode === "weekly" ? "Weekly" : "Monthly"} trend</CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup type="single" value={chartType} onValueChange={(v) => v && setChartType(v as ChartType)} variant="outline" className="hidden *:data-[slot=toggle-group-item]:px-3! @[600px]/card:flex">
              <ToggleGroupItem value="area">Area</ToggleGroupItem>
              <ToggleGroupItem value="bar">Bar</ToggleGroupItem>
              <ToggleGroupItem value="line">Line</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "weekly" | "monthly")} variant="outline" className="hidden *:data-[slot=toggle-group-item]:px-3! @[600px]/card:flex">
              <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
            </ToggleGroup>
            <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
              <SelectTrigger className="w-48" size="sm"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {metricOptions.map((o) => <SelectItem key={o.value} value={o.value} className="rounded-lg">{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DateRangeFilter range={dateRange} onRangeChange={setDateRange} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          {chartType === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              {sharedAxes}
              <Area dataKey="value" type="natural" fill="url(#fillVal)" stroke="var(--color-value)" />
            </AreaChart>
          ) : chartType === "bar" ? (
            <BarChart data={data}>
              {sharedAxes}
              <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              {sharedAxes}
              <Line dataKey="value" type="natural" stroke="var(--color-value)" strokeWidth={2} dot={{ fill: "var(--color-value)" }} />
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

