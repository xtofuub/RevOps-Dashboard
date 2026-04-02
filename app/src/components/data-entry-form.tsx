"use client"

import * as React from "react"
import { IconCirclePlusFilled, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  WeeklyEntry,
  isoWeek,
  mondayOfWeek,
  weekEndFromMonday,
} from "@/lib/revops-data"
import { useRevOps } from "@/lib/revops-context"

function todayMonday() {
  return mondayOfWeek(new Date())
}

const emptyForm = (): Omit<WeeklyEntry, "id" | "week" | "weekStart" | "weekEnd" | "createdAt"> => ({
  newCustomers: 0,
  pipelineValue: 0,
  closeRate: 0,
  salesCycleDays: 0,
  dealLossReason1: "",
  dealLossReason2: "",
  dealLossReason3: "",
  customerRequest1: "",
  customerRequest2: "",
  customerRequest3: "",
  feedRetention: 0,
  offersSent: 0,
  ordersReceived: 0,
  feedSlaScore: 0,
  incidentCount: 0,
  customerMeetings: 0,
  capacityRisks: "",
  q1BlockingDeals: "",
  q2CustomerAsking: "",
  q3EasierClosing: "",
})

export function DataEntryForm() {
  const { pushEntry, entries } = useRevOps()
  const [weekStart, setWeekStart] = React.useState(todayMonday)
  const [form, setForm] = React.useState(emptyForm())
  const [editWeek, setEditWeek] = React.useState<string | null>(null)

  // When weekStart changes, check if we already have data for that week
  React.useEffect(() => {
    const week = isoWeek(new Date(weekStart + "T00:00:00"))
    const existing = entries.find((e) => e.week === week)
    if (existing) {
      setEditWeek(week)
      const { id: _id, week: _w, weekStart: _ws, weekEnd: _we, createdAt: _ca, ...rest } = existing
      setForm(rest)
    } else {
      setEditWeek(null)
      setForm(emptyForm())
    }
  }, [weekStart, entries])

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const week = isoWeek(new Date(weekStart + "T00:00:00"))
    const entry: WeeklyEntry = {
      id: week,
      week,
      weekStart,
      weekEnd: weekEndFromMonday(weekStart),
      createdAt: new Date().toISOString(),
      ...form,
    }
    pushEntry(entry)
    toast.success(`Week ${week} saved!`)
  }

  function numField(
    label: string,
    key: keyof typeof form,
    opts?: { suffix?: string; help?: string }
  ) {
    return (
      <div className="space-y-1">
        <Label htmlFor={key}>{label}{opts?.suffix ? ` (${opts.suffix})` : ""}</Label>
        {opts?.help && <p className="text-xs text-muted-foreground">{opts.help}</p>}
        <Input
          id={key}
          type="number"
          min={0}
          value={(form[key] as number) || ""}
          onChange={(e) => setField(key, Number(e.target.value) as never)}
          placeholder="0"
        />
      </div>
    )
  }

  function textField(label: string, key: keyof typeof form, placeholder?: string) {
    return (
      <div className="space-y-1">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type="text"
          value={(form[key] as string) || ""}
          onChange={(e) => setField(key, e.target.value as never)}
          placeholder={placeholder}
        />
      </div>
    )
  }

  function areaField(label: string, key: keyof typeof form, placeholder?: string) {
    return (
      <div className="space-y-1">
        <Label htmlFor={key}>{label}</Label>
        <Textarea
          id={key}
          value={(form[key] as string) || ""}
          onChange={(e) => setField(key, e.target.value as never)}
          placeholder={placeholder}
          rows={3}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl w-full">
      {/* Week selector */}
      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-0 fill-mode-both">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCirclePlusFilled className="size-5 text-primary" />
            {editWeek ? `Editing ${editWeek}` : "Enter Weekly Data"}
          </CardTitle>
          <CardDescription>
            Select the Monday of the week you are entering data for.
            {editWeek && (
              <span className="ml-2 font-medium text-amber-500">
                Existing entry — saving will overwrite.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="weekStart">Pick any day of the week</Label>
              <Input
                id="weekStart"
                type="date"
                value={weekStart}
                onChange={(e) => {
                  if (!e.target.value) return
                  setWeekStart(mondayOfWeek(new Date(e.target.value + "T00:00:00")))
                }}
                className="w-44"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Week: <strong>{isoWeek(new Date(weekStart + "T00:00:00"))}</strong>
              &nbsp;→&nbsp;ends {weekEndFromMonday(weekStart)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* A) Revenue Engine */}
      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100 fill-mode-both">
        <CardHeader>
          <CardTitle>A) Revenue Engine</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {numField("New Customers", "newCustomers", { help: "Signed this week" })}
          {numField("Pipeline Value", "pipelineValue", { suffix: "€", help: "Total active pipeline" })}
          {numField("Close Rate", "closeRate", { suffix: "%", help: "Win rate on proposals" })}
          {numField("Sales Cycle", "salesCycleDays", { suffix: "days", help: "Avg days to close" })}
        </CardContent>
      </Card>

      {/* B) Product-Market Signal */}
      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200 fill-mode-both">
        <CardHeader>
          <CardTitle>B) Product-Market Signal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {textField("Deal Loss Reason #1", "dealLossReason1", "e.g. Price too high")}
            {textField("Deal Loss Reason #2", "dealLossReason2", "e.g. Competitor chosen")}
            {textField("Deal Loss Reason #3", "dealLossReason3", "e.g. Timing")}
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {textField("Customer Request #1", "customerRequest1", "e.g. API integration")}
            {textField("Customer Request #2", "customerRequest2", "e.g. Custom reporting")}
            {textField("Customer Request #3", "customerRequest3", "e.g. Mobile app")}
            {numField("Feed Retention", "feedRetention", { suffix: "%" })}
          </div>
        </CardContent>
      </Card>

      {/* C) Delivery Stability */}
      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-300 fill-mode-both">
        <CardHeader>
          <CardTitle>C) Delivery Stability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {numField("Offers Sent", "offersSent")}
            {numField("Orders Received", "ordersReceived")}
            {numField("Feed SLA Score", "feedSlaScore", { suffix: "0-100" })}
            {numField("Incident Count", "incidentCount")}
            {numField("Customer Meetings / AM", "customerMeetings")}
            {textField("Capacity Risks", "capacityRisks", "e.g. None / Low / Medium")}
          </div>
        </CardContent>
      </Card>

      {/* OKR Questions */}
      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-[400ms] fill-mode-both">
        <CardHeader>
          <CardTitle>OKR Weekly Questions</CardTitle>
          <CardDescription>
            Ask these in the RevOps OKR meeting and paste answers below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {areaField(
            "1. What prevents you from closing more deals?",
            "q1BlockingDeals",
            "Paste team's answer…"
          )}
          {areaField(
            "2. What do customers repeatedly ask for?",
            "q2CustomerAsking",
            "Paste team's answer…"
          )}
          {areaField(
            "3. What could make closing easier?",
            "q3EasierClosing",
            "Paste team's answer…"
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 delay-500 fill-mode-both">
        <Button
          type="button"
          variant="outline"
          onClick={() => setForm(emptyForm())}
          className="gap-2"
        >
          <IconX className="size-4" />
          Clear
        </Button>
        <Button type="submit" className="gap-2">
          <IconCirclePlusFilled className="size-4" />
          {editWeek ? "Update Week" : "Save Week"}
        </Button>
      </div>
    </form>
  )
}
