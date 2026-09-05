"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import type { FocusLogEntry } from "@/lib/pomodoro-types"

interface FocusChartProps {
  focusLog: FocusLogEntry[]
}

function formatMinutes(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function FocusChart({ focusLog }: FocusChartProps) {
  const last14 = focusLog.slice(-14)

  if (last14.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto mt-8">
        <div className="border-b border-[hsl(0_0%_100%/0.2)] pb-3 mb-4">
          <h2 className="text-lg font-bold text-[hsl(0_0%_100%)]">
            Focus Time
          </h2>
        </div>
        <div className="bg-[hsl(0_0%_100%/0.08)] rounded-lg p-8 text-center">
          <p className="text-sm text-[hsl(0_0%_100%/0.5)]">
            No focus data yet. Complete a pomodoro to start tracking.
          </p>
        </div>
      </div>
    )
  }

  const chartData = last14.map((entry) => {
    const parts = entry.date.split("-")
    const shortDate = `${parts[1]}/${parts[2]}`
    return {
      date: shortDate,
      fullDate: entry.date,
      minutes: Math.round(entry.totalSeconds / 60),
      totalSeconds: entry.totalSeconds,
    }
  })

  const totalSeconds = last14.reduce((a, e) => a + e.totalSeconds, 0)
  const avgSeconds =
    last14.length > 0 ? Math.round(totalSeconds / last14.length) : 0

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <div className="border-b border-[hsl(0_0%_100%/0.2)] pb-3 mb-4">
        <h2 className="text-lg font-bold text-[hsl(0_0%_100%)]">
          Focus Time
        </h2>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-[hsl(0_0%_100%/0.08)] rounded-lg px-4 py-3">
          <p className="text-xs text-[hsl(0_0%_100%/0.5)] mb-0.5">Total</p>
          <p className="text-sm font-semibold text-[hsl(0_0%_100%)]">
            {formatMinutes(totalSeconds)}
          </p>
        </div>
        <div className="flex-1 bg-[hsl(0_0%_100%/0.08)] rounded-lg px-4 py-3">
          <p className="text-xs text-[hsl(0_0%_100%/0.5)] mb-0.5">
            Daily Avg
          </p>
          <p className="text-sm font-semibold text-[hsl(0_0%_100%)]">
            {formatMinutes(avgSeconds)}
          </p>
        </div>
        <div className="flex-1 bg-[hsl(0_0%_100%/0.08)] rounded-lg px-4 py-3">
          <p className="text-xs text-[hsl(0_0%_100%/0.5)] mb-0.5">Days</p>
          <p className="text-sm font-semibold text-[hsl(0_0%_100%)]">
            {last14.length}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-[hsl(0_0%_100%/0.08)] rounded-lg p-4">
        <ChartContainer
          config={{
            minutes: {
              label: "Focus (min)",
              color: "hsla(0,0%,100%,0.6)",
            },
          }}
          className="h-[200px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsla(0,0%,100%,0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsla(0,0%,100%,0.5)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "hsla(0,0%,100%,0.1)" }}
              />
              <YAxis
                tick={{ fill: "hsla(0,0%,100%,0.5)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "hsla(0,0%,100%,0.1)" }}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip
                cursor={{ fill: "hsla(0,0%,100%,0.06)" }}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  border: "1px solid hsla(0,0%,100%,0.2)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "white",
                }}
                labelStyle={{ color: "hsla(0,0%,100%,0.9)" }}
                formatter={(value: number) => [`${value} min`, "Focus"]}
              />
              <Bar
                dataKey="minutes"
                fill="hsla(0,0%,100%,0.5)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}