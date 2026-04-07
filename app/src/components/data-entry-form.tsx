"use client"

import * as React from "react"
import { IconCirclePlusFilled, IconTrash, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CustomFieldDef,
  PRODUCTION_DYNAMIC_FIELD_DEFS,
  WeeklyEntry,
  isoWeek,
  mondayOfWeek,
  weekEndFromMonday,
} from "@/lib/revops-data"
import { useRevOps } from "@/lib/revops-context"

type FormState = Omit<WeeklyEntry, "id" | "week" | "weekStart" | "weekEnd" | "createdAt">
type MetricType = CustomFieldDef["type"]
type MetricTemplate = Pick<CustomFieldDef, "label" | "type" | "suffix"> & { id?: string }
type MetricDraft = { label: string; type: MetricType; suffix: string }

const suffixOptions = [
  { value: "none", label: "No suffix" },
  { value: "%", label: "%" },
  { value: "h", label: "hours" },
  { value: "min", label: "minutes" },
  { value: "EUR", label: "EUR" },
  { value: "count", label: "count" },
]

const productionFieldKeyMap: Record<string, keyof FormState> = {
  approvedIndicators: "approvedIndicators",
  jrAnalystIndicators: "jrAnalystIndicators",
  usbGuardBreakCount: "usbGuardBreakCount",
  usbGuardUsage: "usbGuardUsage",
  otherProductsUsage: "otherProductsUsage",
}

const smartMetricTemplates: MetricTemplate[] = [
  { label: "Production Uptime", type: "number", suffix: "%" },
  { label: "MTTR", type: "number", suffix: "h" },
  { label: "Critical Alerts", type: "number" },
  { label: "USB Active Users", type: "number" },
  { label: "Onboarding Completion", type: "number", suffix: "%" },
  { label: "Top Incident Theme", type: "text" },
]

function createFieldId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function isProductionMetric(id: string) {
  return PRODUCTION_DYNAMIC_FIELD_DEFS.some((field) => field.id === id)
}

function todayMonday() {
  return mondayOfWeek(new Date())
}

const emptyForm = (): FormState => ({
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
  approvedIndicators: 0,
  jrAnalystIndicators: 0,
  usbGuardBreakCount: 0,
  usbGuardUsage: 0,
  otherProductsUsage: 0,
  customFields: {},
})

