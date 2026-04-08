"use client"

import * as React from "react"
import { IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  CustomFieldDef,
  PRODUCTION_DYNAMIC_FIELD_DEFS,
  WeeklyEntry,
  getMetricValueFromEntry,
} from "@/lib/revops-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRevOps } from "@/lib/revops-context"

type DynamicColumn = CustomFieldDef

const productionMetricKeyMap: Record<string, keyof WeeklyEntry> = {
  approvedIndicators: "approvedIndicators",
  jrAnalystIndicators: "jrAnalystIndicators",
  usbGuardBreakCount: "usbGuardBreakCount",
  usbGuardUsage: "usbGuardUsage",
  otherProductsUsage: "otherProductsUsage",
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

function parseNumericInput(value: string): number {
  if (value.trim() === "") return 0

  let normalized = value.trim().replace(/\s/g, "").replace(/€/g, "").toLowerCase()
  let multiplier = 1

  if (normalized.endsWith("k")) {
    multiplier = 1000
    normalized = normalized.slice(0, -1)
  } else if (normalized.endsWith("m")) {
    multiplier = 1_000_000
    normalized = normalized.slice(0, -1)
  }

  if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(",", ".")
  }
  normalized = normalized.replace(/,/g, "")

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed * multiplier : 0
}

function parsePipelineInputInK(value: string): number {
  const parsedK = parseNumericInput(value)
  return parsedK * 1000
}

function pipelineInputInK(value: number): string {
  const kValue = value / 1000
  if (!Number.isFinite(kValue)) return ""
  return kValue
    .toFixed(2)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1")
}

function formatValueWithSuffix(value: number, suffix?: string): string {
  if (!suffix) return String(value)
  if (suffix === "%") return `${value}%`
  return `${value} ${suffix}`
}

function formatDynamicValue(entry: WeeklyEntry, column: DynamicColumn): string {
  const value = getMetricValueFromEntry(entry, column.id)
  if (value === undefined || value === null || value === "") return "-"
  if (typeof value === "number") return formatValueWithSuffix(value, column.suffix)
  return value
}

function getDynamicInputValue(entry: WeeklyEntry, column: DynamicColumn): string | number {
  const value = getMetricValueFromEntry(entry, column.id)
  if (column.type === "number") {
    if (typeof value === "number") return value
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : ""
    }
    return ""
  }
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function setPipelineValueFromK(entry: WeeklyEntry, rawValue: string): WeeklyEntry {
  return {
    ...entry,
    pipelineValue: parsePipelineInputInK(rawValue),
  }
}

