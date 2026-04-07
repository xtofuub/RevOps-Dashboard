"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  WeeklyEntry,
  MonthlyRollup,
  loadEntries,
  saveEntries,
  addOrUpdateEntry,
  deleteEntry as deleteEntryFromStorage,
  computeMonthlyRollups,
  seedMockData,
  CustomFieldDef,
  loadCustomFieldDefs,
  saveCustomFieldDefs,
  loadHiddenMetricIds,
  saveHiddenMetricIds,
} from "@/lib/revops-data"

interface RevOpsContextValue {
  entries: WeeklyEntry[]
  monthly: MonthlyRollup[]
  pushEntry: (entry: WeeklyEntry) => void
  removeEntry: (week: string) => void
  latestEntry: WeeklyEntry | null
  prevEntry: WeeklyEntry | null
  customFieldDefs: CustomFieldDef[]
  addCustomFieldDef: (def: CustomFieldDef) => void
  updateCustomFieldDef: (def: CustomFieldDef) => void
  removeCustomFieldDef: (id: string) => void
  hiddenMetricIds: string[]
  setMetricVisibility: (id: string, visible: boolean) => void
}

const RevOpsContext = createContext<RevOpsContextValue | null>(null)

export function RevOpsProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([])
  const [hiddenMetricIds, setHiddenMetricIds] = useState<string[]>([])

  useEffect(() => {
    seedMockData()
    setEntries(loadEntries())
    setCustomFieldDefs(loadCustomFieldDefs())
    setHiddenMetricIds(loadHiddenMetricIds())
  }, [])

  const pushEntry = useCallback((entry: WeeklyEntry) => {
    const updated = addOrUpdateEntry(entry)
    setEntries(updated)
  }, [])

  const removeEntry = useCallback((week: string) => {
    const updated = deleteEntryFromStorage(week)
    setEntries(updated)
  }, [])

  const addCustomFieldDef = useCallback((def: CustomFieldDef) => {
    setCustomFieldDefs(prev => {
      const next = [...prev, def]
      saveCustomFieldDefs(next)
      return next
    })
  }, [])

  const updateCustomFieldDef = useCallback((def: CustomFieldDef) => {
    setCustomFieldDefs(prev => {
      const next = prev.map(existing => existing.id === def.id ? def : existing)
      saveCustomFieldDefs(next)
      return next
    })
  }, [])

  const removeCustomFieldDef = useCallback((id: string) => {
    setCustomFieldDefs(prev => {
      const next = prev.filter(d => d.id !== id)
      saveCustomFieldDefs(next)
      return next
    })

    setHiddenMetricIds(prev => {
      const next = prev.filter(metricId => metricId !== id)
      saveHiddenMetricIds(next)
      return next
    })

    setEntries(prev => {
      const next = prev.map(entry => {
        if (!entry.customFields || !(id in entry.customFields)) return entry
        const updatedCustomFields = { ...entry.customFields }
        delete updatedCustomFields[id]
        return { ...entry, customFields: updatedCustomFields }
      })
      saveEntries(next)
      return next
    })
  }, [])

  const setMetricVisibility = useCallback((id: string, visible: boolean) => {
    setHiddenMetricIds(prev => {
      const next = visible
        ? prev.filter(metricId => metricId !== id)
        : [...new Set([...prev, id])]
      saveHiddenMetricIds(next)
      return next
    })
  }, [])

  const monthly = computeMonthlyRollups(entries)
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null
  const prevEntry = entries.length > 1 ? entries[entries.length - 2] : null

  return (
    <RevOpsContext.Provider
      value={{ 
        entries, monthly, pushEntry, removeEntry, latestEntry, prevEntry,
        customFieldDefs, addCustomFieldDef, updateCustomFieldDef, removeCustomFieldDef,
        hiddenMetricIds, setMetricVisibility
      }}
    >
      {children}
    </RevOpsContext.Provider>
  )
}

export function useRevOps() {
  const ctx = useContext(RevOpsContext)
  if (!ctx) throw new Error("useRevOps must be used within RevOpsProvider")
  return ctx
}
