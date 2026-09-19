"use client"

import { useEffect, useState } from "react"
import { Flag } from "lucide-react"
import { useLocale } from "@/components/locale-provider"
import type { PomodoroSettings, Task, TimerMode } from "@/lib/pomodoro-types"
import { estimateFinish, formatDuration } from "@/lib/finish-estimate"

interface FinishEstimateProps {
  tasks: Task[]
  settings: PomodoroSettings
  pomodorosCompleted: number
  mode: TimerMode
  elapsedSeconds: number
}

export function FinishEstimate({
  tasks,
  settings,
  pomodorosCompleted,
  mode,
  elapsedSeconds,
}: FinishEstimateProps) {
  const { locale, t } = useLocale()
  const [now, setNow] = useState(() => Date.now())

  // The clock keeps moving even while the timer is paused.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const estimate = estimateFinish({
    tasks,
    settings,
    pomodorosCompleted,
    mode,
    elapsedSeconds,
    now,
  })

  if (!estimate) return null

  const { remainingPomodoros, focusSeconds, breakSeconds, totalSeconds, finishAt } =
    estimate
  const finishTime = finishAt.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const isTomorrow = finishAt.toDateString() !== new Date(now).toDateString()

  return (
    <div className="w-full max-w-lg mx-auto mt-4 rounded-lg bg-[hsl(0_0%_100%/0.08)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[hsl(0_0%_100%/0.7)]">
          <Flag className="w-4 h-4 flex-shrink-0" />
          {t("Estimated finish")}
        </div>
        <div className="text-right">
          <span className="text-lg font-bold tabular-nums text-[hsl(0_0%_100%)]">
            {finishTime}
          </span>
          {isTomorrow && (
            <span className="ml-1.5 text-xs text-[hsl(0_0%_100%/0.6)]">
              {t("tomorrow")}
            </span>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-[hsl(0_0%_100%/0.6)]">
        {remainingPomodoros}{" "}
        {remainingPomodoros === 1 ? t("pomodoro left") : t("pomodoros left")} ·{" "}
        {formatDuration(totalSeconds)}
        {breakSeconds > 0 && (
          <>
            {" "}
            ({formatDuration(focusSeconds)} {t("of focus")} +{" "}
            {formatDuration(breakSeconds)} {t("of breaks")})
          </>
        )}
      </p>
    </div>
  )
}