export function DataEntryForm() {
  const {
    pushEntry,
    entries,
    customFieldDefs,
    addCustomFieldDef,
    updateCustomFieldDef,
    removeCustomFieldDef,
    hiddenMetricIds,
    setMetricVisibility,
  } = useRevOps()

  const [weekStart, setWeekStart] = React.useState(todayMonday)
  const [form, setForm] = React.useState(emptyForm())
  const [editWeek, setEditWeek] = React.useState<string | null>(null)

  const [newFieldLabel, setNewFieldLabel] = React.useState("")
  const [newFieldType, setNewFieldType] = React.useState<MetricType>("number")
  const [newFieldSuffix, setNewFieldSuffix] = React.useState("none")
  const [metricDrafts, setMetricDrafts] = React.useState<Record<string, MetricDraft>>({})

  const safeCustomFieldDefs = React.useMemo(
    () => customFieldDefs.filter((def) => !isProductionMetric(def.id)),
    [customFieldDefs]
  )
  const hiddenSet = React.useMemo(() => new Set(hiddenMetricIds), [hiddenMetricIds])
  const allMetricDefs = React.useMemo(
    () => [...PRODUCTION_DYNAMIC_FIELD_DEFS, ...safeCustomFieldDefs],
    [safeCustomFieldDefs]
  )
  const visibleMetricDefs = React.useMemo(
    () => allMetricDefs.filter((def) => !hiddenSet.has(def.id)),
    [allMetricDefs, hiddenSet]
  )
  const hiddenMetricDefs = React.useMemo(
    () => allMetricDefs.filter((def) => hiddenSet.has(def.id)),
    [allMetricDefs, hiddenSet]
  )
  const hiddenExampleDefs = React.useMemo(
    () => PRODUCTION_DYNAMIC_FIELD_DEFS.filter((def) => hiddenSet.has(def.id)),
    [hiddenSet]
  )

  React.useEffect(() => {
    const next: Record<string, MetricDraft> = {}
    for (const def of safeCustomFieldDefs) {
      next[def.id] = {
        label: def.label,
        type: def.type,
        suffix: def.suffix ?? "none",
      }
    }
    setMetricDrafts(next)
  }, [safeCustomFieldDefs])

  React.useEffect(() => {
    const week = isoWeek(new Date(weekStart + "T00:00:00"))
    const existing = entries.find((entry) => entry.week === week)
    if (existing) {
      setEditWeek(week)
      const {
        id: _id,
        week: _week,
        weekStart: _weekStart,
        weekEnd: _weekEnd,
        createdAt: _createdAt,
        ...rest
      } = existing
      setForm({ ...emptyForm(), ...rest })
      return
    }

    setEditWeek(null)
    setForm(emptyForm())
  }, [weekStart, entries])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setCustomField(fieldId: string, value: string | number) {
    setForm((prev) => {
      const existing = prev.customFields ?? {}
      return {
        ...prev,
        customFields: { ...existing, [fieldId]: value },
      }
    })
  }

  function setMetricDraft(metricId: string, patch: Partial<MetricDraft>) {
    setMetricDrafts((prev) => {
      const current =
        prev[metricId] ??
        {
          label: safeCustomFieldDefs.find((def) => def.id === metricId)?.label ?? "",
          type: safeCustomFieldDefs.find((def) => def.id === metricId)?.type ?? "text",
          suffix: safeCustomFieldDefs.find((def) => def.id === metricId)?.suffix ?? "none",
        }
      return {
        ...prev,
        [metricId]: { ...current, ...patch },
      }
    })
  }

  function getMetricSuffixValue(rawSuffix?: string) {
    return rawSuffix ? rawSuffix : "none"
  }

  function handleAddCustomField() {
    const label = newFieldLabel.trim()
    if (!label) {
      toast.error("Give the metric a name first.")
      return
    }

    const id = createFieldId(label)
    if (!id) {
      toast.error("Use letters and numbers in the metric name.")
      return
    }

    if (allMetricDefs.some((field) => field.id === id)) {
      setMetricVisibility(id, true)
      toast.message("Metric already exists. Restored visibility.")
      return
    }

    addCustomFieldDef({
      id,
      label,
      type: newFieldType,
      suffix: newFieldSuffix === "none" ? undefined : newFieldSuffix,
    })
    setMetricVisibility(id, true)
    setNewFieldLabel("")
    setNewFieldType("number")
    setNewFieldSuffix("none")
    toast.success(`Added metric "${label}".`)
  }

  function handleAddTemplateField(template: MetricTemplate) {
    const id = template.id ?? createFieldId(template.label)
    if (!id) return

    if (isProductionMetric(id) || safeCustomFieldDefs.some((field) => field.id === id)) {
      setMetricVisibility(id, true)
      toast.success(`Enabled metric "${template.label}".`)
      return
    }

    addCustomFieldDef({
      id,
      label: template.label,
      type: template.type,
      suffix: template.suffix,
    })
    setMetricVisibility(id, true)
    toast.success(`Added metric "${template.label}" from template.`)
  }

  function handleSaveCustomMetric(metricId: string) {
    const draft = metricDrafts[metricId]
    if (!draft) return

    const label = draft.label.trim()
    if (!label) {
      toast.error("Metric label cannot be empty.")
      return
    }

    updateCustomFieldDef({
      id: metricId,
      label,
      type: draft.type,
      suffix: draft.suffix === "none" ? undefined : draft.suffix,
    })
    toast.success(`Saved changes for "${label}".`)
  }

  function handleDeleteCustomMetric(def: CustomFieldDef) {
    removeCustomFieldDef(def.id)
    toast.success(`Deleted metric "${def.label}" and removed saved values.`)
  }

  function getDynamicMetricValue(def: CustomFieldDef): string | number {
    const mappedKey = productionFieldKeyMap[def.id]
    if (mappedKey) {
      const value = form[mappedKey]
      if (typeof value === "number" || typeof value === "string") return value
      return ""
    }
    return form.customFields?.[def.id] ?? ""
  }

  function setDynamicMetricValue(def: CustomFieldDef, value: string | number) {
    const mappedKey = productionFieldKeyMap[def.id]
    if (mappedKey) {
      setField(mappedKey, value as FormState[typeof mappedKey])
      return
    }
    setCustomField(def.id, value)
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
    toast.success(`Week ${week} saved.`)
  }

  function numField(label: string, key: keyof FormState, opts?: { suffix?: string; help?: string }) {
    return (
      <div className="space-y-1">
        <Label htmlFor={key}>{label}{opts?.suffix ? ` (${opts.suffix})` : ""}</Label>
        {opts?.help && <p className="text-xs text-muted-foreground">{opts.help}</p>}
        <Input
          id={key}
          type="number"
          min={0}
          value={(form[key] as number | undefined) ?? ""}
          onChange={(e) => setField(key, (e.target.value === "" ? 0 : Number(e.target.value)) as never)}
          placeholder="0"
        />
      </div>
    )
  }

  function textField(label: string, key: keyof FormState, placeholder?: string) {
    return (
      <div className="space-y-1">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type="text"
          value={(form[key] as string | undefined) ?? ""}
          onChange={(e) => setField(key, e.target.value as never)}
          placeholder={placeholder}
        />
      </div>
    )
  }

  function areaField(label: string, key: keyof FormState, placeholder?: string) {
    return (
      <div className="space-y-1">
        <Label htmlFor={key}>{label}</Label>
        <Textarea
          id={key}
          value={(form[key] as string | undefined) ?? ""}
          onChange={(e) => setField(key, e.target.value as never)}
          placeholder={placeholder}
          rows={3}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl w-full">
      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-0 fill-mode-both">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCirclePlusFilled className="size-5 text-primary" />
            {editWeek ? `Editing ${editWeek}` : "Enter Weekly Data"}
          </CardTitle>
          <CardDescription>
            Pick any date in the week. The form snaps to Monday.
            {editWeek && (
              <span className="ml-2 font-medium text-amber-500">
                Existing entry found. Saving will overwrite that week.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="weekStart">Week date</Label>
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
              &nbsp;to&nbsp;{weekEndFromMonday(weekStart)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100 fill-mode-both">
        <CardHeader>
          <CardTitle>A) Revenue Engine</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {numField("New Customers", "newCustomers", { help: "Signed this week" })}
          {numField("Pipeline Value", "pipelineValue", { suffix: "EUR", help: "Total active pipeline" })}
          {numField("Close Rate", "closeRate", { suffix: "%", help: "Win rate on proposals" })}
          {numField("Sales Cycle", "salesCycleDays", { suffix: "days", help: "Average days to close" })}
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200 fill-mode-both">
        <CardHeader>
          <CardTitle>B) Product-Market Signal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {textField("Deal Loss Reason #1", "dealLossReason1", "Example: Price too high")}
            {textField("Deal Loss Reason #2", "dealLossReason2", "Example: Competitor chosen")}
            {textField("Deal Loss Reason #3", "dealLossReason3", "Example: Timing")}
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {textField("Customer Request #1", "customerRequest1", "Example: API integration")}
            {textField("Customer Request #2", "customerRequest2", "Example: Custom reporting")}
            {textField("Customer Request #3", "customerRequest3", "Example: Mobile app")}
            {numField("Feed Retention", "feedRetention", { suffix: "%" })}
          </div>
        </CardContent>
      </Card>

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
            {numField("Customer Meetings", "customerMeetings")}
            {textField("Capacity Risks", "capacityRisks", "Example: None / Low / Medium")}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-[320ms] fill-mode-both">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>D) Dynamic Metrics Wall</CardTitle>
            <CardDescription>
              Active metrics you are currently tracking this week.
            </CardDescription>
          </div>
          <Badge variant="secondary">{visibleMetricDefs.length} active</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleMetricDefs.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleMetricDefs.map((def) => {
                const isCore = isProductionMetric(def.id)
                const value = getDynamicMetricValue(def)
                return (
                  <Card key={def.id}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{def.label}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={isCore ? "secondary" : "outline"} className="text-[10px]">
                            {isCore ? "example" : "custom"}
                          </Badge>
                          {def.suffix && <Badge variant="outline" className="text-[10px]">{def.suffix}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setMetricVisibility(def.id, false)}
                          title="Hide metric"
                        >
                          <IconX className="size-3.5" />
                        </Button>
                        {!isCore && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            onClick={() => handleDeleteCustomMetric(def)}
                            title="Delete metric"
                          >
                            <IconTrash className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Input
                        id={def.id}
                        type={def.type}
                        min={def.type === "number" ? 0 : undefined}
                        value={
                          def.type === "number"
                            ? ((value as number | undefined) ?? "")
                            : ((value as string | undefined) ?? "")
                        }
                        onChange={(e) =>
                          setDynamicMetricValue(
                            def,
                            def.type === "number"
                              ? (e.target.value === "" ? 0 : Number(e.target.value))
                              : e.target.value
                          )
                        }
                        placeholder={def.type === "number" ? "0" : "Write value"}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                No active dynamic metrics yet. Open Metric Studio to enable examples or create your own.
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-[360ms] fill-mode-both">
        <CardHeader>
          <CardTitle>E) Metric Studio</CardTitle>
          <CardDescription>
            Add, edit, hide, restore, and delete metrics with a user-friendly manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-5 pt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Optional production examples</CardTitle>
                </CardHeader>
                <CardContent>
                  {hiddenExampleDefs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hiddenExampleDefs.map((def) => (
                        <Button
                          key={def.id}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddTemplateField({ id: def.id, label: def.label, type: def.type, suffix: def.suffix })}
                        >
                          Add {def.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">All example metrics are already active.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Suggested templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {smartMetricTemplates.map((template) => (
                      <Button
                        key={template.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTemplateField(template)}
                      >
                        + {template.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Create custom metric</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <div className="space-y-1 md:col-span-6">
                    <Label>Metric name</Label>
                    <Input
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Example: Deployment Success"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label>Type</Label>
                    <Select value={newFieldType} onValueChange={(value) => setNewFieldType(value as MetricType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label>Suffix</Label>
                    <Select value={newFieldSuffix} onValueChange={setNewFieldSuffix}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {suffixOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Button type="button" onClick={handleAddCustomField} className="w-full">
                      <IconCirclePlusFilled className="mr-2 size-4" />
                      Add
                    </Button>
                  </div>
                </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customize" className="space-y-4 pt-4">
              {safeCustomFieldDefs.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Suffix</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeCustomFieldDefs.map((def) => {
                        const draft = metricDrafts[def.id] ?? {
                          label: def.label,
                          type: def.type,
                          suffix: getMetricSuffixValue(def.suffix),
                        }
                        const isVisible = !hiddenSet.has(def.id)
                        return (
                          <TableRow key={def.id}>
                            <TableCell className="min-w-52">
                              <Input
                                value={draft.label}
                                onChange={(e) => setMetricDraft(def.id, { label: e.target.value })}
                              />
                            </TableCell>
                            <TableCell className="min-w-36">
                              <Select
                                value={draft.type}
                                onValueChange={(value) => setMetricDraft(def.id, { type: value as MetricType })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="text">Text</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="min-w-36">
                              <Select
                                value={draft.suffix}
                                onValueChange={(value) => setMetricDraft(def.id, { suffix: value })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {suffixOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant={isVisible ? "secondary" : "outline"}>
                                {isVisible ? "Visible" : "Hidden"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSaveCustomMetric(def.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setMetricVisibility(def.id, !isVisible)}
                                >
                                  {isVisible ? "Hide" : "Show"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteCustomMetric(def)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  No custom metrics yet. Create one in the Create tab.
                </div>
              )}
            </TabsContent>

            <TabsContent value="visibility" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Visible ({visibleMetricDefs.length})</CardTitle>
                    {visibleMetricDefs.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => visibleMetricDefs.forEach((def) => setMetricVisibility(def.id, false))}
                      >
                        Hide all
                      </Button>
                    )}
                    </div>
                  </CardHeader>
                  <CardContent>

                  {visibleMetricDefs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {visibleMetricDefs.map((def) => (
                        <Button
                          key={def.id}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setMetricVisibility(def.id, false)}
                        >
                          Hide {def.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No visible metrics.</p>
                  )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Hidden ({hiddenMetricDefs.length})</CardTitle>
                    {hiddenMetricDefs.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => hiddenMetricDefs.forEach((def) => setMetricVisibility(def.id, true))}
                      >
                        Restore all
                      </Button>
                    )}
                    </div>
                  </CardHeader>
                  <CardContent>

                  {hiddenMetricDefs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hiddenMetricDefs.map((def) => (
                        <Button
                          key={def.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMetricVisibility(def.id, true)}
                        >
                          Restore {def.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No hidden metrics.</p>
                  )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-[420ms] fill-mode-both">
        <CardHeader>
          <CardTitle>OKR Weekly Questions</CardTitle>
          <CardDescription>Paste the latest meeting answers here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {areaField(
            "1. What prevents closing more deals?",
            "q1BlockingDeals",
            "Paste team answer"
          )}
          {areaField(
            "2. What do customers repeatedly ask for?",
            "q2CustomerAsking",
            "Paste team answer"
          )}
          {areaField(
            "3. What would make closing easier?",
            "q3EasierClosing",
            "Paste team answer"
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 delay-500 fill-mode-both">
        <Button
          type="button"
          variant="outline"
          onClick={() => setForm(emptyForm())}
          className="gap-2"
        >
          <IconX className="size-4" />
          Clear Form
        </Button>

        <Button type="submit" className="gap-2">
          <IconCirclePlusFilled className="size-4" />
          {editWeek ? "Update Week" : "Save Week"}
        </Button>
      </div>
    </form>
  )
}
