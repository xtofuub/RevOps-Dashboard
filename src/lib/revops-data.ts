// RevOps Dashboard — Data types & localStorage utilities
// Zero initial data. Users push entries via the form.

export interface WeeklyEntry {
  id: string           // "2026-W11"
  week: string         // "2026-W11"
  weekStart: string    // "2026-03-09"
  weekEnd: string      // "2026-03-15"
  createdAt: string    // ISO timestamp

  // A) Revenue Engine
  newCustomers: number
  pipelineValue: number
  closeRate: number
  salesCycleDays: number

  // B) Product-Market Signal
  dealLossReason1: string
  dealLossReason2: string
  dealLossReason3: string
  customerRequest1: string
  customerRequest2: string
  customerRequest3: string
  feedRetention: number

  // C) Delivery Stability
  offersSent: number
  ordersReceived: number
  feedSlaScore: number
  incidentCount: number
  customerMeetings: number
  capacityRisks: string

  // D) Production Data & Dynamic Metrics
  approvedIndicators?: number
  jrAnalystIndicators?: number
  usbGuardBreakCount?: number
  usbGuardUsage?: number
  otherProductsUsage?: number

  // Dynamic Custom Fields mapping
  customFields?: Record<string, string | number>

  // OKR Weekly Questions
  q1BlockingDeals: string
  q2CustomerAsking: string
  q3EasierClosing: string
}

export interface MonthlyRollup {
  month: string
  monthLabel: string
  newCustomers: number
  pipelineValueAvg: number
  closeRateAvg: number
  salesCycleDaysAvg: number
  feedRetentionAvg: number
  offersSent: number
  ordersReceived: number
  feedSlaScoreAvg: number
  incidentCount: number
  customerMeetings: number
  weeksCount: number
}

const STORAGE_KEY = "revops_weekly_entries"
const CUSTOM_FIELDS_KEY = "revops_custom_fields"
const HIDDEN_METRICS_KEY = "revops_hidden_metrics"

export interface CustomFieldDef {
  id: string
  label: string
  type: "number" | "text"
  suffix?: string
}

export const PRODUCTION_DYNAMIC_FIELD_DEFS: CustomFieldDef[] = [
  { id: "approvedIndicators", label: "Approved Indicators", type: "number" },
  { id: "jrAnalystIndicators", label: "JR Analyst Indicators", type: "number" },
  { id: "usbGuardBreakCount", label: "USB-guard Break Count", type: "number" },
  { id: "usbGuardUsage", label: "USB-guard Usage", type: "number", suffix: "%" },
  { id: "otherProductsUsage", label: "Other Products Usage", type: "number", suffix: "%" },
]

