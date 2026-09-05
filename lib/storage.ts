import type { Task, PomodoroSettings, FocusLogEntry } from "./pomodoro-types"
import { DEFAULT_SETTINGS } from "./pomodoro-types"

const KEYS = {
  settings: "flowfocus-settings",
  tasks: "flowfocus-tasks",
  activeTaskId: "flowfocus-active-task",
  pomodorosCompleted: "flowfocus-pomodoros-completed",
  focusLog: "flowfocus-focus-log",
} as const

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable
  }
}

export function loadSettings(): PomodoroSettings {
  return safeGet(KEYS.settings, DEFAULT_SETTINGS)
}

export function saveSettings(s: PomodoroSettings) {
  safeSet(KEYS.settings, s)
}

export function loadTasks(): Task[] {
  return safeGet(KEYS.tasks, [])
}

export function saveTasks(t: Task[]) {
  safeSet(KEYS.tasks, t)
}

export function loadActiveTaskId(): string | null {
  return safeGet(KEYS.activeTaskId, null)
}

export function saveActiveTaskId(id: string | null) {
  safeSet(KEYS.activeTaskId, id)
}

export function loadPomodorosCompleted(): number {
  return safeGet(KEYS.pomodorosCompleted, 0)
}

export function savePomodorosCompleted(n: number) {
  safeSet(KEYS.pomodorosCompleted, n)
}

export function loadFocusLog(): FocusLogEntry[] {
  return safeGet(KEYS.focusLog, [])
}

export function saveFocusLog(log: FocusLogEntry[]) {
  safeSet(KEYS.focusLog, log)
}

/** Get the "day" key (YYYY-MM-DD) for a given timestamp, offset by dayStartHour */
export function getDayKey(dayStartHour: number, timestamp?: number): string {
  const now = timestamp ? new Date(timestamp) : new Date()
  // Shift back by dayStartHour to compute the logical "day"
  const shifted = new Date(now.getTime() - dayStartHour * 60 * 60 * 1000)
  const y = shifted.getFullYear()
  const m = String(shifted.getMonth() + 1).padStart(2, "0")
  const d = String(shifted.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function clearAllData() {
  if (typeof window === "undefined") return
  for (const key of Object.values(KEYS)) {
    localStorage.removeItem(key)
  }
}