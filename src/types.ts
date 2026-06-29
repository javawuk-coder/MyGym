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
  maxReps?: boolean          // 고정 reps 대신 max 수행 (Max Cal, Max Wall Walk 등)
  roundType?: 'all' | 'odd' | 'even'  // Interval even/odd split
  note?: string              // 추가 메모 (e.g. "@ 55/75 lb")
}

export type WorkoutFormatType = 'sets_reps' | 'tabata' | 'for_time' | 'amrap' | 'emom' | 'interval'

export interface WorkoutFormat {
  type: WorkoutFormatType

  // ── Tabata ──────────────────────────────────────────────────
  // 운동별 work/rest 인터벌을 반복, 여러 운동 블록을 여러 세트 돌리는 구조
  workSec?: number      // 운동 시간(초) — 기본 20
  restSec?: number      // 운동 간 휴식(초) — 기본 10
  tabataRounds?: number // 운동당 인터벌 횟수 — 기본 8
  tabataSets?: number   // 전체 블록 반복 세트 수 — 기본 1
  setRestSec?: number   // 세트 간 full 휴식(초) — 기본 120

  // ── For Time (RFT) ──────────────────────────────────────────
  // 정해진 운동량을 최대한 빠르게 완료. 점수 = 완료 시간
  // 운동량: 각 exercise의 reps × formatRounds
  timeCap?: number      // 제한 시간(분) — 없으면 무제한
  formatRounds?: number // circuit 반복 라운드 수 — 기본 1 (RFT에서 주로 사용)

  // ── AMRAP ───────────────────────────────────────────────────
  // 정해진 시간 안에 circuit를 최대한 반복. 점수 = rounds + reps
  // 운동량: 각 exercise의 reps per round
  duration?: number     // 총 시간(분) — AMRAP / EMOM 공용

  // ── EMOM ────────────────────────────────────────────────────
  // 매 X분 시작에 정해진 reps 수행, 나머지 시간이 휴식. 점수 = 완료율
  every?: number        // X분마다 — 기본 1 (E1MOM), 2=E2MOM, 3=E3MOM

  // ── Interval ────────────────────────────────────────────────
  workMin?: number      // 운동 시간(분) — 기본 1
  restMin?: number      // 휴식 시간(분) — 기본 1
  intervalRounds?: number // 총 라운드 수 — 기본 5
}

export interface Routine {
  id?: string
  name: string
  exercises: RoutineExercise[]
  format?: WorkoutFormat
  createdAt?: unknown
}