export const MOCK_ENTRIES: WeeklyEntry[] = [
  {
    id: "2026-W01", week: "2026-W01", weekStart: "2026-01-05", weekEnd: "2026-01-11",
    createdAt: "2026-01-11T18:00:00Z",
    newCustomers: 3, pipelineValue: 84000, closeRate: 22, salesCycleDays: 38,
    dealLossReason1: "Price too high", dealLossReason2: "Went with competitor", dealLossReason3: "",
    customerRequest1: "API integration", customerRequest2: "Custom reporting", customerRequest3: "",
    feedRetention: 91, offersSent: 14, ordersReceived: 9, feedSlaScore: 97, incidentCount: 1,
    customerMeetings: 8, capacityRisks: "None",
    approvedIndicators: 128, jrAnalystIndicators: 176, usbGuardBreakCount: 3, usbGuardUsage: 62, otherProductsUsage: 48,
    q1BlockingDeals: "Two deals stalled waiting for procurement sign-off.",
    q2CustomerAsking: "Better feed filtering options.",
    q3EasierClosing: "Faster onboarding demo would help.",
  },
  {
    id: "2026-W02", week: "2026-W02", weekStart: "2026-01-12", weekEnd: "2026-01-18",
    createdAt: "2026-01-18T18:00:00Z",
    newCustomers: 4, pipelineValue: 91000, closeRate: 25, salesCycleDays: 35,
    dealLossReason1: "Price too high", dealLossReason2: "Feature gap", dealLossReason3: "",
    customerRequest1: "API integration", customerRequest2: "Bulk export", customerRequest3: "",
    feedRetention: 92, offersSent: 16, ordersReceived: 11, feedSlaScore: 98, incidentCount: 0,
    customerMeetings: 10, capacityRisks: "None",
    approvedIndicators: 132, jrAnalystIndicators: 183, usbGuardBreakCount: 2, usbGuardUsage: 64, otherProductsUsage: 50,
    q1BlockingDeals: "One large enterprise deal needs legal review.",
    q2CustomerAsking: "More granular analytics.",
    q3EasierClosing: "A self-serve trial would speed things up.",
  },
  {
    id: "2026-W03", week: "2026-W03", weekStart: "2026-01-19", weekEnd: "2026-01-25",
    createdAt: "2026-01-25T18:00:00Z",
    newCustomers: 2, pipelineValue: 76000, closeRate: 19, salesCycleDays: 41,
    dealLossReason1: "Budget freeze", dealLossReason2: "Price too high", dealLossReason3: "No decision",
    customerRequest1: "Multi-language support", customerRequest2: "API integration", customerRequest3: "",
    feedRetention: 89, offersSent: 12, ordersReceived: 7, feedSlaScore: 95, incidentCount: 2,
    customerMeetings: 7, capacityRisks: "Engineer out sick",
    approvedIndicators: 119, jrAnalystIndicators: 171, usbGuardBreakCount: 4, usbGuardUsage: 58, otherProductsUsage: 46,
    q1BlockingDeals: "Budget freeze at two mid-market prospects.",
    q2CustomerAsking: "Multi-language feed support.",
    q3EasierClosing: "Clearer pricing tiers.",
  },
  {
    id: "2026-W04", week: "2026-W04", weekStart: "2026-01-26", weekEnd: "2026-02-01",
    createdAt: "2026-02-01T18:00:00Z",
    newCustomers: 5, pipelineValue: 108000, closeRate: 28, salesCycleDays: 33,
    dealLossReason1: "Went with competitor", dealLossReason2: "Price too high", dealLossReason3: "",
    customerRequest1: "Custom reporting", customerRequest2: "Webhooks", customerRequest3: "",
    feedRetention: 93, offersSent: 18, ordersReceived: 13, feedSlaScore: 99, incidentCount: 0,
    customerMeetings: 12, capacityRisks: "None",
    approvedIndicators: 141, jrAnalystIndicators: 189, usbGuardBreakCount: 2, usbGuardUsage: 67, otherProductsUsage: 53,
    q1BlockingDeals: "No major blockers this week.",
    q2CustomerAsking: "Webhook notifications on feed changes.",
    q3EasierClosing: "Case studies from similar industries.",
  },
  {
    id: "2026-W05", week: "2026-W05", weekStart: "2026-02-02", weekEnd: "2026-02-08",
    createdAt: "2026-02-08T18:00:00Z",
    newCustomers: 4, pipelineValue: 99000, closeRate: 26, salesCycleDays: 34,
    dealLossReason1: "Feature gap", dealLossReason2: "Went with competitor", dealLossReason3: "",
    customerRequest1: "Webhooks", customerRequest2: "Custom reporting", customerRequest3: "",
    feedRetention: 92, offersSent: 17, ordersReceived: 12, feedSlaScore: 98, incidentCount: 1,
    customerMeetings: 11, capacityRisks: "None",
    approvedIndicators: 136, jrAnalystIndicators: 184, usbGuardBreakCount: 3, usbGuardUsage: 65, otherProductsUsage: 52,
    q1BlockingDeals: "Competitor undercutting on price in two deals.",
    q2CustomerAsking: "Scheduled feed refresh.",
    q3EasierClosing: "Better onboarding docs.",
  },
  {
    id: "2026-W06", week: "2026-W06", weekStart: "2026-02-09", weekEnd: "2026-02-15",
    createdAt: "2026-02-15T18:00:00Z",
    newCustomers: 6, pipelineValue: 124000, closeRate: 31, salesCycleDays: 30,
    dealLossReason1: "Price too high", dealLossReason2: "Budget freeze", dealLossReason3: "",
    customerRequest1: "API integration", customerRequest2: "Scheduled refresh", customerRequest3: "",
    feedRetention: 94, offersSent: 20, ordersReceived: 15, feedSlaScore: 99, incidentCount: 0,
    customerMeetings: 14, capacityRisks: "None",
    approvedIndicators: 149, jrAnalystIndicators: 196, usbGuardBreakCount: 1, usbGuardUsage: 71, otherProductsUsage: 57,
    q1BlockingDeals: "One deal waiting for board approval.",
    q2CustomerAsking: "Scheduled automatic feed refresh.",
    q3EasierClosing: "Volume discount for annual contracts.",
  },
  {
    id: "2026-W07", week: "2026-W07", weekStart: "2026-02-16", weekEnd: "2026-02-22",
    createdAt: "2026-02-22T18:00:00Z",
    newCustomers: 5, pipelineValue: 115000, closeRate: 29, salesCycleDays: 32,
    dealLossReason1: "Feature gap", dealLossReason2: "Price too high", dealLossReason3: "No decision",
    customerRequest1: "Bulk export", customerRequest2: "Webhooks", customerRequest3: "",
    feedRetention: 93, offersSent: 19, ordersReceived: 13, feedSlaScore: 97, incidentCount: 1,
    customerMeetings: 13, capacityRisks: "Sales rep on leave",
    approvedIndicators: 145, jrAnalystIndicators: 193, usbGuardBreakCount: 2, usbGuardUsage: 69, otherProductsUsage: 56,
    q1BlockingDeals: "Feature gap blocking two e-commerce deals.",
    q2CustomerAsking: "Bulk data export in CSV.",
    q3EasierClosing: "Free pilot period.",
  },
  {
    id: "2026-W08", week: "2026-W08", weekStart: "2026-02-23", weekEnd: "2026-03-01",
    createdAt: "2026-03-01T18:00:00Z",
    newCustomers: 7, pipelineValue: 138000, closeRate: 34, salesCycleDays: 28,
    dealLossReason1: "Went with competitor", dealLossReason2: "Price too high", dealLossReason3: "",
    customerRequest1: "API integration", customerRequest2: "Custom reporting", customerRequest3: "",
    feedRetention: 95, offersSent: 22, ordersReceived: 17, feedSlaScore: 100, incidentCount: 0,
    customerMeetings: 15, capacityRisks: "None",
    approvedIndicators: 154, jrAnalystIndicators: 202, usbGuardBreakCount: 1, usbGuardUsage: 74, otherProductsUsage: 60,
    q1BlockingDeals: "Strong week — no major blockers.",
    q2CustomerAsking: "More flexible API rate limits.",
    q3EasierClosing: "ROI calculator in the sales deck.",
  },
  {
    id: "2026-W09", week: "2026-W09", weekStart: "2026-03-02", weekEnd: "2026-03-08",
    createdAt: "2026-03-06T18:00:00Z",
    newCustomers: 6, pipelineValue: 131000, closeRate: 32, salesCycleDays: 29,
    dealLossReason1: "Price too high", dealLossReason2: "Feature gap", dealLossReason3: "",
    customerRequest1: "Custom reporting", customerRequest2: "Scheduled refresh", customerRequest3: "",
    feedRetention: 94, offersSent: 21, ordersReceived: 16, feedSlaScore: 99, incidentCount: 1,
    customerMeetings: 14, capacityRisks: "None",
    approvedIndicators: 151, jrAnalystIndicators: 199, usbGuardBreakCount: 2, usbGuardUsage: 72, otherProductsUsage: 59,
    q1BlockingDeals: "Aksel following up on three stalled deals.",
    q2CustomerAsking: "Custom branded reports.",
    q3EasierClosing: "Shorter contract with monthly option.",
  },
]

