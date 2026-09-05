export type FocusEvent =
  | "focus_start"
  | "focus_qualified"
  | "focus_goal_reached"
  | "focus_overtime"
  | "focus_complete"
  | "focus_abandon"
  | "focus_return"

type Parameters = Record<string, number | string>
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">
const ACTIVE_DAYS_KEY = "flowfocus-analytics-active-days"

// One tracker per timer attempt. Pausing/resuming must not create a new start.
export function createFocusTracker(
  send: (event: FocusEvent, parameters: Parameters) => void,
  storage?: Storage,
  now = () => new Date(),
) {
  let started = false
  const milestones = new Set<FocusEvent>()
  let memoryDays: { first: string; last: string } | undefined

  function emit(event: FocusEvent, elapsed: number, goal: number) {
    // Analytics must never interfere with timer controls, including blocked storage.
    try { send(event, { focus_seconds: elapsed, goal_seconds: goal }) } catch {}
  }

  function activeDay() {
    const today = now().toISOString().slice(0, 10)
    let days = memoryDays
    try {
      const saved = JSON.parse(storage?.getItem(ACTIVE_DAYS_KEY) || "null")
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved.first) && /^\d{4}-\d{2}-\d{2}$/.test(saved.last)) days = saved
    } catch {}
    if (days?.last === today) return
    if (days && today > days.first) {
      const daysSinceFirst = Math.round((Date.parse(today) - Date.parse(days.first)) / 86400000)
      try { send("focus_return", { days_since_first_focus: daysSinceFirst }) } catch {}
    }
    memoryDays = { first: days?.first || today, last: today }
    try { storage?.setItem(ACTIVE_DAYS_KEY, JSON.stringify(memoryDays)) } catch {}
  }

  return {
    start(goal: number) {
      if (started) return
      started = true
      emit("focus_start", 0, goal)
    },
    progress(elapsed: number, goal: number) {
      if (!started || goal <= 0) return
      const checkpoints: [FocusEvent, boolean][] = [
        ["focus_qualified", elapsed >= 300],
        ["focus_goal_reached", elapsed >= goal],
        ["focus_overtime", elapsed > goal],
      ]
      for (const [event, reached] of checkpoints) {
        if (!reached || milestones.has(event)) continue
        milestones.add(event)
        emit(event, elapsed, goal)
        if (event === "focus_qualified") activeDay()
      }
    },
    end(elapsed: number, goal: number, reason: "stop" | "switch") {
      if (started) {
        this.progress(elapsed, goal)
        const event = reason === "stop" && elapsed >= goal ? "focus_complete" : "focus_abandon"
        try { send(event, { focus_seconds: elapsed, goal_seconds: goal, end_reason: reason }) } catch {}
      }
      this.reset()
    },
    reset() {
      started = false
      milestones.clear()
    },
  }
}
