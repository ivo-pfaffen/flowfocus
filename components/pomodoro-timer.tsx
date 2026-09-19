"use client"

import { useLocale } from "@/components/locale-provider"

import { useEffect, useRef, useCallback, useState } from "react"
import type { Translate } from "@/lib/i18n"
import type { TimerMode, PomodoroSettings } from "@/lib/pomodoro-types"
import { createFocusTracker } from "@/lib/focus-tracking"
import { initializeAnalytics, trackFocus } from "@/lib/analytics"

interface PomodoroTimerProps {
  mode: TimerMode
  setMode: (mode: TimerMode) => void
  isRunning: boolean
  setIsRunning: (running: boolean) => void
  elapsedSeconds: number
  setElapsedSeconds: (fn: (prev: number) => number) => void
  settings: PomodoroSettings
  onPomodoroComplete: (focusedSeconds: number) => void
  pomodorosCompleted: number
  activeTaskName?: string
}

function formatTime(totalSeconds: number, limitSeconds: number) {
  const remaining = limitSeconds - totalSeconds
  const absRemaining = Math.abs(remaining)
  const minutes = Math.floor(absRemaining / 60)
  const seconds = absRemaining % 60
  const prefix = remaining < 0 ? "+" : ""
  return `${prefix}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatTabTitle(
  totalSeconds: number,
  limitSeconds: number,
  mode: TimerMode,
  t: Translate,
  taskName?: string
) {
  const remaining = limitSeconds - totalSeconds
  const modeLabel =
    mode === "pomodoro"
      ? taskName || t("Focus")
      : mode === "shortBreak"
        ? t("Break")
        : t("Long Break")

  if (remaining >= 0) {
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} - ${modeLabel}`
  }
  const overSeconds = totalSeconds - limitSeconds
  const overMinutes = Math.floor(overSeconds / 60)
  const overSecs = overSeconds % 60
  return `+${String(overMinutes).padStart(2, "0")}:${String(overSecs).padStart(2, "0")} - ${modeLabel}`
}

function getModeLabel(mode: TimerMode, t: Translate) {
  switch (mode) {
    case "pomodoro":
      return t("Time to focus!")
    case "shortBreak":
      return t("Time for a break!")
    case "longBreak":
      return t("Time for a long break!")
  }
}