const MOCK_ENTRY_BY_WEEK = new Map(MOCK_ENTRIES.map((entry) => [entry.week, entry]))

function hydrateProductionMetrics(entries: WeeklyEntry[]): WeeklyEntry[] {
  let changed = false
  const hydrated = entries.map((entry) => {
    const fallback = MOCK_ENTRY_BY_WEEK.get(entry.week)
    const nextEntry: WeeklyEntry = {
      ...entry,
      approvedIndicators: entry.approvedIndicators ?? fallback?.approvedIndicators ?? 0,
      jrAnalystIndicators: entry.jrAnalystIndicators ?? fallback?.jrAnalystIndicators ?? 0,
      usbGuardBreakCount: entry.usbGuardBreakCount ?? fallback?.usbGuardBreakCount ?? 0,
      usbGuardUsage: entry.usbGuardUsage ?? fallback?.usbGuardUsage ?? 0,
      otherProductsUsage: entry.otherProductsUsage ?? fallback?.otherProductsUsage ?? 0,
    }

    if (
      nextEntry.approvedIndicators !== entry.approvedIndicators ||
      nextEntry.jrAnalystIndicators !== entry.jrAnalystIndicators ||
      nextEntry.usbGuardBreakCount !== entry.usbGuardBreakCount ||
      nextEntry.usbGuardUsage !== entry.usbGuardUsage ||
      nextEntry.otherProductsUsage !== entry.otherProductsUsage
    ) {
      changed = true
    }

    return nextEntry
  })

  if (changed) saveEntries(hydrated)
  return hydrated
}

