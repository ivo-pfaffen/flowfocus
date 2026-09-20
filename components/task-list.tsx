"use client"

import { useLocale } from "@/components/locale-provider"

import React from "react"
import { useState } from "react"
import {
  Plus,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  GripVertical,
} from "lucide-react"
import type { Task, Subtask } from "@/lib/pomodoro-types"

interface TaskListProps {
  tasks: Task[]
  setTasks: (fn: (prev: Task[]) => Task[]) => void
  activeTaskId: string | null
  setActiveTaskId: (id: string | null) => void
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function TaskList({
  tasks,
  setTasks,
  activeTaskId,
  setActiveTaskId,
}: TaskListProps) {
  const { t } = useLocale()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newEstimated, setNewEstimated] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editEstimated, setEditEstimated] = useState(1)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [addingSubtaskToId, setAddingSubtaskToId] = useState<string | null>(
    null
  )
  const [draggingSubtaskId, setDraggingSubtaskId] = useState<string | null>(
    null
  )

  const handleAddTask = () => {
    if (!newTitle.trim()) return
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      estimatedPomodoros: Math.max(1, newEstimated),
      completedPomodoros: 0,
      totalSecondsSpent: 0,
      done: false,
      subtasks: [],
    }
    setTasks((prev) => [...prev, task])
    setNewTitle("")
    setNewEstimated(1)
    setShowAddForm(false)
  }

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    if (activeTaskId === id) setActiveTaskId(null)
    setMenuOpenId(null)
  }

  const handleSelectActive = (id: string) => {
    setActiveTaskId(activeTaskId === id ? null : id)
  }

  const handleToggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedTaskId(expandedTaskId === id ? null : id)
  }

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const updatedSubtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s
        )
        const allDone =
          updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.done)
        return { ...t, subtasks: updatedSubtasks, done: allDone }
      })
    )
  }

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return
    const subtask: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      done: false,
    }
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const newSubtasks = [...t.subtasks, subtask]
        return { ...t, subtasks: newSubtasks, done: false }
      })
    )
    setNewSubtaskTitle("")
    setAddingSubtaskToId(null)
  }

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const updatedSubtasks = t.subtasks.filter((s) => s.id !== subtaskId)
        const allDone =
          updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.done)
        return { ...t, subtasks: updatedSubtasks, done: allDone }
      })
    )
  }

  const moveSubtask = (taskId: string, fromId: string, toId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const from = t.subtasks.findIndex((s) => s.id === fromId)
        const to = t.subtasks.findIndex((s) => s.id === toId)
        if (from < 0 || to < 0 || from === to) return t
        const subtasks = [...t.subtasks]
        const [moved] = subtasks.splice(from, 1)
        subtasks.splice(to, 0, moved)
        return { ...t, subtasks }
      })
    )
  }

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditEstimated(task.estimatedPomodoros)
    setMenuOpenId(null)
  }

  const handleSaveEdit = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: editTitle.trim() || t.title,
              estimatedPomodoros: Math.max(1, editEstimated),
            }
          : t
      )
    )
    setEditingId(null)
  }

  const moveTask = (id: string, direction: "up" | "down") => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      if (idx < 0) return prev
      const newIdx = direction === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return next
    })
    setMenuOpenId(null)
  }

  const clearDone = () => {
    setTasks((prev) => prev.filter((t) => !t.done))
  }

  const totalEstimated = tasks.reduce((a, t) => a + t.estimatedPomodoros, 0)
  const totalCompleted = tasks.reduce((a, t) => a + t.completedPomodoros, 0)
  const totalTime = tasks.reduce((a, t) => a + t.totalSecondsSpent, 0)

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[hsl(0_0%_100%/0.2)]">
        <h2 className="text-lg font-bold text-[hsl(0_0%_100%)]">{t("Tasks")}</h2>
        {tasks.some((t) => t.done) && (
          <button
            onClick={clearDone}
            className="text-xs text-[hsl(0_0%_100%/0.6)] hover:text-[hsl(0_0%_100%)] transition-colors"
          >
            {t("Clear done")}
          </button>
        )}
      </div>

      {/* Active task indicator */}
      {activeTaskId && (
        <div className="mb-3 px-3 py-2 rounded-md bg-[hsl(0_0%_0%/0.08)] text-sm text-[hsl(0_0%_100%/0.8)]">
          {t("Working on:")}{" "}
          <span className="font-semibold text-[hsl(0_0%_100%)]">
            {tasks.find((t) => t.id === activeTaskId)?.title}
          </span>
        </div>
      )}

      {/* Task items */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id}>
            {editingId === task.id ? (
              <div className="bg-[hsl(0_0%_100%)] rounded-lg p-4 text-[hsl(0_0%_20%)]">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)] text-sm font-medium mb-3 focus:outline-none focus:ring-2 focus:ring-[hsl(0_45%_55%/0.5)]"
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSaveEdit(task.id)
                  }
                />
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs text-[hsl(0_0%_50%)]">
                    {t("Est. Pomodoros:")}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setEditEstimated(Math.max(1, editEstimated - 1))
                      }
                      className="w-7 h-7 rounded bg-[hsl(0_0%_90%)] flex items-center justify-center text-[hsl(0_0%_40%)] hover:bg-[hsl(0_0%_85%)]"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-[hsl(0_0%_20%)]">
                      {editEstimated}
                    </span>
                    <button
                      onClick={() => setEditEstimated(editEstimated + 1)}
                      className="w-7 h-7 rounded bg-[hsl(0_0%_90%)] flex items-center justify-center text-[hsl(0_0%_40%)] hover:bg-[hsl(0_0%_85%)]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-1.5 text-sm text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_30%)]"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={() => handleSaveEdit(task.id)}
                    className="px-4 py-1.5 text-sm bg-[rgb(175,77,77)] text-[hsl(0_0%_100%)] rounded-md font-medium hover:opacity-90"
                  >
                    {t("Save")}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`group flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-all ${
                    activeTaskId === task.id
                      ? "bg-[hsl(0_0%_0%/0.15)] ring-2 ring-[hsl(0_0%_100%/0.3)]"
                      : "bg-[hsl(0_0%_100%/0.08)] hover:bg-[hsl(0_0%_100%/0.12)]"
                  }`}
                  onClick={() => handleSelectActive(task.id)}
                >
                  {/* Expand toggle for subtasks */}
                  <button
                    onClick={(e) => handleToggleExpand(task.id, e)}
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[hsl(0_0%_100%/0.5)] hover:text-[hsl(0_0%_100%)] transition-colors"
                    aria-label={t("Toggle subtasks")}
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${expandedTaskId === task.id ? "rotate-90" : ""}`}
                    />
                  </button>

                  {/* Task info — no checkbox, strikethrough when all subtasks done */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate text-[hsl(0_0%_100%)] ${
                        task.done ? "line-through opacity-50" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[hsl(0_0%_100%/0.6)]">
                        {task.completedPomodoros}/{task.estimatedPomodoros}{" "}
                        pomodoros
                      </span>
                      {task.totalSecondsSpent > 0 && (
                        <span className="text-xs text-[hsl(0_0%_100%/0.5)]">
                          {formatDuration(task.totalSecondsSpent)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(
                          menuOpenId === task.id ? null : task.id
                        )
                      }}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[hsl(0_0%_100%/0.1)] transition-all text-[hsl(0_0%_100%/0.6)]"
                      aria-label={t("Task options")}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpenId === task.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-[hsl(0_0%_100%)] rounded-lg shadow-xl py-1 min-w-[140px] text-[hsl(0_0%_20%)]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEdit(task)
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)]"
                          >
                            {t("Edit")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveTask(task.id, "up")
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(0_0%_95%)] flex items-center gap-2 text-[hsl(0_0%_20%)]"
                          >
                            <ChevronUp className="w-3 h-3" /> {t("Move up")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveTask(task.id, "down")
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(0_0%_95%)] flex items-center gap-2 text-[hsl(0_0%_20%)]"
                          >
                            <ChevronDown className="w-3 h-3" /> {t("Move down")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTask(task.id)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-[hsl(0_55%_50%)] hover:bg-[hsl(0_80%_97%)]"
                          >
                            <span className="flex items-center gap-2">
                              <Trash2 className="w-3 h-3" /> {t("Delete")}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Subtask list (expanded) */}
                {expandedTaskId === task.id && (
                  <div className="ml-8 mt-1 mb-1 space-y-1">
                    {task.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        draggable
                        onDragStart={() => setDraggingSubtaskId(subtask.id)}
                        onDragEnd={() => setDraggingSubtaskId(null)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (draggingSubtaskId && draggingSubtaskId !== subtask.id) {
                            moveSubtask(task.id, draggingSubtaskId, subtask.id)
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md bg-[hsl(0_0%_100%/0.05)] group/sub cursor-grab active:cursor-grabbing ${
                          draggingSubtaskId === subtask.id ? "opacity-40" : ""
                        }`}
                      >
                        <GripVertical className="flex-shrink-0 w-3.5 h-3.5 text-[hsl(0_0%_100%/0.25)] group-hover/sub:text-[hsl(0_0%_100%/0.5)] transition-colors" />
                        <button
                          onClick={() =>
                            handleToggleSubtask(task.id, subtask.id)
                          }
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            subtask.done
                              ? "bg-[hsl(0_0%_100%)] border-[hsl(0_0%_100%)]"
                              : "border-[hsl(0_0%_100%/0.35)] hover:border-[hsl(0_0%_100%/0.6)]"
                          }`}
                          aria-label={
                            subtask.done
                              ? t("Mark subtask incomplete")
                              : t("Mark subtask complete")
                          }
                        >
                          {subtask.done && (
                            <Check className="w-3 h-3 text-[rgb(175,77,77)]" />
                          )}
                        </button>
                        <span
                          className={`flex-1 text-sm text-[hsl(0_0%_100%)] ${subtask.done ? "line-through opacity-50" : ""}`}
                        >
                          {subtask.title}
                        </span>
                        <button
                          onClick={() =>
                            handleDeleteSubtask(task.id, subtask.id)
                          }
                          className="opacity-0 group-hover/sub:opacity-100 p-1 rounded hover:bg-[hsl(0_0%_100%/0.1)] text-[hsl(0_0%_100%/0.4)] hover:text-[hsl(0_0%_100%/0.8)] transition-all"
                          aria-label={t("Delete subtask")}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add subtask */}
                    {addingSubtaskToId === task.id ? (
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <input
                          type="text"
                          placeholder={t("Subtask title...")}
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          autoFocus
                          className="flex-1 px-2 py-1.5 rounded bg-[hsl(0_0%_100%/0.1)] text-[hsl(0_0%_100%)] text-sm placeholder-[hsl(0_0%_100%/0.4)] focus:outline-none focus:ring-1 focus:ring-[hsl(0_0%_100%/0.3)]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleAddSubtask(task.id)
                            if (e.key === "Escape") {
                              setAddingSubtaskToId(null)
                              setNewSubtaskTitle("")
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddSubtask(task.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-[hsl(0_0%_100%/0.2)] text-[hsl(0_0%_100%)] rounded hover:bg-[hsl(0_0%_100%/0.3)]"
                        >
                          {t("Add")}
                        </button>
                        <button
                          onClick={() => {
                            setAddingSubtaskToId(null)
                            setNewSubtaskTitle("")
                          }}
                          className="px-2 py-1.5 text-xs text-[hsl(0_0%_100%/0.5)] hover:text-[hsl(0_0%_100%)]"
                        >
                          {t("Cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingSubtaskToId(task.id)
                          setNewSubtaskTitle("")
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-[hsl(0_0%_100%/0.5)] hover:text-[hsl(0_0%_100%/0.8)] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {t("Add subtask")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add task */}
      {showAddForm ? (
        <div className="mt-3 bg-[hsl(0_0%_100%)] rounded-lg p-4 text-[hsl(0_0%_20%)]">
          <input
            type="text"
            placeholder={t("What are you working on?")}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 rounded-md bg-[hsl(0_0%_95%)] text-[hsl(0_0%_20%)] text-sm placeholder-[hsl(0_0%_60%)] mb-3 focus:outline-none focus:ring-2 focus:ring-[hsl(0_45%_55%/0.5)]"
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          />
          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs text-[hsl(0_0%_50%)]">
              {t("Est. Pomodoros:")}
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNewEstimated(Math.max(1, newEstimated - 1))}
                className="w-7 h-7 rounded bg-[hsl(0_0%_90%)] flex items-center justify-center text-[hsl(0_0%_40%)] hover:bg-[hsl(0_0%_85%)]"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium text-[hsl(0_0%_20%)]">
                {newEstimated}
              </span>
              <button
                onClick={() => setNewEstimated(newEstimated + 1)}
                className="w-7 h-7 rounded bg-[hsl(0_0%_90%)] flex items-center justify-center text-[hsl(0_0%_40%)] hover:bg-[hsl(0_0%_85%)]"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewTitle("")
                setNewEstimated(1)
              }}
              className="px-4 py-1.5 text-sm text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_30%)]"
            >
              {t("Cancel")}
            </button>
            <button
              onClick={handleAddTask}
              className="px-4 py-1.5 text-sm bg-[rgb(175,77,77)] text-[hsl(0_0%_100%)] rounded-md font-medium hover:opacity-90 disabled:opacity-50"
              disabled={!newTitle.trim()}
            >
              {t("Save")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-3 w-full py-3 rounded-lg border-2 border-dashed border-[hsl(0_0%_100%/0.25)] text-[hsl(0_0%_100%/0.6)] hover:border-[hsl(0_0%_100%/0.4)] hover:text-[hsl(0_0%_100%)] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t("Add Task")}
        </button>
      )}

      {/* Summary */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[hsl(0_0%_100%/0.2)] flex items-center justify-between text-xs text-[hsl(0_0%_100%/0.6)]">
          <span>
            {totalCompleted}/{totalEstimated} pomodoros
          </span>
          {totalTime > 0 && <span>Total: {formatDuration(totalTime)}</span>}
        </div>
      )}
    </div>
  )
}
