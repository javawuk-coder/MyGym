export type LogType = 'weight_reps' | 'reps_only' | 'time' | 'cardio'

export interface Exercise {
  id: string
  name: string
  ko?: string
  muscle: string
  equipment: string
  type?: string
  log_type: LogType
  custom?: boolean
}

export interface ExerciseSet {
  weight?: number
  reps?: number
  duration?: number
}

export interface LogEntry {
  exId: string
  log_type: LogType
  sets?: ExerciseSet[]
  // cardio fields
  dist?: number
  time?: number
  cal?: number
}

export interface DayLog {
  date: string // YYYY-MM-DD
  exercises: LogEntry[]
}

export interface Routine {
  id?: string
  name: string
  exercises: string[] // exercise ids
  createdAt?: unknown
}
