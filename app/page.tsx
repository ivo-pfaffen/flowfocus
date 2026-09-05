"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { SettingsDialog } from "@/components/settings-dialog"
import { TaskList } from "@/components/task-list"
import { PomodoroForest } from "@/components/pomodoro-forest"
import { FocusChart } from "@/components/focus-chart"
import type {
  TimerMode,
  Task,
  PomodoroSettings,
  FocusLogEntry,
} from "@/lib/pomodoro-types"
import { DEFAULT_SETTINGS } from "@/lib/pomodoro-types"
import {
  loadSettings,
  saveSettings,
  loadTasks,
  saveTasks,
  loadActiveTaskId,
  saveActiveTaskId,
  loadPomodorosCompleted,
  savePomodorosCompleted,
  loadFocusLog,
  saveFocusLog,
  getDayKey,
  clearAllData,
} from "@/lib/storage"
import { Timer } from "lucide-react"

function getModeClass(mode: TimerMode) {
  switch (mode) {
    case "pomodoro":
      return "mode-pomodoro"
    case "shortBreak":
      return "mode-short-break"
    case "longBreak":
      return "mode-long-break"
  }
}

export default function PomodoroPage() {
  const [hydrated, setHydrated] = useState(false)
  const [mode, setMode] = useState<TimerMode>("pomodoro")
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const [focusLog, setFocusLog] = useState<FocusLogEntry[]>([])

  const modeRef = useRef(mode)
  const settingsRef = useRef(settings)
  modeRef.current = mode
  settingsRef.current = settings

  // Hydrate from localStorage
  useEffect(() => {
    setSettings(loadSettings())
    setTasks(loadTasks())
    setActiveTaskId(loadActiveTaskId())
    setPomodorosCompleted(loadPomodorosCompleted())
    setFocusLog(loadFocusLog())
    setHydrated(true)
  }, [])

  // Persist on changes
  useEffect(() => {
    if (!hydrated) return
    saveSettings(settings)
  }, [settings, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveTasks(tasks)
  }, [tasks, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveActiveTaskId(activeTaskId)
  }, [activeTaskId, hydrated])

  useEffect(() => {
    if (!hydrated) return
    savePomodorosCompleted(pomodorosCompleted)
  }, [pomodorosCompleted, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveFocusLog(focusLog)
  }, [focusLog, hydrated])

  // Track time on active task and log focus time per second
  const handleSetElapsed = useCallback(
    (fn: (prev: number) => number) => {
      setElapsedSeconds((prev) => {
        const next = fn(prev)
        const delta = next - prev
        if (delta > 0 && modeRef.current === "pomodoro") {
          if (activeTaskId) {
            setTasks((prevTasks) =>
              prevTasks.map((t) =>
                t.id === activeTaskId
                  ? { ...t, totalSecondsSpent: t.totalSecondsSpent + delta }
                  : t
              )
            )
          }
          setFocusLog((prevLog) => {
            const dayKey = getDayKey(settingsRef.current.dayStartHour)
            const existing = prevLog.find((e) => e.date === dayKey)
            if (existing) {
              return prevLog.map((e) =>
                e.date === dayKey
                  ? { ...e, totalSeconds: e.totalSeconds + delta }
                  : e
              )
            }
            return [...prevLog, { date: dayKey, totalSeconds: delta }]
          })
        }
        return next
      })
    },
    [activeTaskId]
  )

  const handlePomodoroComplete = useCallback(() => {
    setPomodorosCompleted((prev) => prev + 1)
    if (activeTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId
            ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
            : t
        )
      )
    }
  }, [activeTaskId])

  const handleSaveSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings)
  }, [])

  const handleResetAll = useCallback(() => {
    clearAllData()
    setSettings(DEFAULT_SETTINGS)
    setTasks([])
    setActiveTaskId(null)
    setPomodorosCompleted(0)
    setFocusLog([])
    setMode("pomodoro")
    setIsRunning(false)
    setElapsedSeconds(0)
  }, [])

  const activeTaskName = activeTaskId
    ? tasks.find((t) => t.id === activeTaskId)?.title
    : undefined

  if (!hydrated) {
    return (
      <div className="min-h-screen mode-pomodoro flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[hsl(0_0%_100%/0.3)] border-t-[hsl(0_0%_100%)] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${getModeClass(mode)}`}>
      {/* Header */}
      <header className="w-full max-w-2xl mx-auto px-4 py-4 flex items-center justify-between border-b border-[hsl(0_0%_100%/0.12)]">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-[hsl(0_0%_100%)]" />
          <span className="text-lg font-bold text-[hsl(0_0%_100%)]">
            Flowfocus
          </span>
        </div>
        <SettingsDialog
          settings={settings}
          onSave={handleSaveSettings}
          onReset={handleResetAll}
        />
      </header>

      {/* Main content */}
      <main className="w-full max-w-2xl mx-auto px-4 pt-8 pb-20">
        {/* Timer card */}
        <div className="bg-[hsl(0_0%_100%/0.08)] rounded-xl p-6 md:p-8">
          <PomodoroTimer
            mode={mode}
            setMode={setMode}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            elapsedSeconds={elapsedSeconds}
            setElapsedSeconds={handleSetElapsed}
            settings={settings}
            onPomodoroComplete={handlePomodoroComplete}
            pomodorosCompleted={pomodorosCompleted}
            activeTaskName={activeTaskName}
          />
        </div>

        {/* Session counter */}
        <div className="text-center mt-3 text-sm text-[hsl(0_0%_100%/0.5)]">
          #{pomodorosCompleted + 1} session
        </div>

        {/* Task list */}
        <TaskList
          tasks={tasks}
          setTasks={setTasks}
          activeTaskId={activeTaskId}
          setActiveTaskId={setActiveTaskId}
        />

        {/* Forest */}
        <PomodoroForest pomodorosCompleted={pomodorosCompleted} />

        {/* Focus chart */}
        <FocusChart focusLog={focusLog} />
      </main>
    </div>
  )
}