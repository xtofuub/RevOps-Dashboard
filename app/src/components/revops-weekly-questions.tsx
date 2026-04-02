"use client"

import { IconMessageQuestion } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRevOps } from "@/lib/revops-context"

export function RevOpsWeeklyQuestions() {
  const { entries } = useRevOps()

  const withAnswers = [...entries].reverse().filter(
    (e) => e.q1BlockingDeals || e.q2CustomerAsking || e.q3EasierClosing
  )

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMessageQuestion className="size-5" />
            OKR Weekly Questions — RevOps Team
          </CardTitle>
          <CardDescription>
            Ask these in every OKR meeting and store the answers in the &ldquo;Enter Data&rdquo; tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withAnswers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers logged yet. Fill in the OKR questions when entering weekly data.</p>
          ) : (
            <div className="space-y-6">
              {withAnswers.map((q) => (
                <div key={q.week} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-semibold">{q.week}</span>
                    <span className="text-sm text-muted-foreground">({q.weekStart})</span>
                  </div>
                  <div className="space-y-3">
                    {q.q1BlockingDeals && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">1. What prevents you from closing more deals?</p>
                        <p className="mt-1 text-sm">{q.q1BlockingDeals}</p>
                      </div>
                    )}
                    {q.q2CustomerAsking && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">2. What do customers repeatedly ask?</p>
                        <p className="mt-1 text-sm">{q.q2CustomerAsking}</p>
                      </div>
                    )}
                    {q.q3EasierClosing && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">3. What could make closing easier?</p>
                        <p className="mt-1 text-sm">{q.q3EasierClosing}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

