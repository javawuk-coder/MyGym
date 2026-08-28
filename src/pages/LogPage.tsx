import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconPlus, IconTrash, IconSearch, IconChevronLeft, IconChevronRight, IconCheck, IconArrowUp, IconArrowDown, IconBarbell, IconShare } from '@tabler/icons-react'
import type { Exercise, DayLog, LogEntry, LogType, Routine, RoutineExercise, ExerciseSet, WorkoutFormat } from '../types'
import { tr, exName, muscleLabel, type Lang } from '../lib/i18n'
import { shareWorkout } from '../lib/shareWorkout'
const MB: Record<string, string> = {
  chest: 'bc', back: 'bb', legs: 'bl', shoulder: 'bs', arm: 'ba',
  core: 'bco', glute: 'bg', hiit: 'bhiit', cardio: 'bcard', custom: 'bx',
}
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function playBeep(freq: number, duration: number, vol: number) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    osc.onended = () => ctx.close()
  } catch { /* unsupported */ }
}

function toKg(v: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(v / 2.205 * 10) / 10 : parseFloat(String(v)) || 0 }
function fromKg(kg: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(kg * 2.205 * 10) / 10 : kg }
function today() { return new Date().toISOString().slice(0, 10) }
function toLocalDate(dateStr: string) { return new Date(dateStr + 'T00:00:00') }
const LOCALE_MAP: Record<string, string> = { ko: 'ko-KR', en: 'en-US', vi: 'vi-VN' }
function formatDateHeader(d: string, locale = 'ko-KR') {
  return toLocalDate(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}
function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

interface SetRow { weight: string; reps: string; duration: string }
interface DraftEx {
  draftId: string  // stable across reorder/delete — used as setKey prefix
  exId: string
  rows: SetRow[]
  cardio: { dist: string; time: string; cal: string }
  exNote: string
}
type ModalState = null | 'pick' | 'routine-select' | 'ex-select' | 'fill'

interface TabataState {
  phase: 'ready' | 'work' | 'rest' | 'setRest' | 'done'
  seconds: number
  set: number; ex: number; round: number; paused: boolean
  workSec: number; restSec: number; setRestSec: number
  totalRounds: number; totalSets: number; exCount: number
}
function initTabata(fmt: WorkoutFormat, exCount: number): TabataState {
  return {
    phase: 'ready', seconds: fmt.workSec ?? 20,
    set: 1, ex: 0, round: 1, paused: false,
    workSec: fmt.workSec ?? 20, restSec: fmt.restSec ?? 10, setRestSec: fmt.setRestSec ?? 120,
    totalRounds: fmt.tabataRounds ?? 8, totalSets: fmt.tabataSets ?? 1, exCount,
  }
}
function nextTabataState(s: TabataState): TabataState {
  if (s.phase === 'work') {
    if (s.round >= s.totalRounds && s.ex >= s.exCount - 1 && s.set >= s.totalSets)
      return { ...s, phase: 'done', seconds: 0 }
    return { ...s, phase: 'rest', seconds: s.restSec }
  }
  if (s.phase === 'rest') {
    if (s.round < s.totalRounds) return { ...s, round: s.round + 1, phase: 'work', seconds: s.workSec }
    if (s.ex < s.exCount - 1) return { ...s, ex: s.ex + 1, round: 1, phase: 'work', seconds: s.workSec }
    if (s.set < s.totalSets) return { ...s, set: s.set + 1, ex: 0, round: 1, phase: 'setRest', seconds: s.setRestSec }
    return { ...s, phase: 'done', seconds: 0 }
  }
  if (s.phase === 'setRest') return { ...s, round: 1, phase: 'work', seconds: s.workSec }
  return s
}

let _draftSeq = 0
function newDraftId() { return String(++_draftSeq) }

function makeRows(count: number, reps?: number, weight?: number): SetRow[] {
  return Array.from({ length: count }, () => ({
    weight: weight != null ? String(weight) : '',
    reps: reps != null ? String(reps) : '',
    duration: '',
  }))
}
function draftFromRoutine(routine: Routine, allExercises: Exercise[], unit: 'kg' | 'lb', logs: DayLog[]): DraftEx[] {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  return routine.exercises.map(re => {
    const ex = allExercises.find(e => e.id === re.exId)
    const lt = ex?.log_type || 'weight_reps'
    if (lt === 'cardio') return { draftId: newDraftId(), exId: re.exId, rows: [], cardio: { dist: '', time: '', cal: '' }, exNote: re.note ?? '' }
    // 가장 최근 로그에서 해당 운동의 마지막 세트 값 추출
    let histWeight: number | undefined
    let histReps: number | undefined
    let histDuration: number | undefined
    for (const dayLog of sortedLogs) {
      const entry = dayLog.exercises.find(e => e.exId === re.exId)
      if (entry?.sets?.length) {
        const lastSet = entry.sets[entry.sets.length - 1]
        if (lt === 'weight_reps') {
          if (lastSet.weight != null && lastSet.weight >= 0) histWeight = fromKg(lastSet.weight, unit)
          if (lastSet.reps != null && lastSet.reps > 0) histReps = lastSet.reps
        } else if (lt === 'reps_only') {
          if (lastSet.reps != null && lastSet.reps > 0) histReps = lastSet.reps
        } else {
          if (lastSet.duration != null && lastSet.duration > 0) histDuration = lastSet.duration
        }
        break
      }
    }
    const displayWeight = histWeight ?? (lt === 'weight_reps' && re.defaultWeight != null && re.defaultWeight > 0 ? fromKg(re.defaultWeight, unit) : undefined)
    const prefilledReps = histReps ?? (re.reps && re.reps > 0 ? re.reps : undefined)
    const rows = makeRows(re.sets || 3, prefilledReps, displayWeight)
    if (histDuration != null) rows.forEach(r => { r.duration = String(histDuration) })
    return {
      draftId: newDraftId(),
      exId: re.exId,
      rows,
      cardio: { dist: '', time: '', cal: '' },
      exNote: re.note ?? '',
    }
  })
}

function daySummary(log: DayLog | undefined) {
  if (!log) return null
  let vol = 0, sets = 0, reps = 0, pr = 0
  for (const e of log.exercises) {
    for (const s of (e.sets || [])) {
      sets++
      reps += s.reps || 0
      vol += (s.weight || 0) * (s.reps || 0)
      if (s.pr) pr++
    }
  }
  return { vol, sets, reps, pr, exCount: log.exercises.length }
}

interface Props {
  logs: DayLog[]
  routines: (Routine & { id: string })[]
  allExercises: Exercise[]
  unit: 'kg' | 'lb'
  lang: Lang
  onAddEntries: (date: string, entries: LogEntry[], meta?: { routineId?: string; routineName?: string }) => Promise<void>
  onDeleteEntry: (date: string, index: number) => Promise<void>
  onSaveRoutineNotes?: (routineId: string, notes: { exId: string; note?: string }[]) => Promise<void>
  onPatchRoutineExercises?: (routineId: string, exercises: RoutineExercise[]) => Promise<void>
  onLoggingChange?: (active: boolean) => void
  initialRoutine?: (Routine & { id: string }) | null
  onConsumedInitial?: () => void
}

export default function LogPage({
  logs, routines, allExercises, unit, lang,
  onAddEntries, onDeleteEntry, onSaveRoutineNotes, onPatchRoutineExercises, onLoggingChange,
  initialRoutine, onConsumedInitial,
}: Props) {
  const todayStr = today()
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [calMonth, setCalMonth] = useState(todayStr.slice(0, 7)) // YYYY-MM
  const [modal, setModal] = useState<ModalState>(null)
  const [fillTitle, setFillTitle] = useState('')
  const [draftExes, setDraftExes] = useState<DraftEx[]>([])
  const [exSearch, setExSearch] = useState('')
  const [routineSearch, setRoutineSearch] = useState('')
  const [showAddExInFill, setShowAddExInFill] = useState(false)
  const [addExSearch, setAddExSearch] = useState('')
  const [currentRoutineId, setCurrentRoutineId] = useState<string | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [tabataState, setTabataState] = useState<TabataState | null>(null)
  const tabataTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Screen Wake Lock ─────────────────────────────────────────
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const acquireWakeLock = async () => {
    try {
      if (!('wakeLock' in navigator)) return
      const sentinel = await navigator.wakeLock.request('screen')
      wakeLockRef.current = sentinel
      sentinel.addEventListener('release', () => {
        if (wakeLockRef.current === sentinel) wakeLockRef.current = null
        if (phaseRef.current !== 'idle') acquireWakeLock()
      })
    } catch { /* 권한 거부 시 무시 */ }
  }
  const releaseWakeLock = () => {
    wakeLockRef.current?.release()
    wakeLockRef.current = null
  }

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && phaseRef.current !== 'idle' && !wakeLockRef.current) {
        acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer state ───────────────────────────────────────────────
  // timerPhase: 'idle' | 'working' | 'resting'
  const [timerPhase, setTimerPhase] = useState<'idle' | 'working' | 'resting'>('idle')
  const [accWorkMs, setAccWorkMs] = useState(0)   // 누적 운동 시간
  const [accRestMs, setAccRestMs] = useState(0)   // 누적 휴식 시간
  const [segStartedAt, setSegStartedAt] = useState<number | null>(null)
  const [, setTick] = useState(0)                 // 1초마다 re-render용
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set())
  const [lastCompletedLabel, setLastCompletedLabel] = useState('')
  const [lastCompletedDraftId, setLastCompletedDraftId] = useState<string | null>(null)
  const [lastCompletedRi, setLastCompletedRi] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<'idle' | 'working' | 'resting'>('idle')
  const segStartRef = useRef<number | null>(null)
  const accWorkRef = useRef(0)
  const accRestRef = useRef(0)

  useEffect(() => {
    if (modal === 'fill' && timerPhase !== 'idle') {
      timerRef.current = setInterval(() => setTick(t => t + 1), 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [modal, timerPhase])

  useEffect(() => {
    onLoggingChange?.(modal === 'fill')
  }, [modal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tabata countdown ──────────────────────────────────────────
  useEffect(() => {
    if (tabataTimerRef.current) clearInterval(tabataTimerRef.current)
    if (!tabataState || tabataState.phase === 'ready' || tabataState.phase === 'done' || tabataState.paused) return
    tabataTimerRef.current = setInterval(() => {
      setTabataState(prev => {
        if (!prev || prev.paused) return prev
        if (prev.seconds > 1) return { ...prev, seconds: prev.seconds - 1 }
        return nextTabataState(prev)
      })
    }, 1000)
    return () => { if (tabataTimerRef.current) clearInterval(tabataTimerRef.current) }
  }, [tabataState?.phase, tabataState?.paused]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tabataState?.phase === 'done') setShowFinishConfirm(true)
    // Phase-start beep: signals work/rest/setRest transition
    if (tabataState?.phase === 'work') playBeep(1047, 0.12, 0.4)       // C6 — energetic
    else if (tabataState?.phase === 'rest') playBeep(659, 0.12, 0.3)    // E5 — softer
    else if (tabataState?.phase === 'setRest') playBeep(440, 0.2, 0.3)  // A4 — low, long rest
  }, [tabataState?.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown beep: last 5 seconds of each phase
  useEffect(() => {
    if (!tabataState || tabataState.paused) return
    const { phase, seconds } = tabataState
    if (phase === 'ready' || phase === 'done' || seconds <= 0 || seconds > 5) return
    // seconds 5→4→3→2: short beep. seconds 1: final beep (higher, longer)
    if (seconds === 1) playBeep(1319, 0.22, 0.45)  // E6 — final
    else playBeep(880, 0.07, 0.25)                  // A5 — tick
  }, [tabataState?.seconds]) // eslint-disable-line react-hooks/exhaustive-deps

  const startWorkout = () => {
    const now = Date.now()
    phaseRef.current = 'working'
    segStartRef.current = now
    accWorkRef.current = 0
    accRestRef.current = 0
    setTimerPhase('working')
    setSegStartedAt(now)
    setAccWorkMs(0)
    setAccRestMs(0)
    setTick(0)
    setCompletedSets(new Set())
    setLastCompletedLabel('')
    setLastCompletedDraftId(null)
    setLastCompletedRi(-1)
  }

  // ✓ 완료 → 운동 시간 누적, 휴식 시작
  const completeSet = (key: string, label: string) => {
    const now = Date.now()
    if (phaseRef.current === 'working' && segStartRef.current !== null) {
      accWorkRef.current += now - segStartRef.current
      setAccWorkMs(accWorkRef.current)
    }
    // key = "${draftId}-${ri}" — draftId is stable across reorder/delete
    const lastDash = key.lastIndexOf('-')
    const draftId = key.slice(0, lastDash)
    const ri = parseInt(key.slice(lastDash + 1), 10)
    const di = draftExes.findIndex(d => d.draftId === draftId)
    setLastCompletedLabel(label)
    setLastCompletedDraftId(draftId)
    setLastCompletedRi(ri)
    phaseRef.current = 'resting'
    segStartRef.current = now
    setTimerPhase('resting')
    setSegStartedAt(now)

    // 이 세트까지 완료했을 때 남은 세트가 있는지 미리 확인
    const nextCompleted = new Set([...completedSets, key])
    const allDone = draftExes.every(d => d.rows.every((_, r) => nextCompleted.has(`${d.draftId}-${r}`)))

    setCompletedSets(prev => {
      const next = new Set([...prev, key])
      if (!allDone) {
        // 다음 미완료 set으로 스크롤
        let nextKey: string | null = null
        for (let d = di; d < draftExes.length; d++) {
          const startRi = d === di ? ri + 1 : 0
          for (let r = startRi; r < draftExes[d].rows.length; r++) {
            const k = `${draftExes[d].draftId}-${r}`
            if (!next.has(k)) { nextKey = k; break }
          }
          if (nextKey) break
        }
        if (nextKey) {
          setTimeout(() => {
            document.getElementById(`set-${nextKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 150)
        }
      }
      return next
    })

    // 모든 세트 완료 시 휴식 오버레이 대신 운동 완료 확인 다이얼로그 표시
    if (allDone) setShowFinishConfirm(true)
  }

  // 시작 버튼 → 휴식 시간 누적, 운동 시작
  const resumeWorkout = () => {
    const now = Date.now()
    if (phaseRef.current === 'resting' && segStartRef.current !== null) {
      accRestRef.current += now - segStartRef.current
      setAccRestMs(accRestRef.current)
    }
    phaseRef.current = 'working'
    segStartRef.current = now
    setTimerPhase('working')
    setSegStartedAt(now)
  }

  const segElapsed = segStartedAt !== null ? Date.now() - segStartedAt : 0
  const workMs = accWorkMs + (timerPhase === 'working' ? segElapsed : 0)
  const restMs = accRestMs + (timerPhase === 'resting' ? segElapsed : 0)
  const currentRestMs = timerPhase === 'resting' ? segElapsed : 0  // 현재 휴식 세션만 (오버레이용)
  const totalMs = workMs + restMs
  // 다음 세트 (같은 운동, 다음 row) — di를 draftId로 동적 조회해 reorder/delete 후에도 정확
  const lastCompletedDi = lastCompletedDraftId != null ? draftExes.findIndex(d => d.draftId === lastCompletedDraftId) : -1
  const sameExDraft = lastCompletedDi >= 0 ? (draftExes[lastCompletedDi] ?? null) : null
  const hasNextSetInEx = sameExDraft !== null && lastCompletedRi >= 0 && lastCompletedRi + 1 < sameExDraft.rows.length
  const sameExEntry = sameExDraft ? (allExercises.find(e => e.id === sameExDraft.exId) ?? null) : null
  const sameExNm = sameExEntry ? exName(sameExEntry, lang) : sameExDraft ? { main: sameExDraft.exId } : null
  const nextSetLabel = hasNextSetInEx && sameExNm ? `${tr(lang, 'setLabel')} ${lastCompletedRi + 2} — ${sameExNm.main}` : null
  // 다음 운동 (다음 DraftEx)
  const nextExDraft = lastCompletedDi >= 0 && lastCompletedDi + 1 < draftExes.length
    ? draftExes[lastCompletedDi + 1] : null
  const nextExEntry = nextExDraft ? (allExercises.find(e => e.id === nextExDraft.exId) ?? null) : null
  const nextExNm = nextExEntry ? exName(nextExEntry, lang) : nextExDraft ? { main: nextExDraft.exId } : null

  useEffect(() => {
    if (!initialRoutine) return
    setFillTitle(initialRoutine.name)
    setDraftExes(draftFromRoutine(initialRoutine, allExercises, unit, logs))
    setCurrentRoutineId(initialRoutine.id)
    setModal('fill')
    history.pushState({ filling: true }, '')
    startWorkout(); acquireWakeLock()
    if (initialRoutine.format?.type === 'tabata') setTabataState(initTabata(initialRoutine.format, initialRoutine.exercises.length))
    else setTabataState(null)
    onConsumedInitial?.()
  }, [initialRoutine]) // eslint-disable-line react-hooks/exhaustive-deps

  const getEx = (id: string) => allExercises.find(e => e.id === id)
  const selectedLog = logs.find(l => l.date === selectedDate)
  const logMap = Object.fromEntries(logs.map(l => [l.date, l]))

  // ── Calendar ─────────────────────────────────────────────────
  const [calYear, calMonthNum] = calMonth.split('-').map(Number)
  const firstDow = new Date(calYear, calMonthNum - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonthNum, 0).getDate()

  // 이달 날짜별 운동 타입 (calendar circle color)
  // HIIT는 log_type이 weight_reps일 수 있어 Exercise.muscle로 판단
  const monthDayColors = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${calMonth}-${String(i + 1).padStart(2, '0')}`
    const dayLog = logMap[d]
    if (!dayLog?.exercises?.length) return null
    const cats = dayLog.exercises.map(e => {
      const ex = allExercises.find(x => x.id === e.exId)
      if (ex?.muscle === 'hiit') return 'hiit'
      if (ex?.muscle === 'cardio' || e.log_type === 'cardio') return 'cardio'
      return 'weight'
    })
    if (cats.some(c => c === 'hiit')) return 'hiit'
    if (cats.some(c => c === 'weight')) return 'weight'
    return 'cardio'
  })

  const prevMonth = () => {
    const d = new Date(calYear, calMonthNum - 2, 1)
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const d = new Date(calYear, calMonthNum, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next <= todayStr.slice(0, 7)) setCalMonth(next)
  }
  const canGoNext = calMonth < todayStr.slice(0, 7)

  const selectDay = (dateStr: string) => {
    setSelectedDate(dateStr)
    setCalMonth(dateStr.slice(0, 7))
  }

  // ── Exercise summary ──────────────────────────────────────────
  const summarizeEntry = (entry: LogEntry): string => {
    const lt = entry.log_type || 'weight_reps'
    const sets = entry.sets || []
    const R = tr(lang, 'reps')
    const S = tr(lang, 'sets')
    const SEC = tr(lang, 'sec')
    const MIN = tr(lang, 'minUnit')
    if (lt === 'cardio') {
      const parts: string[] = []
      if (entry.dist) parts.push(`${entry.dist}km`)
      if (entry.time) parts.push(`${entry.time}${MIN}`)
      if (entry.cal) parts.push(`${entry.cal}kcal`)
      return parts.join(' · ') || '—'
    }
    if (!sets.length) return '—'
    if (lt === 'weight_reps') {
      const ws = sets.map(s => s.weight || 0)
      const rs = sets.map(s => s.reps || 0)
      if (ws.every(w => w === ws[0]) && rs.every(r => r === rs[0])) {
        return `${fromKg(ws[0], unit)}${unit} × ${rs[0]}${R} × ${sets.length}${S}`
      }
      return sets.map(s => `${fromKg(s.weight || 0, unit)}${unit}×${s.reps}${R}`).join(', ')
    }
    if (lt === 'reps_only') {
      const rs = sets.map(s => s.reps || 0)
      return rs.every(r => r === rs[0]) ? `${rs[0]}${R} × ${sets.length}${S}` : rs.map(r => `${r}${R}`).join(', ')
    }
    if (lt === 'time') {
      const ds = sets.map(s => s.duration || 0)
      return ds.every(d => d === ds[0]) ? `${ds[0]}${SEC} × ${sets.length}${S}` : ds.map(d => `${d}${SEC}`).join(', ')
    }
    return '—'
  }

  // ── Draft mutations ───────────────────────────────────────────
  const updateRow = (di: number, ri: number, field: keyof SetRow, val: string) =>
    setDraftExes(prev => prev.map((d, i) => i !== di ? d : {
      ...d, rows: d.rows.map((r, j) => j !== ri ? r : { ...r, [field]: val }),
    }))
  const addRow = (di: number) =>
    setDraftExes(prev => prev.map((d, i) => i !== di ? d : {
      ...d, rows: [...d.rows, { weight: '', reps: '', duration: '' }],
    }))
  const removeRow = (di: number, ri: number) => {
    const draftId = draftExes[di]?.draftId
    if (draftId) {
      setCompletedSets(prev => {
        const next = new Set<string>()
        for (const k of prev) {
          if (!k.startsWith(`${draftId}-`)) { next.add(k); continue }
          const kr = parseInt(k.slice(k.lastIndexOf('-') + 1), 10)
          if (kr < ri) next.add(k)
          else if (kr > ri) next.add(`${draftId}-${kr - 1}`)
          // kr === ri: deleted row, drop it
        }
        return next
      })
    }
    setDraftExes(prev => prev.map((d, i) => i !== di ? d : {
      ...d, rows: d.rows.filter((_, j) => j !== ri),
    }))
  }
  const updateCardio = (di: number, field: 'dist' | 'time' | 'cal', val: string) =>
    setDraftExes(prev => prev.map((d, i) => i !== di ? d : {
      ...d, cardio: { ...d.cardio, [field]: val },
    }))
  const removeDraftEx = (di: number) =>
    setDraftExes(prev => prev.filter((_, i) => i !== di))
  const moveExUp = (di: number) => setDraftExes(prev => {
    if (di === 0) return prev
    const next = [...prev];
    [next[di - 1], next[di]] = [next[di], next[di - 1]]
    return next
  })
  const moveExDown = (di: number) => setDraftExes(prev => {
    if (di === prev.length - 1) return prev
    const next = [...prev];
    [next[di], next[di + 1]] = [next[di + 1], next[di]]
    return next
  })
  const updateExNote = (di: number, val: string) =>
    setDraftExes(prev => prev.map((d, i) => i !== di ? d : { ...d, exNote: val }))

  const addDraftEx = (exId: string) => {
    setDraftExes(prev => [...prev, { draftId: newDraftId(), exId, rows: makeRows(3), cardio: { dist: '', time: '', cal: '' }, exNote: '' }])
    setAddExSearch(''); setShowAddExInFill(false)
  }

  const sortedEx = [...allExercises].sort((a, b) => (a.ko || a.name).localeCompare(b.ko || b.name, 'ko'))
  const filterEx = (s: string) => {
    if (!s) return sortedEx
    const tokens = s.toLowerCase().split(/\s+/).filter(Boolean)
    return sortedEx.filter(x => tokens.every(t => `${x.name} ${x.ko || ''}`.toLowerCase().includes(t)))
  }

  const openRoutineFill = (r: Routine & { id: string }) => {
    setFillTitle(r.name); setDraftExes(draftFromRoutine(r, allExercises, unit, logs)); setModal('fill')
    setCurrentRoutineId(r.id)
    history.pushState({ filling: true }, '')
    startWorkout(); acquireWakeLock()
    if (r.format?.type === 'tabata') setTabataState(initTabata(r.format, r.exercises.length))
    else setTabataState(null)
  }
  const openExFill = (exId: string) => {
    setFillTitle(''); setDraftExes([{ draftId: newDraftId(), exId, rows: makeRows(3), cardio: { dist: '', time: '', cal: '' }, exNote: '' }]); setModal('fill')
    history.pushState({ filling: true }, '')
    startWorkout(); acquireWakeLock()
  }
  const closeFill = () => {
    setModal(null); setDraftExes([]); setFillTitle('')
    setExSearch(''); setRoutineSearch(''); setShowAddExInFill(false); setAddExSearch('')
    setCurrentRoutineId(null); setShowFinishConfirm(false)
    setTimerPhase('idle'); setSegStartedAt(null); setAccWorkMs(0); setAccRestMs(0); setTick(0); setCompletedSets(new Set()); setLastCompletedLabel(''); setLastCompletedDraftId(null); setLastCompletedRi(-1)
    phaseRef.current = 'idle'; segStartRef.current = null; accWorkRef.current = 0; accRestRef.current = 0
    if (timerRef.current) clearInterval(timerRef.current)
    if (tabataTimerRef.current) clearInterval(tabataTimerRef.current)
    setTabataState(null)
    releaseWakeLock()
  }

  // ── 뒤로가기 / 탭 닫기 가로채기 ─────────────────────────────
  const modalRef = useRef(modal)
  useEffect(() => { modalRef.current = modal }, [modal])

  useEffect(() => {
    const onPopState = () => {
      if (modalRef.current !== 'fill') return
      history.pushState({ filling: true }, '') // 다시 복원
      if (window.confirm(tr(lang, 'confirmLeaveWorkout'))) {
        closeFill()
      }
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (modalRef.current !== 'fill') return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, []) // 마운트 한 번만 — modalRef로 현재 상태 참조

  const save = async () => {
    const entries: LogEntry[] = []
    if (tabataState) {
      // Tabata: auto-generate time-based entries (totalRounds × totalSets bouts per exercise)
      const { workSec, totalRounds, totalSets } = tabataState
      for (const d of draftExes) {
        entries.push({
          exId: d.exId,
          log_type: 'time',
          sets: Array.from({ length: totalRounds * totalSets }, () => ({ duration: workSec })),
        })
      }
    } else {
    for (const d of draftExes) {
      const ex = getEx(d.exId)
      const lt: LogType = ex?.log_type || 'weight_reps'
      if (lt === 'cardio') {
        const dist = parseFloat(d.cardio.dist) || 0
        const time = parseInt(d.cardio.time) || 0
        const cal = parseInt(d.cardio.cal) || 0
        if (dist || time) entries.push({ exId: d.exId, log_type: 'cardio', dist, time, cal })
        continue
      }
      const sets: ExerciseSet[] = []
      for (const r of d.rows) {
        if (lt === 'weight_reps') {
          const w = parseFloat(r.weight), rep = parseInt(r.reps)
          if (!isNaN(rep) && rep > 0) sets.push({ weight: isNaN(w) ? 0 : toKg(w, unit), reps: rep })
        } else if (lt === 'reps_only') {
          const rep = parseInt(r.reps)
          if (!isNaN(rep) && rep > 0) sets.push({ reps: rep })
        } else {
          const dur = parseInt(r.duration)
          if (!isNaN(dur) && dur > 0) sets.push({ duration: dur })
        }
      }
      if (sets.length) entries.push({ exId: d.exId, log_type: lt, sets })
    }
    } // end else (non-tabata)
    if (!entries.length) { alert(tr(lang, 'noSets')); return }
    const routineIdSnapshot = currentRoutineId
    const notesSnapshot = draftExes.map(d => ({ exId: d.exId, note: d.exNote.trim() || undefined }))
    const routineMeta = routineIdSnapshot && fillTitle
      ? { routineId: routineIdSnapshot, routineName: fillTitle }
      : undefined
    const promises: Promise<unknown>[] = [onAddEntries(selectedDate, entries, routineMeta)]
    if (routineIdSnapshot && onSaveRoutineNotes) {
      promises.push(onSaveRoutineNotes(routineIdSnapshot, notesSnapshot))
    }
    if (routineIdSnapshot && onPatchRoutineExercises) {
      const currentRoutine = routines.find(r => r.id === routineIdSnapshot)
      if (currentRoutine) {
        const updatedExes: RoutineExercise[] = currentRoutine.exercises.map((re, i) => {
          const d = draftExes[i]
          if (!d || d.exId !== re.exId) return re
          const ex = getEx(d.exId)
          const lt: LogType = ex?.log_type || 'weight_reps'
          let lastRow: SetRow | undefined
          for (let j = d.rows.length - 1; j >= 0; j--) {
            const r = d.rows[j]
            if (lt === 'weight_reps' && (r.weight || r.reps)) { lastRow = r; break }
            if (lt === 'reps_only' && r.reps) { lastRow = r; break }
            if (lt === 'time' && r.duration) { lastRow = r; break }
          }
          const updated: RoutineExercise = { ...re, sets: d.rows.length }
          if (lastRow) {
            if (lt === 'weight_reps') {
              const w = parseFloat(lastRow.weight), rep = parseInt(lastRow.reps)
              if (!isNaN(w) && w > 0) updated.defaultWeight = toKg(w, unit)
              if (!isNaN(rep) && rep > 0) updated.reps = rep
            } else if (lt === 'reps_only') {
              const rep = parseInt(lastRow.reps)
              if (!isNaN(rep) && rep > 0) updated.reps = rep
            }
          }
          return updated
        })
        promises.push(onPatchRoutineExercises(routineIdSnapshot, updatedExes))
      }
    }
    await Promise.all(promises)
    closeFill()
    // PWA 설치 배너: 1회차, 3회차, 5회차... 저장 시 노출
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const hasPrompt = !!(window as unknown as Record<string, unknown>).__pwaPrompt
    if (!isStandalone && hasPrompt) {
      const count = parseInt(localStorage.getItem('gymSaveCount') || '0') + 1
      localStorage.setItem('gymSaveCount', String(count))
      if (count % 2 === 1) setShowInstallBanner(true)
    }
  }

  const renderDraftEx = (d: DraftEx, di: number) => {
    const ex = getEx(d.exId)
    const lt: LogType = ex?.log_type || 'weight_reps'
    const colsWR = '28px 1fr 1fr 52px 36px'
    const colsOther = '28px 1fr 52px 36px'
    const nm = ex ? exName(ex, lang) : { main: d.exId }
    return (
      <div key={di} style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>{nm.main}</span>
              {nm.sub && <span style={{ fontSize: '12px', color: 'var(--tm)' }}>{nm.sub}</span>}
              {ex && <span className={`badge ${MB[ex.muscle] || 'bx'}`} style={{ fontSize: '11px' }}>{muscleLabel(ex.muscle, lang)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button className="idb" onClick={() => moveExUp(di)} disabled={di === 0} style={{ opacity: di === 0 ? 0.3 : 1, padding: '4px' }}><IconArrowUp size={16} /></button>
            <button className="idb" onClick={() => moveExDown(di)} disabled={di === draftExes.length - 1} style={{ opacity: di === draftExes.length - 1 ? 0.3 : 1, padding: '4px' }}><IconArrowDown size={16} /></button>
            <button className="idb" onClick={() => removeDraftEx(di)} style={{ padding: '4px' }}><IconTrash size={16} /></button>
          </div>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <input
            value={d.exNote}
            onChange={e => updateExNote(di, e.target.value)}
            placeholder={tr(lang, 'exNoteLabel')}
            style={{ width: '100%', fontSize: '13px', padding: '8px 10px', marginBottom: '12px', border: '0.5px solid var(--bd)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--ts)', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          {lt === 'cardio' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {(['dist', 'time', 'cal'] as const).map(f => (
                <div key={f}>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px', textAlign: 'center' }}>
                    {f === 'dist' ? tr(lang, 'distKm') : f === 'time' ? tr(lang, 'timMin') : tr(lang, 'calories')}
                  </div>
                  <input type="number" value={d.cardio[f]} onChange={e => updateCardio(di, f, e.target.value)} placeholder="0" min="0" style={{ textAlign: 'center', fontSize: '16px', padding: '10px 6px' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: lt === 'weight_reps' ? colsWR : colsOther, gap: '8px', fontSize: '14px', color: 'var(--tm)', marginBottom: '6px', paddingBottom: '6px', borderBottom: '0.5px solid var(--bd)' }}>
                <span style={{ textAlign: 'center' }}>#</span>
                {lt === 'weight_reps'
                  ? <><span style={{ textAlign: 'center' }}>{tr(lang, 'weightCol')} ({unit})</span><span style={{ textAlign: 'center' }}>{tr(lang, 'repsCol')}</span></>
                  : <span style={{ textAlign: 'center' }}>{lt === 'time' ? `${tr(lang, 'timerWork')}(${tr(lang, 'sec')})` : tr(lang, 'repsCol')}</span>}
                <span /><span />
              </div>
              {d.rows.map((row, ri) => {
                const setKey = `${d.draftId}-${ri}`
                const isDone = completedSets.has(setKey)
                const setLabel = `${tr(lang, 'setLabel')} ${ri + 1} — ${nm.main}`
                return (
                  <div key={ri} id={`set-${setKey}`} style={{
                    display: 'grid', gridTemplateColumns: lt === 'weight_reps' ? colsWR : colsOther,
                    gap: '8px', alignItems: 'center', padding: '8px 0',
                    borderBottom: ri < d.rows.length - 1 ? '0.5px solid var(--bd)' : 'none',
                    opacity: isDone ? 0.35 : 1,
                    background: isDone ? 'rgba(29,158,117,0.07)' : 'transparent',
                    borderLeft: isDone ? '3px solid #1D9E75' : '3px solid transparent',
                    paddingLeft: isDone ? '8px' : '0',
                    transition: 'opacity 0.2s, background 0.2s',
                  }}>
                    <span style={{ fontSize: '14px', color: 'var(--tm)', textAlign: 'center', fontWeight: 500 }}>{ri + 1}</span>
                    {lt === 'weight_reps' ? (
                      <>
                        <input type="number" value={row.weight} onChange={e => updateRow(di, ri, 'weight', e.target.value)} placeholder="0" min="0" step="0.5" style={{ textAlign: 'center', fontSize: '26px', padding: '12px 4px', fontWeight: 500 }} />
                        <input type="number" value={row.reps} onChange={e => updateRow(di, ri, 'reps', e.target.value)} placeholder="0" min="0" style={{ textAlign: 'center', fontSize: '26px', padding: '12px 4px', fontWeight: 500 }} />
                      </>
                    ) : (
                      <input type="number" value={lt === 'time' ? row.duration : row.reps}
                        onChange={e => updateRow(di, ri, lt === 'time' ? 'duration' : 'reps', e.target.value)}
                        placeholder="0" min="0" style={{ textAlign: 'center', fontSize: '26px', padding: '12px 4px', fontWeight: 500 }} />
                    )}
                    <button onClick={() => completeSet(setKey, setLabel)} style={{
                      width: '44px', height: '44px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: isDone ? '#1D9E75' : 'var(--bg2)',
                      color: isDone ? '#fff' : 'var(--tm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <IconCheck size={22} />
                    </button>
                    <button className="idb" onClick={() => removeRow(di, ri)} style={{ fontSize: '20px', padding: '4px' }}>&times;</button>
                  </div>
                )
              })}
              <button className="btn" onClick={() => addRow(di)} style={{ marginTop: '10px', fontSize: '14px', width: '100%', padding: '12px' }}>
                <IconPlus size={14} style={{ marginRight: 4 }} />{tr(lang, 'addSet')}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Fill 전체화면 ─────────────────────────────────────────────
  const renderFill = () => {
    // Tabata timer overlay
    const tabata = tabataState
    const tabataPhaseColor = tabata?.phase === 'work' ? '#1D9E75' : tabata?.phase === 'rest' ? '#EF9F27' : '#3b82f6'
    const tabataPhaseName = tabata?.phase === 'work' ? tr(lang, 'tabataWork') : tabata?.phase === 'rest' ? tr(lang, 'tabataRest') : tr(lang, 'tabataSetRest')
    const tabataCurEx = tabata ? draftExes[tabata.ex] : null
    const tabataNextEx = tabata && tabata.phase === 'rest' && tabata.round >= tabata.totalRounds && tabata.ex < tabata.exCount - 1
      ? draftExes[tabata.ex + 1] : null

    return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Tabata timer overlay ── */}
      {tabata && tabata.phase !== 'done' && (
        <div style={{ position: 'absolute', inset: 0, background: '#0c1a14', zIndex: 30, display: 'flex', flexDirection: 'column' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
              {tr(lang, 'tabataSetLabel')} {tabata.set}/{tabata.totalSets}
            </div>
            <div style={{ color: '#1D9E75', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em' }}>TABATA</div>
            <button onClick={() => setShowFinishConfirm(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', padding: '4px 8px' }}>
              {tr(lang, 'tabataEnd')}
            </button>
          </div>

          {/* Main */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {tabata.phase === 'ready' ? (
              /* ── Ready screen ── */
              <>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px', letterSpacing: '0.04em' }}>
                  {tabata.workSec}s / {tabata.restSec}s × {tabata.totalRounds} {tr(lang, 'tabataRoundLabel')}
                  {tabata.totalSets > 1 ? ` × ${tabata.totalSets} ${tr(lang, 'tabataSetLabel')}` : ''}
                </div>
                <div style={{ width: '80%', maxWidth: '320px', marginBottom: '36px' }}>
                  {draftExes.map((d, i) => {
                    const ex = getEx(d.exId)
                    const nm = ex ? exName(ex, lang) : { main: d.exId }
                    return (
                      <div key={d.draftId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < draftExes.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                        <span style={{ color: '#1D9E75', fontWeight: 700, fontSize: '13px', minWidth: '20px', textAlign: 'right' }}>{i + 1}</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>{nm.main}</span>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => setTabataState(s => s ? { ...s, phase: 'work', seconds: s.workSec } : s)}
                  style={{ padding: '18px 72px', borderRadius: '40px', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '22px', fontWeight: 700, fontFamily: 'inherit' }}>
                  {tr(lang, 'tabataStart')}
                </button>
              </>
            ) : (
              /* ── Active timer ── */
              <>
                {/* Phase + exercise name */}
                <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: tabataPhaseColor, marginBottom: '6px' }}>
                  {tabataPhaseName}
                </div>
                {tabata.phase === 'work' && tabataCurEx && (() => {
                  const ex = getEx(tabataCurEx.exId)
                  return ex ? <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '17px', marginBottom: '10px', textAlign: 'center', padding: '0 24px' }}>{exName(ex, lang).main}</div> : null
                })()}

                {/* Countdown */}
                <div style={{ fontSize: tabata.seconds >= 100 ? '110px' : '140px', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: tabataPhaseColor }}>
                  {tabata.seconds}
                </div>

                {/* Next exercise hint */}
                {tabataNextEx && (() => {
                  const ex = getEx(tabataNextEx.exId)
                  return ex ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '12px' }}>
                      {tr(lang, 'tabataNext')}: {exName(ex, lang).main}
                    </div>
                  ) : null
                })()}

                {/* Progress */}
                <div style={{ display: 'flex', gap: '28px', marginTop: '28px' }}>
                  {[
                    { label: tr(lang, 'tabataExLabel'), val: `${tabata.ex + 1}/${tabata.exCount}` },
                    { label: tr(lang, 'tabataRoundLabel'), val: `${tabata.round}/${tabata.totalRounds}` },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  <button
                    onClick={() => setTabataState(s => s ? { ...s, paused: !s.paused } : s)}
                    style={{ padding: '14px 28px', borderRadius: '30px', background: tabata.paused ? '#1D9E75' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit', fontWeight: 600 }}>
                    {tabata.paused ? tr(lang, 'tabataResume') : tr(lang, 'tabataPause')}
                  </button>
                  <button
                    onClick={() => setTabataState(s => s ? nextTabataState(s) : s)}
                    style={{ padding: '14px 20px', borderRadius: '30px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' }}>
                    {tr(lang, 'tabataSkip')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {timerPhase === 'resting' && !tabata && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#111', display: 'flex', flexDirection: 'column',
          zIndex: 20,
        }}>
          {/* 상단: 방금 완료한 세트 */}
          {lastCompletedLabel && (
            <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{tr(lang, 'justCompleted')}</div>
              <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>{lastCompletedLabel}</div>
            </div>
          )}
          {/* 중앙: 타이머 + 버튼 + 통계 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '14px', color: '#fff', letterSpacing: '0.06em', marginBottom: '14px' }}>{tr(lang, 'resting')}</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {fmtTime(currentRestMs).split(':').map((part, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <span style={{ fontSize: '96px', fontWeight: 700, color: '#EF9F27', margin: '0 2px', lineHeight: 1, transform: 'translateY(6px)', display: 'inline-block' }}>:</span>}
                  <span style={{ fontSize: '112px', fontWeight: 700, color: '#EF9F27', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{part}</span>
                </span>
              ))}
            </div>
            <button onClick={resumeWorkout} style={{
              marginTop: '32px', padding: '20px 0', borderRadius: '40px', width: '78%',
              background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: '22px', fontWeight: 700, fontFamily: 'inherit',
            }}>▶ {tr(lang, 'startWorkout')}</button>
            <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
              {([
                { label: tr(lang, 'timerTotal'), ms: totalMs, color: '#fff' },
                { label: tr(lang, 'timerWork'), ms: workMs, color: '#1D9E75' },
              ] as const).map(({ label, ms, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(ms)}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 하단: 다음 세트 + 다음 운동 */}
          {(nextSetLabel || nextExNm) && (
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', padding: '14px 20px 20px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {nextSetLabel && (
                <div style={{ background: '#1c2a24', borderLeft: '2px solid #1D9E75', borderRadius: '6px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '9px', color: '#1D9E75', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px' }}>{tr(lang, 'nextSet')}</div>
                  <div style={{ fontSize: '15px', color: '#e8e8e8', fontWeight: 600 }}>{nextSetLabel}</div>
                </div>
              )}
              {nextExNm && nextExDraft && (
                <div style={{ background: '#1c2a24', borderLeft: '2px solid #1D9E75', borderRadius: '6px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '9px', color: '#1D9E75', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px' }}>{tr(lang, 'nextExercise')}</div>
                  <div style={{ fontSize: '15px', color: '#e8e8e8', fontWeight: 600 }}>{nextExNm.main}</div>
                  {nextExNm.sub && <div style={{ fontSize: '12px', color: '#8fcca8', marginTop: '2px' }}>{nextExNm.sub}</div>}
                  <div style={{ fontSize: '12px', color: '#8fcca8', marginTop: '2px' }}>{nextExDraft.rows.length} {tr(lang, 'sets')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--bd)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: timerPhase !== 'idle' ? '12px' : 0 }}>
          <div style={{ fontWeight: 700, fontSize: '20px' }}>{fillTitle || tr(lang, 'workoutLog')}</div>
          <div style={{ fontSize: '14px', color: 'var(--tm)' }}>{formatDateHeader(selectedDate, LOCALE_MAP[lang])}</div>
        </div>
        {timerPhase !== 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { label: tr(lang, 'timerTotal'), ms: totalMs, color: 'var(--tp)' },
                { label: tr(lang, 'timerWork'), ms: workMs, color: '#1D9E75' },
                { label: tr(lang, 'timerRest'), ms: restMs, color: '#BA7517' },
              ].map(({ label, ms, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--tm)' }}>{label}</span>
                  <span style={{ fontSize: '17px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(ms)}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: '14px', color: '#1D9E75', fontWeight: 600 }}>{tr(lang, 'working')}</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {draftExes.map((d, di) => renderDraftEx(d, di))}
        {showAddExInFill ? (
          <div style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: '10px' }}>
            <div className="sw" style={{ marginBottom: '6px' }}>
              <IconSearch size={14} className="si" />
              <input value={addExSearch} onChange={e => setAddExSearch(e.target.value)}
                placeholder={tr(lang, 'searchExercise')} style={{ paddingLeft: '32px', fontSize: '13px' }} autoFocus />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filterEx(addExSearch).slice(0, 50).map(x => {
                const nm = exName(x, lang)
                return (
                  <div key={x.id} onClick={() => addDraftEx(x.id)}
                    style={{ padding: '7px 8px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <span>{nm.main}</span>
                    <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ fontSize: '10px' }}>{muscleLabel(x.muscle, lang)}</span>
                  </div>
                )
              })}
            </div>
            <button className="btn" onClick={() => { setShowAddExInFill(false); setAddExSearch('') }}
              style={{ marginTop: '6px', fontSize: '12px' }}>{tr(lang, 'cancel')}</button>
          </div>
        ) : (
          <button className="btn" onClick={() => setShowAddExInFill(true)} style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
            <IconPlus size={14} style={{ marginRight: 5 }} />{tr(lang, 'addExInFill')}
          </button>
        )}
      </div>
      <div style={{ padding: '14px 16px', borderTop: '0.5px solid var(--bd)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
        <button className="btn" onClick={closeFill} style={{ fontSize: '16px', padding: '12px 22px' }}>{tr(lang, 'cancel')}</button>
        {tabata ? (
          <button className="btn btn-p"
            onClick={() => setTabataState(s => s && s.phase === 'ready' ? { ...s, phase: 'work', seconds: s.workSec } : s)}
            style={{ fontSize: '16px', padding: '12px 22px' }}>
            ▶ {tr(lang, 'tabataStart')}
          </button>
        ) : (
          <button className="btn btn-p" onClick={() => setShowFinishConfirm(true)} style={{ fontSize: '16px', padding: '12px 22px' }}>{tr(lang, 'save')}</button>
        )}
      </div>
      {showFinishConfirm && (
        <div className="mbg" style={{ zIndex: 300 }} onClick={e => { if (e.target === e.currentTarget) setShowFinishConfirm(false) }}>
          <div className="mo" style={{ maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{tr(lang, 'confirmFinishWorkout')}</div>
            <div style={{ fontSize: '14px', color: 'var(--tm)', marginBottom: '24px' }}>{tr(lang, 'confirmFinishWorkoutBody')}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" onClick={() => {
                setShowFinishConfirm(false)
                if (tabata) setTabataState(s => s ? { ...s, paused: false } : s)
                else resumeWorkout()
              }} style={{ flex: 1, fontSize: '15px', padding: '12px' }}>{tr(lang, 'confirmFinishWorkoutCancel')}</button>
              <button className="btn btn-p" onClick={() => { setShowFinishConfirm(false); save() }}
                style={{ flex: 1, fontSize: '15px', padding: '12px' }}>{tr(lang, 'confirmFinishWorkoutOk')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    ) // end return
  } // end renderFill

  // ── Render ────────────────────────────────────────────────────
  const summary = daySummary(selectedLog)

  if (modal === 'fill') {
    return renderFill()
  }

  const installBanner = showInstallBanner && createPortal(
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'var(--s2)', borderTop: '0.5px solid var(--bd)',
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
      animation: 'slideUp 0.28s ease',
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: '#1D9E75', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconBarbell size={22} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp)' }}>{tr(lang, 'installApp')}</div>
        <div style={{ fontSize: '13px', color: 'var(--tm)' }}>{tr(lang, 'installAppSub')}</div>
      </div>
      <button onClick={async () => {
        const prompt = (window as unknown as Record<string, unknown>).__pwaPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> } | undefined
        if (!prompt) return
        prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === 'accepted') (window as unknown as Record<string, unknown>).__pwaPrompt = null
        setShowInstallBanner(false)
      }} style={{
        background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8,
        padding: '10px 18px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
      }}>{tr(lang, 'install')}</button>
      <button onClick={() => setShowInstallBanner(false)} style={{ background: 'none', border: 'none', color: 'var(--tm)', cursor: 'pointer', padding: '4px', fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>&times;</button>
    </div>,
    document.body
  )

  return (
    <div>
      {installBanner}
      {/* ── 달력 ── */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 16px' }}>
        {/* 범례 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {([
            { color: '#378ADD', key: 'calLegendWeight' },
            { color: '#1D9E75', key: 'calLegendCardio' },
            { color: '#E24B4A', key: 'calLegendHiit' },
          ] as const).map(({ color, key }) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--tm)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
              {tr(lang, key)}
            </span>
          ))}
        </div>
        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button className="idb" onClick={prevMonth}><IconChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>
            {toLocalDate(calMonth + '-01').toLocaleDateString(LOCALE_MAP[lang] || 'ko-KR', { year: 'numeric', month: 'long' })}
          </span>
          <button className="idb" onClick={nextMonth} disabled={!canGoNext} style={{ opacity: canGoNext ? 1 : 0.3 }}>
            <IconChevronRight size={16} />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {DOW.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--tm)', padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {/* 앞 빈칸 */}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${calMonth}-${String(day).padStart(2, '0')}`
            const dayColor = monthDayColors[i]
            const hasLog = dayColor !== null
            const circleSize = 28
            const circleColor = dayColor === 'weight' ? 'rgba(55, 138, 221, 0.22)' : dayColor === 'cardio' ? 'rgba(29, 158, 117, 0.22)' : 'rgba(226, 75, 74, 0.22)'
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr

            return (
              <div key={day} onClick={() => !isFuture && selectDay(dateStr)}
                style={{
                  textAlign: 'center', padding: '5px 2px', borderRadius: '6px', cursor: isFuture ? 'default' : 'pointer',
                  fontSize: '12px', fontWeight: isToday ? 700 : 400, position: 'relative',
                  background: isSelected ? 'var(--tp)' : 'transparent',
                  color: isSelected ? '#fff' : isFuture ? 'var(--bd)' : 'var(--ts)',
                  outline: isToday && !isSelected ? '1.5px solid var(--tp)' : 'none',
                  outlineOffset: '-1px',
                }}>
                {hasLog && !isSelected && (
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${circleSize}px`, height: `${circleSize}px`,
                    borderRadius: '50%', background: circleColor,
                    pointerEvents: 'none',
                  }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{day}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 선택된 날짜 로그 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>
            {selectedDate === todayStr ? tr(lang, 'today') : formatDateHeader(selectedDate, LOCALE_MAP[lang])}
          </span>
          {summary && summary.sets > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '3px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{Math.round(fromKg(summary.vol, unit)).toLocaleString()} {unit}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{summary.exCount} {tr(lang, 'exUnit')}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{summary.sets} {tr(lang, 'sets')}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{summary.reps.toLocaleString()} {tr(lang, 'reps')}</span>
              {summary.pr > 0 && (
                <><span style={{ opacity: 0.4 }}>·</span><span style={{ color: '#E24B4A', fontWeight: 600 }}>PR {summary.pr}</span></>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedLog && selectedLog.exercises.length > 0 && (
            <button className="idb" title="공유" onClick={() => {
              const exNamesMap: Record<string, string> = {}
              for (const e of selectedLog.exercises) {
                const x = allExercises.find(ex => ex.id === e.exId)
                exNamesMap[e.exId] = x ? exName(x, lang).main : e.exId
              }
              shareWorkout({
                log: selectedLog,
                exNames: exNamesMap,
                unit,
                dateLabel: formatDateHeader(selectedDate, LOCALE_MAP[lang]),
              })
            }}>
              <IconShare size={16} />
            </button>
          )}
          <button className="btn btn-p" onClick={() => setModal('pick')}>
            <IconPlus size={14} style={{ marginRight: 4 }} />{tr(lang, 'add')}
          </button>
        </div>
      </div>

      {!selectedLog || !selectedLog.exercises.length ? (
        <div className="emp">{tr(lang, 'noLog')}</div>
      ) : (
        <>
        {selectedLog.routineName && (
          <div style={{ fontSize: '12px', color: 'var(--tm)', fontWeight: 600, marginBottom: '6px', paddingLeft: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconBarbell size={13} style={{ flexShrink: 0 }} />
            {selectedLog.routineName}
          </div>
        )}
        <div className="card" style={{ padding: '4px 0' }}>
          {selectedLog.exercises.map((entry, ei) => {
            const x = getEx(entry.exId)
            const nm = x ? exName(x, lang) : { main: entry.exId }
            const summary = summarizeEntry(entry)
            return (
              <div key={ei} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: ei < selectedLog.exercises.length - 1 ? '0.5px solid var(--bd)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{nm.main}</span>
                    {x && <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ fontSize: '10px' }}>{muscleLabel(x.muscle, lang)}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '2px' }}>{summary}</div>
                </div>
                <button className="idb" onClick={() => onDeleteEntry(selectedDate, ei)} style={{ marginLeft: '8px', flexShrink: 0 }}>
                  <IconTrash size={15} />
                </button>
              </div>
            )
          })}
        </div>
        </>
      )}

      {/* ── 모달 (pick / routine-select / ex-select) ── */}
      {modal && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="mo" style={{ maxWidth: '480px' }}>

            {modal === 'pick' && (
              <>
                <div className="mt2">{tr(lang, 'addWorkout')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  <button onClick={() => { setRoutineSearch(''); setModal('routine-select') }}
                    style={{ padding: '18px', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', background: 'var(--bg2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{tr(lang, 'addFromRoutine')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--tm)' }}>{tr(lang, 'addFromRoutineDesc')}</div>
                  </button>
                  <button onClick={() => { setExSearch(''); setModal('ex-select') }}
                    style={{ padding: '18px', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', background: 'var(--bg2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{tr(lang, 'addExercise')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--tm)' }}>{tr(lang, 'addExerciseDesc')}</div>
                  </button>
                </div>
                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button className="btn" onClick={() => setModal(null)}>{tr(lang, 'cancel')}</button>
                </div>
              </>
            )}

            {modal === 'routine-select' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <button className="idb" onClick={() => setModal('pick')}><IconChevronLeft size={16} /></button>
                  <div className="mt2" style={{ margin: 0 }}>{tr(lang, 'selectRoutine')}</div>
                </div>
                <div className="sw" style={{ marginBottom: '8px' }}>
                  <IconSearch size={16} className="si" />
                  <input value={routineSearch} onChange={e => setRoutineSearch(e.target.value)}
                    placeholder={tr(lang, 'searchRoutine')} style={{ paddingLeft: '36px' }} autoFocus />
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)' }}>
                  {routines.filter(r => !routineSearch || r.name.toLowerCase().includes(routineSearch.toLowerCase())).length === 0
                    ? <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--tm)' }}>{tr(lang, 'noRoutines')}</div>
                    : routines.filter(r => !routineSearch || r.name.toLowerCase().includes(routineSearch.toLowerCase())).map(r => (
                      <div key={r.id} onClick={() => openRoutineFill(r)}
                        style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '2px' }}>{r.exercises.length} {tr(lang, 'exerciseCount')}</div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}

            {modal === 'ex-select' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <button className="idb" onClick={() => setModal('pick')}><IconChevronLeft size={16} /></button>
                  <div className="mt2" style={{ margin: 0 }}>{tr(lang, 'selectExercise')}</div>
                </div>
                <div className="sw" style={{ marginBottom: '8px' }}>
                  <IconSearch size={16} className="si" />
                  <input value={exSearch} onChange={e => setExSearch(e.target.value)}
                    placeholder={tr(lang, 'searchExercise')} style={{ paddingLeft: '36px' }} autoFocus />
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)' }}>
                  {filterEx(exSearch).slice(0, 80).map(x => {
                    const nm = exName(x, lang)
                    return (
                      <div key={x.id} onClick={() => openExFill(x.id)}
                        style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{nm.main}</div>
                          {nm.sub && <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{nm.sub}</div>}
                        </div>
                        <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ fontSize: '10px' }}>{muscleLabel(x.muscle, lang)}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