export function seedMockData(): void {
  if (typeof window === "undefined") return
  if (localStorage.getItem(STORAGE_KEY)) return   // don't overwrite existing data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ENTRIES))
}

export function loadEntries(): WeeklyEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WeeklyEntry[]
    return hydrateProductionMetrics(parsed)
  } catch {
    return []
  }
}

export function saveEntries(entries: WeeklyEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function addOrUpdateEntry(entry: WeeklyEntry): WeeklyEntry[] {
  const entries = loadEntries()
  const idx = entries.findIndex((e) => e.week === entry.week)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  entries.sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  saveEntries(entries)
  return entries
}

export function deleteEntry(week: string): WeeklyEntry[] {
  const entries = loadEntries().filter((e) => e.week !== week)
  saveEntries(entries)
  return entries
}

export function loadCustomFieldDefs(): CustomFieldDef[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CUSTOM_FIELDS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CustomFieldDef[]
  } catch {
    return []
  }
}

export function saveCustomFieldDefs(defs: CustomFieldDef[]): CustomFieldDef[] {
  if (typeof window === "undefined") return defs
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(defs))
  return defs
}

export function loadHiddenMetricIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(HIDDEN_METRICS_KEY)
    if (!raw) return PRODUCTION_DYNAMIC_FIELD_DEFS.map((def) => def.id)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return PRODUCTION_DYNAMIC_FIELD_DEFS.map((def) => def.id)
    return parsed.filter((id): id is string => typeof id === "string")
  } catch {
    return PRODUCTION_DYNAMIC_FIELD_DEFS.map((def) => def.id)
  }
}

export function saveHiddenMetricIds(ids: string[]): string[] {
  const uniqueIds = [...new Set(ids)]
  if (typeof window === "undefined") return uniqueIds
  localStorage.setItem(HIDDEN_METRICS_KEY, JSON.stringify(uniqueIds))
  return uniqueIds
}

export function getMetricValueFromEntry(entry: WeeklyEntry, metricId: string): string | number | undefined {
  switch (metricId) {
    case "approvedIndicators":
      return entry.approvedIndicators
    case "jrAnalystIndicators":
      return entry.jrAnalystIndicators
    case "usbGuardBreakCount":
      return entry.usbGuardBreakCount
    case "usbGuardUsage":
      return entry.usbGuardUsage
    case "otherProductsUsage":
      return entry.otherProductsUsage
    default:
      return entry.customFields?.[metricId]
  }
}

export function computeMonthlyRollups(entries: WeeklyEntry[]): MonthlyRollup[] {
  const map = new Map<string, WeeklyEntry[]>()
  for (const e of entries) {
    const m = e.weekStart.slice(0, 7)
    if (!map.has(m)) map.set(m, [])
    map.get(m)!.push(e)
  }
  const result: MonthlyRollup[] = []
  for (const [month, ws] of map) {
    const n = ws.length
    const date = new Date(month + "-01")
    result.push({
      month,
      monthLabel: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      newCustomers: ws.reduce((s, w) => s + w.newCustomers, 0),
      pipelineValueAvg: Math.round(ws.reduce((s, w) => s + w.pipelineValue, 0) / n),
      closeRateAvg: Math.round((ws.reduce((s, w) => s + w.closeRate, 0) / n) * 10) / 10,
      salesCycleDaysAvg: Math.round((ws.reduce((s, w) => s + w.salesCycleDays, 0) / n) * 10) / 10,
      feedRetentionAvg: Math.round((ws.reduce((s, w) => s + w.feedRetention, 0) / n) * 10) / 10,
      offersSent: ws.reduce((s, w) => s + w.offersSent, 0),
      ordersReceived: ws.reduce((s, w) => s + w.ordersReceived, 0),
      feedSlaScoreAvg: Math.round((ws.reduce((s, w) => s + w.feedSlaScore, 0) / n) * 10) / 10,
      incidentCount: ws.reduce((s, w) => s + w.incidentCount, 0),
      customerMeetings: ws.reduce((s, w) => s + w.customerMeetings, 0),
      weeksCount: n,
    })
  }
  return result.sort((a, b) => a.month.localeCompare(b.month))
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

export function mondayOfWeek(date: Date): string {
  const day = date.getDay() || 7
  const mon = new Date(date)
  mon.setDate(date.getDate() - day + 1)
  return mon.toISOString().slice(0, 10)
}

export function weekEndFromMonday(mondayStr: string): string {
  const d = new Date(mondayStr)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

