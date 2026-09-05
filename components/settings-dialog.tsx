"use client"

import { useLocale } from "@/components/locale-provider"

import { useState } from "react"
import { Settings, X, RotateCcw } from "lucide-react"
import type { PomodoroSettings } from "@/lib/pomodoro-types"

interface SettingsDialogProps {
  settings: PomodoroSettings
  onSave: (settings: PomodoroSettings) => void
  onReset: () => void
}

export function SettingsDialog({ settings, onSave, onReset }: SettingsDialogProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<PomodoroSettings>(settings)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleOpen = () => {
    setLocal(settings)
    setShowResetConfirm(false)
    setOpen(true)
  }

  const handleSave = () => {
    onSave({
      pomodoroMinutes: Math.max(1, Math.min(120, local.pomodoroMinutes)),
      shortBreakMinutes: Math.max(1, Math.min(60, local.shortBreakMinutes)),
      longBreakMinutes: Math.max(1, Math.min(60, local.longBreakMinutes)),
      longBreakInterval: Math.max(1, Math.min(10, local.longBreakInterval)),
      dayStartHour: Math.max(0, Math.min(23, local.dayStartHour)),
    })
    setOpen(false)
  }

  const handleResetAll = () => {
    onReset()
    setOpen(false)
    setShowResetConfirm(false)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2 rounded-md text-[hsl(0_0%_100%/0.7)] hover:text-[hsl(0_0%_100%)] hover:bg-[hsl(0_0%_0%/0.08)] transition-colors"
        aria-label={t("Settings")}
      >
        <Settings className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[hsl(0_0%_0%/0.4)]"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-[hsl(0_0%_100%)] text-[hsl(0_0%_20%)] rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[hsl(0_0%_20%)]">{t("Timer Settings")}</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-[hsl(0_0%_0%/0.05)] text-[hsl(0_0%_40%)]"
                aria-label={t("Close settings")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Timer durations */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(0_0%_50%)]">
                  {t("Time (minutes)")}
                </label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div>
                    <label className="text-xs text-[hsl(0_0%_50%)] mb-1 block">
                      {t("Pomodoro")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={local.pomodoroMinutes}
                      onChange={(e) =>
                        setLocal({ ...local, pomodoroMinutes: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-md bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(0_65%_71%/0.5)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(0_0%_50%)] mb-1 block">
                      {t("Short Break")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={local.shortBreakMinutes}
                      onChange={(e) =>
                        setLocal({
                          ...local,
                          shortBreakMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-md bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(0_65%_71%/0.5)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(0_0%_50%)] mb-1 block">
                      {t("Long Break")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={local.longBreakMinutes}
                      onChange={(e) =>
                        setLocal({
                          ...local,
                          longBreakMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-md bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(0_65%_71%/0.5)]"
                    />
                  </div>
                </div>
              </div>

              {/* Long break interval */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(0_0%_50%)]">
                  {t("Long Break Interval")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={local.longBreakInterval}
                  onChange={(e) =>
                    setLocal({
                      ...local,
                      longBreakInterval: Number(e.target.value),
                    })
                  }
                  className="w-full mt-2 px-3 py-2 rounded-md bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(0_65%_71%/0.5)]"
                />
                <p className="text-xs text-[hsl(0_0%_60%)] mt-1">
                  {t("Long break after every N pomodoros")}
                </p>
              </div>

              {/* Day start hour */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(0_0%_50%)]">
                  {t("Day Start Hour")}
                </label>
                <select
                  value={local.dayStartHour}
                  onChange={(e) =>
                    setLocal({ ...local, dayStartHour: Number(e.target.value) })
                  }
                  className="w-full mt-2 px-3 py-2 rounded-md bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(0_65%_71%/0.5)]"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00{" "}
                      {h === 0
                        ? t("(midnight)")
                        : h === 12
                          ? t("(noon)")
                          : h < 12
                            ? "AM"
                            : "PM"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[hsl(0_0%_60%)] mt-1">
                  {t("When does your day start for the focus chart?")}
                </p>
              </div>

              {/* Reset section */}
              <div className="pt-3 border-t border-[hsl(0_0%_90%)]">
                {showResetConfirm ? (
                  <div className="bg-[hsl(0_90%_97%)] rounded-lg p-3">
                    <p className="text-sm text-[hsl(0_60%_45%)] mb-2">
                      {t("This will clear all tasks, settings, and focus history. Are you sure?")}
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 text-sm text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_30%)]"
                      >
                        {t("Cancel")}
                      </button>
                      <button
                        onClick={handleResetAll}
                        className="px-3 py-1.5 text-sm bg-[hsl(0_60%_55%)] text-[hsl(0_0%_100%)] rounded-md font-medium hover:bg-[hsl(0_60%_48%)]"
                      >
                        {t("Yes, Reset Everything")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 text-sm text-[hsl(0_0%_55%)] hover:text-[hsl(0_60%_50%)] transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t("Reset All Data")}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[hsl(0_65%_71%)] text-[hsl(0_0%_100%)] rounded-md font-medium hover:bg-[hsl(0_65%_63%)] transition-colors"
              >
                {t("Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
