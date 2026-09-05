export type TimerMode = "pomodoro" | "shortBreak" | "longBreak"

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  estimatedPomodoros: number
  completedPomodoros: number
  totalSecondsSpent: number
  done: boolean
  subtasks: Subtask[]
}

export interface PomodoroSettings {
  pomodoroMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  dayStartHour: number
}

export interface FocusLogEntry {
  date: string
  totalSeconds: number
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  dayStartHour: 0,
}