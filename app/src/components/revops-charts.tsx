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
import { DateRangeFilter, applyDateRange, type DateRange } from "@/components/date-range-filter"

type MetricKey = "pipelineValue" | "closeRate" | "newCustomers" | "salesCycleDays" | "feedRetention" | "offersSent" | "ordersReceived" | "incidentCount" | "customerMeetings" | "feedSlaScore"
type ChartType = "area" | "bar" | "line"

const metricOptions: { value: MetricKey; label: string }[] = [
  { value: "pipelineValue", label: "Pipeline Value (€)" },
  { value: "closeRate", label: "Close Rate (%)" },
  { value: "newCustomers", label: "New Customers" },
  { value: "salesCycleDays", label: "Sales Cycle (days)" },
  { value: "feedRetention", label: "Feed Retention (%)" },
  { value: "offersSent", label: "Offers Sent" },
  { value: "ordersReceived", label: "Orders Received" },
  { value: "incidentCount", label: "Incidents" },
  { value: "customerMeetings", label: "Customer Meetings" },
  { value: "feedSlaScore", label: "Feed SLA Score" },
]

export function RevOpsCharts() {
  const { entries, monthly } = useRevOps()
  const [metric, setMetric] = React.useState<MetricKey>("pipelineValue")
  const [chartType, setChartType] = React.useState<ChartType>("area")
  const [viewMode, setViewMode] = React.useState<"weekly" | "monthly">("weekly")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

  const weeklyData = entries.map((e) => ({ date: e.weekStart, value: e[metric] as number }))
  const monthlyData = monthly.map((m) => ({
    date: m.month + "-15",
    value: ({
      pipelineValue: m.pipelineValueAvg,
      closeRate: m.closeRateAvg,
      newCustomers: m.newCustomers,
      salesCycleDays: m.salesCycleDaysAvg,
      feedRetention: m.feedRetentionAvg,
      offersSent: m.offersSent,
      ordersReceived: m.ordersReceived,
      incidentCount: m.incidentCount,
      customerMeetings: m.customerMeetings,
      feedSlaScore: m.feedSlaScoreAvg,
    }[metric]),
  }))

  const allData = viewMode === "weekly" ? weeklyData : monthlyData
  const data = applyDateRange(allData, dateRange)
  const selectedMetric = metricOptions.find((m) => m.value === metric)

  const chartConfig = {
    value: { label: selectedMetric?.label ?? "Value", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const fmtVal = (v: number) => {
    if (metric === "pipelineValue") return `€${(v / 1000).toFixed(0)}k`
    if (metric === "closeRate" || metric === "feedRetention") return `${v}%`
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

