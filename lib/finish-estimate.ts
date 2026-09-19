import type { PomodoroSettings, Task, TimerMode } from "./pomodoro-types"

export interface FinishEstimateInput {
  tasks: Task[]
  settings: PomodoroSettings
  pomodorosCompleted: number
  mode: TimerMode
  elapsedSeconds: number
  /** Epoch milliseconds to count from. */
  now: number
}

export interface FinishEstimate {
  remainingPomodoros: number
  focusSeconds: number
  breakSeconds: number
  totalSeconds: number
  finishAt: Date
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/** Pomodoros still planned across every task that isn't finished. */
export function countRemainingPomodoros(tasks: Task[]) {
  return tasks.reduce((total, task) => {
    if (task.done) return total
    return total + Math.max(0, task.estimatedPomodoros - task.completedPomodoros)
  }, 0)
}

/**
 * When the planned pomodoros run out, counting the breaks in between.
 * Returns null when there is nothing left to plan.
 */
export function estimateFinish({
  tasks,
  settings,
  pomodorosCompleted,
  mode,
  elapsedSeconds,
  now,
}: FinishEstimateInput): FinishEstimate | null {
  const remainingPomodoros = countRemainingPomodoros(tasks)
  if (remainingPomodoros === 0) return null

  const pomodoroSeconds = settings.pomodoroMinutes * 60
  const shortBreakSeconds = settings.shortBreakMinutes * 60
  const longBreakSeconds = settings.longBreakMinutes * 60
  const interval = Math.max(1, settings.longBreakInterval)

  let focusSeconds = 0
  let breakSeconds = 0

  // A break already on screen has to run out before the next pomodoro starts.
  if (mode !== "pomodoro") {
    const limit = mode === "longBreak" ? longBreakSeconds : shortBreakSeconds
    breakSeconds += Math.max(0, limit - elapsedSeconds)
  }

  for (let i = 0; i < remainingPomodoros; i++) {
    // The pomodoro in progress only needs the time it has left.
    focusSeconds +=
      i === 0 && mode === "pomodoro"
        ? Math.max(0, pomodoroSeconds - elapsedSeconds)
        : pomodoroSeconds

    // No break after the last one — that's the finish line.
    if (i < remainingPomodoros - 1) {
      const finishedByThen = pomodorosCompleted + i + 1
      breakSeconds +=
        finishedByThen % interval === 0 ? longBreakSeconds : shortBreakSeconds
    }
  }

  const totalSeconds = focusSeconds + breakSeconds
  return {
    remainingPomodoros,
    focusSeconds,
    breakSeconds,
    totalSeconds,
    finishAt: new Date(now + totalSeconds * 1000),
  }
}