export function RevOpsWeeklyTable() {
  const {
    entries,
    monthly,
    removeEntry,
    pushEntry,
    customFieldDefs,
    hiddenMetricIds,
    removeCustomFieldDef,
    setMetricVisibility,
  } = useRevOps()
  const hiddenSet = new Set(hiddenMetricIds)
  const productionColumns = PRODUCTION_DYNAMIC_FIELD_DEFS.filter((d) => !hiddenSet.has(d.id))
  const customColumns: DynamicColumn[] = customFieldDefs
    .filter((d) => !PRODUCTION_DYNAMIC_FIELD_DEFS.some((base) => base.id === d.id) && !hiddenSet.has(d.id))
    .map((d) => ({ id: d.id, label: d.label, type: d.type, suffix: d.suffix }))
  const dynamicColumns = [...productionColumns, ...customColumns]

  const [editingWeek, setEditingWeek] = React.useState<string | null>(null)
  const [editingEntry, setEditingEntry] = React.useState<WeeklyEntry | null>(null)

  function startEdit(entry: WeeklyEntry) {
    setEditingWeek(entry.week)
    setEditingEntry({ ...entry, customFields: { ...(entry.customFields ?? {}) } })
  }

  function cancelEdit() {
    setEditingWeek(null)
    setEditingEntry(null)
  }

  function setEditingNumber<K extends keyof WeeklyEntry>(key: K, rawValue: string) {
    setEditingEntry((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [key]: parseNumericInput(rawValue) as WeeklyEntry[K],
      }
    })
  }

  function setEditingDynamic(column: DynamicColumn, rawValue: string) {
    const mappedKey = productionMetricKeyMap[column.id]
    if (mappedKey) {
      setEditingNumber(mappedKey, rawValue)
      return
    }

    setEditingEntry((prev) => {
      if (!prev) return prev
      const nextCustomFields = { ...(prev.customFields ?? {}) }
      if (column.type === "number") {
        nextCustomFields[column.id] = parseNumericInput(rawValue)
      } else {
        nextCustomFields[column.id] = rawValue
      }
      return {
        ...prev,
        customFields: nextCustomFields,
      }
    })
  }

  function saveEdit() {
    if (!editingEntry) return
    pushEntry(editingEntry)
    toast.success(`Updated ${editingEntry.week}.`)
    setEditingWeek(null)
    setEditingEntry(null)
  }

  function deleteCategory(column: DynamicColumn) {
    const isProductionCategory = PRODUCTION_DYNAMIC_FIELD_DEFS.some((metric) => metric.id === column.id)

    if (isProductionCategory) {
      const ok = window.confirm(
        `Hide category \"${column.label}\" from table and overview? You can restore it in Enter Data -> Metric Studio.`
      )
      if (!ok) return
      setMetricVisibility(column.id, false)
      toast.success(`Hidden ${column.label}.`)
      return
    }

    const ok = window.confirm(
      `Delete category \"${column.label}\" and all its saved values? This cannot be undone.`
    )
    if (!ok) return
    removeCustomFieldDef(column.id)
    toast.success(`Deleted ${column.label}.`)
  }

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
                      <TableHead>Pipeline (€k)</TableHead>
                      <TableHead>Close %</TableHead>
                      <TableHead>Cycle (d)</TableHead>
                      <TableHead>Retention %</TableHead>
                      <TableHead>Offers</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Incidents</TableHead>
                      <TableHead>Meetings</TableHead>
                      {dynamicColumns.map((column) => (
                        <TableHead key={column.id}>
                          <div className="flex items-center gap-1">
                            <span>{column.label}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-6"
                              aria-label={`Delete ${column.label} category`}
                              onClick={() => deleteCategory(column)}
                            >
                              <IconTrash className="size-3.5" />
                            </Button>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...entries].reverse().map((w) => {
                      const isEditing = editingWeek === w.week && editingEntry !== null
                      const row = isEditing ? editingEntry : w

                      return (
                        <TableRow key={w.week}>
                          <TableCell className="font-medium">{w.week}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.newCustomers}
                                onChange={(e) => setEditingNumber("newCustomers", e.target.value)}
                              />
                            ) : (
                              w.newCustomers
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                className="h-8 w-28"
                                value={pipelineInputInK(row.pipelineValue)}
                                onChange={(e) =>
                                  setEditingEntry((prev) =>
                                    prev ? setPipelineValueFromK(prev, e.target.value) : prev
                                  )
                                }
                              />
                            ) : (
                              formatEurK(w.pipelineValue)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.closeRate}
                                onChange={(e) => setEditingNumber("closeRate", e.target.value)}
                              />
                            ) : (
                              `${w.closeRate}%`
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.salesCycleDays}
                                onChange={(e) => setEditingNumber("salesCycleDays", e.target.value)}
                              />
                            ) : (
                              w.salesCycleDays
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.feedRetention}
                                onChange={(e) => setEditingNumber("feedRetention", e.target.value)}
                              />
                            ) : (
                              `${w.feedRetention}%`
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.offersSent}
                                onChange={(e) => setEditingNumber("offersSent", e.target.value)}
                              />
                            ) : (
                              w.offersSent
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.ordersReceived}
                                onChange={(e) => setEditingNumber("ordersReceived", e.target.value)}
                              />
                            ) : (
                              w.ordersReceived
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.feedSlaScore}
                                onChange={(e) => setEditingNumber("feedSlaScore", e.target.value)}
                              />
                            ) : (
                              w.feedSlaScore
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.incidentCount}
                                onChange={(e) => setEditingNumber("incidentCount", e.target.value)}
                              />
                            ) : (
                              <Badge variant={w.incidentCount === 0 ? "secondary" : "destructive"}>{w.incidentCount}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-20"
                                value={row.customerMeetings}
                                onChange={(e) => setEditingNumber("customerMeetings", e.target.value)}
                              />
                            ) : (
                              w.customerMeetings
                            )}
                          </TableCell>
                          {dynamicColumns.map((column) => (
                            <TableCell key={`${w.week}-${column.id}`}>
                              {isEditing ? (
                                <Input
                                  type={column.type === "number" ? "number" : "text"}
                                  min={column.type === "number" ? 0 : undefined}
                                  className="h-8 w-28"
                                  value={getDynamicInputValue(row, column)}
                                  onChange={(e) => setEditingDynamic(column, e.target.value)}
                                />
                              ) : (
                                formatDynamicValue(w, column)
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Button size="sm" onClick={saveEdit}>Save</Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" onClick={() => startEdit(w)}>
                                  Edit
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => removeEntry(w.week)} aria-label="Delete">
                                  <IconTrash className="size-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
                      <TableHead>Avg Pipeline (€k)</TableHead>
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
                        <TableCell>{formatEurK(m.pipelineValueAvg)}</TableCell>
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

