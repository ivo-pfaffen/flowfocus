export type Locale = "en" | "es"

export const spanish = {
  "Mark subtask incomplete": "Marcar subtarea como pendiente",
  "Mark subtask complete": "Marcar subtarea como completada",
  "Settings": "Ajustes",
  "Timer Settings": "Ajustes del temporizador",
  "Close settings": "Cerrar ajustes",
  "Time (minutes)": "Tiempo (minutos)",
  "Pomodoro": "Pomodoro",
  "Short Break": "Descanso corto",
  "Long Break": "Descanso largo",
  "Long Break Interval": "Intervalo de descanso largo",
  "Long break after every N pomodoros": "Descanso largo cada N pomodoros",
  "Day Start Hour": "Hora de inicio del día",
  "When does your day start for the focus chart?": "¿A qué hora empieza tu día para el gráfico de concentración?",
  "(midnight)": "(medianoche)",
  "(noon)": "(mediodía)",
  "This will clear all tasks, settings, and focus history. Are you sure?": "Se borrarán todas las tareas, los ajustes y el historial de concentración. ¿Quieres continuar?",
  "Cancel": "Cancelar",
  "Yes, Reset Everything": "Sí, restablecer todo",
  "Reset All Data": "Restablecer todos los datos",
  "Save": "Guardar",
  "Tasks": "Tareas",
  "Clear done": "Borrar completadas",
  "Working on:": "Trabajando en:",
  "Est. Pomodoros:": "Pomodoros estimados:",
  "Toggle subtasks": "Mostrar u ocultar subtareas",
  "Task options": "Opciones de la tarea",
  "Edit": "Editar",
  "Move up": "Subir",
  "Move down": "Bajar",
  "Delete": "Eliminar",
  "Delete subtask": "Eliminar subtarea",
  "Subtask title...": "Título de la subtarea...",
  "Add": "Añadir",
  "Add subtask": "Añadir subtarea",
  "What are you working on?": "¿En qué estás trabajando?",
  "Add Task": "Añadir tarea",
  "Mark as done": "Marcar como completada",
  "Mark as not done": "Marcar como pendiente",
  "Mark as incomplete": "Marcar como pendiente",
  "Mark as complete": "Marcar como completada",
  "Focus Time": "Tiempo de concentración",
  "No focus data yet. Complete a pomodoro to start tracking.": "Todavía no hay datos. Completa un pomodoro para empezar.",
  "Total": "Total",
  "Daily Avg": "Promedio diario",
  "Days": "Días",
  "Focus (min)": "Concentración (min)",
  "Focus": "Concentración",
  "Break": "Descanso",
  "Focus Forest": "Bosque de concentración",
  "Complete a pomodoro to plant your first tree!": "¡Completa un pomodoro para plantar tu primer árbol!",
  "tree": "árbol",
  "trees": "árboles",
  "Time to focus!": "¡Hora de concentrarte!",
  "Time for a break!": "¡Hora de descansar!",
  "Time for a long break!": "¡Hora de un descanso largo!",
  "The timer is still running. Are you sure you want to switch?": "El temporizador sigue en marcha. ¿Quieres cambiar de modo?",
  "Start": "Iniciar",
  "Pause": "Pausar",
  "Stop": "Terminar",
  "Flowfocus - Pomodoro Timer": "Flowfocus - Temporizador Pomodoro",
  "session": "sesión"
} as const

export type Message = keyof typeof spanish
export type Translate = (message: Message) => string

export function resolveLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0]
    if (base === "es" || base === "en") return base
  }
  return "en"
}

export function translate(locale: Locale, message: Message): string {
  return locale === "es" ? spanish[message] : message
}
