"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  WeeklyEntry,
  MonthlyRollup,
  loadEntries,
  addOrUpdateEntry,
  deleteEntry as deleteEntryFromStorage,
  computeMonthlyRollups,
  seedMockData,
} from "@/lib/revops-data"

interface RevOpsContextValue {
  entries: WeeklyEntry[]
  monthly: MonthlyRollup[]
  pushEntry: (entry: WeeklyEntry) => void
  removeEntry: (week: string) => void
  latestEntry: WeeklyEntry | null
  prevEntry: WeeklyEntry | null
}

const RevOpsContext = createContext<RevOpsContextValue | null>(null)

export function RevOpsProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<WeeklyEntry[]>([])

  useEffect(() => {
    seedMockData()
    setEntries(loadEntries())
  }, [])

  const pushEntry = useCallback((entry: WeeklyEntry) => {
    const updated = addOrUpdateEntry(entry)
    setEntries(updated)
  }, [])

  const removeEntry = useCallback((week: string) => {
    const updated = deleteEntryFromStorage(week)
    setEntries(updated)
  }, [])

  const monthly = computeMonthlyRollups(entries)
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null
  const prevEntry = entries.length > 1 ? entries[entries.length - 2] : null

  return (
    <RevOpsContext.Provider
      value={{ entries, monthly, pushEntry, removeEntry, latestEntry, prevEntry }}
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