export function PomodoroTimer({
  mode,
  setMode,
  isRunning,
  setIsRunning,
  elapsedSeconds,
  setElapsedSeconds,
  settings,
  onPomodoroComplete,
  pomodorosCompleted,
  activeTaskName,
}: PomodoroTimerProps) {
  const { t } = useLocale()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasNotifiedRef = useRef(false)
  const analyticsRef = useRef<ReturnType<typeof createFocusTracker> | null>(null)
  const previousElapsedRef = useRef(0)
  const getTracker = () => {
    if (!analyticsRef.current) {
      let storage: Storage | undefined
      try { storage = window.localStorage } catch {}
      analyticsRef.current = createFocusTracker(trackFocus, storage)
    }
    return analyticsRef.current
  }

  // Smooth ring: we track a floating-point progress that animates toward the target
  const [smoothProgress, setSmoothProgress] = useState(0)
  const smoothRef = useRef(0)
  const targetRef = useRef(0)
  const rafRef = useRef<number>(0)

  const getLimitSeconds = useCallback(() => {
    switch (mode) {
      case "pomodoro":
        return settings.pomodoroMinutes * 60
      case "shortBreak":
        return settings.shortBreakMinutes * 60
      case "longBreak":
        return settings.longBreakMinutes * 60
    }
  }, [mode, settings])

  // Compute target progress from elapsed
  const limitSeconds = getLimitSeconds()
  const rawProgress = Math.min(elapsedSeconds / limitSeconds, 1)

  useEffect(() => {
    if (mode === "pomodoro" && isRunning) {
      analyticsRef.current?.progress(elapsedSeconds, limitSeconds)
    }
    if (elapsedSeconds === 0 && previousElapsedRef.current > 0 && !isRunning) analyticsRef.current?.reset()
    previousElapsedRef.current = elapsedSeconds
  }, [elapsedSeconds, limitSeconds, isRunning, mode])

  useEffect(() => {
    targetRef.current = rawProgress
  }, [rawProgress])

  // Reset smooth progress when mode changes or timer resets to 0
  useEffect(() => {
    if (elapsedSeconds === 0) {
      smoothRef.current = 0
      setSmoothProgress(0)
      targetRef.current = 0
    }
  }, [elapsedSeconds, mode])

  // Smooth animation loop: lerp smoothProgress toward target
  useEffect(() => {
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000
      lastTime = now

      const target = targetRef.current
      const current = smoothRef.current
      const diff = target - current

      if (Math.abs(diff) < 0.0001) {
        smoothRef.current = target
      } else {
        // Lerp with a speed that makes each 1-second step take ~0.9s to animate
        const speed = 3.0
        smoothRef.current = current + diff * Math.min(1, speed * dt)
      }

      setSmoothProgress(smoothRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Play notification sound when timer reaches 0
  useEffect(() => {
    if (
      elapsedSeconds >= limitSeconds &&
      !hasNotifiedRef.current &&
      isRunning
    ) {
      hasNotifiedRef.current = true
      try {
        const ctx = new AudioContext()
        const frequencies = [523.25, 659.25, 783.99]

        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = "sine"
          osc.frequency.value = frequencies[i % frequencies.length]
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.35)
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + i * 0.35 + 0.3
          )
          osc.start(ctx.currentTime + i * 0.35)
          osc.stop(ctx.currentTime + i * 0.35 + 0.3)
        }

        setTimeout(() => {
          try {
            const ctx2 = new AudioContext()
            for (let i = 0; i < 3; i++) {
              const osc = ctx2.createOscillator()
              const gain = ctx2.createGain()
              osc.connect(gain)
              gain.connect(ctx2.destination)
              osc.type = "sine"
              osc.frequency.value = frequencies[i % frequencies.length]
              gain.gain.setValueAtTime(0.2, ctx2.currentTime + i * 0.35)
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx2.currentTime + i * 0.35 + 0.3
              )
              osc.start(ctx2.currentTime + i * 0.35)
              osc.stop(ctx2.currentTime + i * 0.35 + 0.3)
            }
          } catch {
            // Audio not available
          }
        }, 1500)
      } catch {
        // Audio not available
      }
    }
  }, [elapsedSeconds, limitSeconds, isRunning])

  // Timer interval — ticks every second for the display counter
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, setElapsedSeconds])

  const handleStartStop = () => {
    if (!isRunning && mode === "pomodoro" && initializeAnalytics()) getTracker().start(limitSeconds)
    setIsRunning(!isRunning)
  }

  const handleStop = () => {
    if (mode === "pomodoro") analyticsRef.current?.end(elapsedSeconds, limitSeconds, "stop")
    setIsRunning(false)
    const isComplete = elapsedSeconds >= getLimitSeconds()

    if (mode === "pomodoro" && isComplete) {
      onPomodoroComplete(elapsedSeconds)
      if ((pomodorosCompleted + 1) % settings.longBreakInterval === 0) {
        setMode("longBreak")
      } else {
        setMode("shortBreak")
      }
    } else {
      setMode("pomodoro")
    }

    setElapsedSeconds(() => 0)
    hasNotifiedRef.current = false
  }

  const handleModeSwitch = (newMode: TimerMode) => {
    if (isRunning) {
      const confirmed = window.confirm(
        t("The timer is still running. Are you sure you want to switch?")
      )
      if (!confirmed) return
    }
    if (mode === "pomodoro") analyticsRef.current?.end(elapsedSeconds, limitSeconds, "switch")
    setIsRunning(false)
    setElapsedSeconds(() => 0)
    hasNotifiedRef.current = false
    setMode(newMode)
  }

  const remaining = limitSeconds - elapsedSeconds
  const isOvertime = remaining < 0

  // Use smoothProgress for the ring
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - smoothProgress)

  return (
    <div className="flex flex-col items-center">
      <title>{isRunning || elapsedSeconds > 0
        ? formatTabTitle(elapsedSeconds, limitSeconds, mode, t, activeTaskName)
        : t("Flowfocus - Pomodoro Timer")}</title>
      {/* Mode tabs */}
      <div className="flex gap-1 mb-6">
        {(["pomodoro", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === m
              ? "bg-[hsl(0_0%_0%/0.12)] text-[hsl(0_0%_100%)]"
              : "text-[hsl(0_0%_100%/0.7)] hover:text-[hsl(0_0%_100%)] hover:bg-[hsl(0_0%_0%/0.06)]"
              }`}
          >
            {m === "pomodoro"
              ? "Pomodoro"
              : m === "shortBreak"
                ? t("Short Break")
                : t("Long Break")}
          </button>
        ))}
      </div>

      {/* Timer display — bigger circle, same text */}
      <div className="relative mb-6">
        <svg
          className="w-64 h-64 md:w-72 md:h-72 -rotate-90"
          viewBox="0 0 220 220"
        >
          {/* Background track */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="hsla(0,0%,100%,0.1)"
            strokeWidth="5"
          />
          {/* Progress arc — no CSS transition, driven by RAF */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={
              isOvertime
                ? "hsla(40,90%,75%,0.9)"
                : "hsla(0,0%,100%,0.7)"
            }
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-5xl md:text-6xl font-bold tabular-nums tracking-tight text-[hsl(0_0%_100%)] ${isOvertime ? "animate-pulse" : ""
              }`}
          >
            {formatTime(elapsedSeconds, limitSeconds)}
          </span>
          <span className="text-xs text-[hsl(0_0%_100%/0.6)] mt-1">
            {getModeLabel(mode, t)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleStartStop}
          className="px-10 py-3 rounded-lg text-base font-bold uppercase tracking-wider transition-all active:translate-y-0.5 bg-[hsl(0_0%_100%)] text-[hsl(0_0%_25%)] shadow-lg hover:shadow-xl"
        >
          {isRunning ? t("Pause") : t("Start")}
        </button>
        {(isRunning || elapsedSeconds > 0) && (
          <button
            onClick={handleStop}
            className="px-5 py-3 rounded-lg text-base font-bold uppercase tracking-wider transition-all active:translate-y-0.5 bg-[hsl(0_0%_100%/0.2)] text-[hsl(0_0%_100%)] hover:bg-[hsl(0_0%_100%/0.3)]"
          >
            {t("Stop")}
          </button>
        )}
      </div>
    </div>
  )
}
