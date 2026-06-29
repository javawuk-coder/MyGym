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

export interface RoutineExercise {
  exId: string
  sets: number
  reps: number
}

export type WorkoutFormatType = 'sets_reps' | 'tabata' | 'for_time' | 'amrap' | 'emom' | 'interval'

export interface WorkoutFormat {
  type: WorkoutFormatType
  // tabata
  workSec?: number
  restSec?: number
  rounds?: number
  // for_time
  timeCap?: number
  // amrap / emom duration
  duration?: number
  // emom
  every?: number
  // interval
  workMin?: number
  restMin?: number
}

export interface Routine {
  id?: string
  name: string
  exercises: RoutineExercise[]
  format?: WorkoutFormat
  createdAt?: unknown
}
