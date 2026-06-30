import { useState, useEffect, useRef } from 'react'
import { IconPlus, IconTrash, IconSearch, IconChevronLeft, IconChevronRight, IconCheck, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import type { Exercise, DayLog, LogEntry, LogType, Routine, ExerciseSet } from '../types'

const ML: Record<string, string> = {
  chest: 'Chest', back: 'Back', legs: 'Legs', shoulder: 'Shoulder',
  arm: 'Arms', core: 'Core', glute: 'Glute', hiit: 'HIIT', cardio: 'Cardio',
}
const MB: Record<string, string> = {
  chest: 'bc', back: 'bb', legs: 'bl', shoulder: 'bs', arm: 'ba',
  core: 'bco', glute: 'bg', hiit: 'bhiit', cardio: 'bcard', custom: 'bx',
}
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toKg(v: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(v / 2.205 * 10) / 10 : parseFloat(String(v)) || 0 }
function fromKg(kg: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(kg * 2.205 * 10) / 10 : kg }
function today() { return new Date().toISOString().slice(0, 10) }
function toLocalDate(dateStr: string) { return new Date(dateStr + 'T00:00:00') }
function formatDateHeader(d: string) {
  return toLocalDate(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
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
  exId: string
  rows: SetRow[]
  cardio: { dist: string; time: string; cal: string }
}
type ModalState = null | 'pick' | 'routine-select' | 'ex-select' | 'fill'

function makeRows(count: number, reps?: number): SetRow[] {
  return Array.from({ length: count }, () => ({ weight: '', reps: reps != null ? String(reps) : '', duration: '' }))
}
function draftFromRoutine(routine: Routine, allExercises: Exercise[]): DraftEx[] {
  return routine.exercises.map(re => {
    const ex = allExercises.find(e => e.id === re.exId)
    const lt = ex?.log_type || 'weight_reps'
    if (lt === 'cardio') return { exId: re.exId, rows: [], cardio: { dist: '', time: '', cal: '' } }
    return { exId: re.exId, rows: makeRows(re.sets || 3, lt !== 'weight_reps' ? re.reps : undefined), cardio: { dist: '', time: '', cal: '' } }
  })
}

function dayVolume(log: DayLog | undefined): number {
  if (!log) return 0
  return log.exercises.reduce((a, e) =>
    a + (e.sets || []).reduce((b, s) => b + (s.weight || 0) * (s.reps || 0), 0), 0)
}

interface Props {
  logs: DayLog[]
  routines: (Routine & { id: string })[]
  allExercises: Exercise[]
  unit: 'kg' | 'lb'
  onAddEntries: (date: string, entries: LogEntry[]) => Promise<void>
  onDeleteEntry: (date: string, index: number) => Promise<void>
  initialRoutine?: (Routine & { id: string }) | null
  onConsumedInitial?: () => void
}

export default function LogPage({
  logs, routines, allExercises, unit,
  onAddEntries, onDeleteEntry,
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

  // ── Timer state ───────────────────────────────────────────────
  // timerPhase: 'idle' | 'working' | 'resting'
  const [timerPhase, setTimerPhase] = useState<'idle' | 'working' | 'resting'>('idle')
  const [accWorkMs, setAccWorkMs] = useState(0)   // 누적 운동 시간
  const [accRestMs, setAccRestMs] = useState(0)   // 누적 휴식 시간
  const [segStartedAt, setSegStartedAt] = useState<number | null>(null)
  const [tick, setTick] = useState(0)             // 1초마다 re-render용
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set())
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
  }

  // ✓ 완료 → 운동 시간 누적, 휴식 시작
  const completeSet = (key: string) => {
    const now = Date.now()
    if (phaseRef.current === 'working' && segStartRef.current !== null) {
      accWorkRef.current += now - segStartRef.current
      setAccWorkMs(accWorkRef.current)
    }
    phaseRef.current = 'resting'
    segStartRef.current = now
    setTimerPhase('resting')
    setSegStartedAt(now)
    setCompletedSets(prev => new Set([...prev, key]))
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
  const totalMs = workMs + restMs

  useEffect(() => {
    if (!initialRoutine) return
    setFillTitle(initialRoutine.name)
    setDraftExes(draftFromRoutine(initialRoutine, allExercises))
    setModal('fill')
    startWorkout()
    onConsumedInitial?.()
  }, [initialRoutine]) // eslint-disable-line react-hooks/exhaustive-deps

  const getEx = (id: string) => allExercises.find(e => e.id === id)
  const selectedLog = logs.find(l => l.date === selectedDate)
  const logMap = Object.fromEntries(logs.map(l => [l.date, l]))

  // ── Calendar ─────────────────────────────────────────────────
  const [calYear, calMonthNum] = calMonth.split('-').map(Number)
  const firstDow = new Date(calYear, calMonthNum - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonthNum, 0).getDate()

  // 이달 최대 볼륨 (색 정규화용)
  const monthVolumes = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${calMonth}-${String(i + 1).padStart(2, '0')}`
    return dayVolume(logMap[d])
  })
  const maxMonthVol = Math.max(...monthVolumes, 1)

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
    if (lt === 'cardio') {
      const parts: string[] = []
      if (entry.dist) parts.push(`${entry.dist}km`)
      if (entry.time) parts.push(`${entry.time}분`)
      if (entry.cal) parts.push(`${entry.cal}kcal`)
      return parts.join(' · ') || '—'
    }
    if (!sets.length) return '—'
    if (lt === 'weight_reps') {
      const ws = sets.map(s => s.weight || 0)
      const rs = sets.map(s => s.reps || 0)
      if (ws.every(w => w === ws[0]) && rs.every(r => r === rs[0])) {
        return `${fromKg(ws[0], unit)}${unit} × ${rs[0]}회 × ${sets.length}set`
      }
      return sets.map(s => `${fromKg(s.weight || 0, unit)}${unit}×${s.reps}회`).join(', ')
    }
    if (lt === 'reps_only') {
      const rs = sets.map(s => s.reps || 0)
      return rs.every(r => r === rs[0]) ? `${rs[0]}회 × ${sets.length}set` : rs.map(r => `${r}회`).join(', ')
    }
    if (lt === 'time') {
      const ds = sets.map(s => s.duration || 0)
      return ds.every(d => d === ds[0]) ? `${ds[0]}초 × ${sets.length}set` : ds.map(d => `${d}초`).join(', ')
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
  const removeRow = (di: number, ri: number) =>
    setDraftExes(prev => prev.map((d, i) => i !== di ? d : {
      ...d, rows: d.rows.filter((_, j) => j !== ri),
    }))
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
  const addDraftEx = (exId: string) => {
    setDraftExes(prev => [...prev, { exId, rows: makeRows(3), cardio: { dist: '', time: '', cal: '' } }])
    setAddExSearch(''); setShowAddExInFill(false)
  }

  const sortedEx = [...allExercises].sort((a, b) => (a.ko || a.name).localeCompare(b.ko || b.name, 'ko'))
  const filterEx = (s: string) => {
    if (!s) return sortedEx
    const tokens = s.toLowerCase().split(/\s+/).filter(Boolean)
    return sortedEx.filter(x => tokens.every(t => `${x.name} ${x.ko || ''}`.toLowerCase().includes(t)))
  }

  const openRoutineFill = (r: Routine & { id: string }) => {
    setFillTitle(r.name); setDraftExes(draftFromRoutine(r, allExercises)); setModal('fill')
    startWorkout()
  }
  const openExFill = (exId: string) => {
    setFillTitle(''); setDraftExes([{ exId, rows: makeRows(3), cardio: { dist: '', time: '', cal: '' } }]); setModal('fill')
    startWorkout()
  }
  const closeFill = () => {
    setModal(null); setDraftExes([]); setFillTitle('')
    setExSearch(''); setRoutineSearch(''); setShowAddExInFill(false); setAddExSearch('')
    setTimerPhase('idle'); setSegStartedAt(null); setAccWorkMs(0); setAccRestMs(0); setTick(0); setCompletedSets(new Set())
    phaseRef.current = 'idle'; segStartRef.current = null; accWorkRef.current = 0; accRestRef.current = 0
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const save = async () => {
    const entries: LogEntry[] = []
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
    if (!entries.length) { alert('입력된 세트가 없습니다'); return }
    await onAddEntries(selectedDate, entries)
    closeFill()
  }

  const renderDraftEx = (d: DraftEx, di: number) => {
    const ex = getEx(d.exId)
    const lt: LogType = ex?.log_type || 'weight_reps'
    const colsWR = '20px 1fr 1fr 28px 28px'
    const colsOther = '20px 1fr 28px 28px'
    return (
      <div key={di} style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', marginBottom: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{ex?.ko || ex?.name || d.exId}</span>
            {ex?.ko && <span style={{ fontSize: '11px', color: 'var(--tm)', marginLeft: '6px' }}>{ex.name}</span>}
            {ex && <span className={`badge ${MB[ex.muscle] || 'bx'}`} style={{ marginLeft: '6px', fontSize: '10px' }}>{ML[ex.muscle] || ex.muscle}</span>}
          </div>
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            <button className="idb" onClick={() => moveExUp(di)} disabled={di === 0} style={{ opacity: di === 0 ? 0.3 : 1 }}><IconArrowUp size={13} /></button>
            <button className="idb" onClick={() => moveExDown(di)} disabled={di === draftExes.length - 1} style={{ opacity: di === draftExes.length - 1 ? 0.3 : 1 }}><IconArrowDown size={13} /></button>
            <button className="idb" onClick={() => removeDraftEx(di)}><IconTrash size={13} /></button>
          </div>
        </div>
        <div style={{ padding: '10px 12px' }}>
          {lt === 'cardio' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['dist', 'time', 'cal'] as const).map(f => (
                <div key={f}>
                  <div style={{ fontSize: '10px', color: 'var(--tm)', marginBottom: '3px', textAlign: 'center' }}>
                    {f === 'dist' ? '거리(km)' : f === 'time' ? '시간(분)' : '칼로리'}
                  </div>
                  <input type="number" value={d.cardio[f]} onChange={e => updateCardio(di, f, e.target.value)} placeholder="0" min="0" style={{ textAlign: 'center' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: lt === 'weight_reps' ? colsWR : colsOther, gap: '6px', fontSize: '10px', color: 'var(--tm)', marginBottom: '4px' }}>
                <span style={{ textAlign: 'center' }}>#</span>
                {lt === 'weight_reps'
                  ? <><span style={{ textAlign: 'center' }}>Weight ({unit})</span><span style={{ textAlign: 'center' }}>Reps</span></>
                  : <span style={{ textAlign: 'center' }}>{lt === 'time' ? '시간(초)' : 'Reps'}</span>}
                <span /><span />
              </div>
              {d.rows.map((row, ri) => {
                const setKey = `${di}-${ri}`
                const isDone = completedSets.has(setKey)
                return (
                  <div key={ri} className="sr" style={{ gridTemplateColumns: lt === 'weight_reps' ? colsWR : colsOther, opacity: isDone ? 0.5 : 1 }}>
                    <span style={{ fontSize: '11px', color: 'var(--tm)', textAlign: 'center', alignSelf: 'center' }}>{ri + 1}</span>
                    {lt === 'weight_reps' ? (
                      <>
                        <input type="number" value={row.weight} onChange={e => updateRow(di, ri, 'weight', e.target.value)} placeholder="0" min="0" step="0.5" style={{ textAlign: 'center' }} />
                        <input type="number" value={row.reps} onChange={e => updateRow(di, ri, 'reps', e.target.value)} placeholder="0" min="0" style={{ textAlign: 'center' }} />
                      </>
                    ) : (
                      <input type="number" value={lt === 'time' ? row.duration : row.reps}
                        onChange={e => updateRow(di, ri, lt === 'time' ? 'duration' : 'reps', e.target.value)}
                        placeholder="0" min="0" style={{ textAlign: 'center' }} />
                    )}
                    <button className="idb" onClick={() => completeSet(setKey)}
                      style={{ color: isDone ? '#1D9E75' : undefined }}>
                      <IconCheck size={14} />
                    </button>
                    <button className="idb" onClick={() => removeRow(di, ri)}>&times;</button>
                  </div>
                )
              })}
              <button className="btn" onClick={() => addRow(di)} style={{ marginTop: '6px', fontSize: '12px', width: '100%' }}>
                <IconPlus size={12} style={{ marginRight: 3 }} />Set 추가
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────
  const totalDayVol = Math.round(dayVolume(selectedLog))

  return (
    <div>
      {/* ── 달력 ── */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 16px' }}>
        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button className="idb" onClick={prevMonth}><IconChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>
            {toLocalDate(calMonth + '-01').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
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
            const vol = monthVolumes[i]
            const hasLog = vol > 0
            const intensity = hasLog ? 0.15 + (vol / maxMonthVol) * 0.75 : 0
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr

            return (
              <div key={day} onClick={() => !isFuture && selectDay(dateStr)}
                style={{
                  textAlign: 'center', padding: '5px 2px', borderRadius: '6px', cursor: isFuture ? 'default' : 'pointer',
                  fontSize: '12px', fontWeight: isToday ? 700 : 400, position: 'relative',
                  background: isSelected
                    ? 'var(--tp)'
                    : hasLog
                    ? `rgba(24, 95, 165, ${intensity})`
                    : 'transparent',
                  color: isSelected ? '#fff' : isFuture ? 'var(--bd)' : 'var(--ts)',
                  outline: isToday && !isSelected ? '1.5px solid var(--tp)' : 'none',
                  outlineOffset: '-1px',
                }}>
                {day}
                {hasLog && !isSelected && (
                  <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--tp)', margin: '1px auto 0', opacity: 0.8 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 선택된 날짜 로그 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>
            {selectedDate === todayStr ? 'Today' : formatDateHeader(selectedDate)}
          </span>
          {totalDayVol > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--tm)', marginLeft: '10px' }}>
              Total {Math.round(fromKg(totalDayVol, unit)).toLocaleString()} {unit}
            </span>
          )}
        </div>
        <button className="btn btn-p" onClick={() => setModal('pick')}>
          <IconPlus size={14} style={{ marginRight: 4 }} />Add
        </button>
      </div>

      {!selectedLog || !selectedLog.exercises.length ? (
        <div className="emp">이 날 기록이 없어요</div>
      ) : (
        <div className="card" style={{ padding: '4px 0' }}>
          {selectedLog.exercises.map((entry, ei) => {
            const x = getEx(entry.exId)
            const summary = summarizeEntry(entry)
            return (
              <div key={ei} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: ei < selectedLog.exercises.length - 1 ? '0.5px solid var(--bd)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{x?.ko || x?.name || entry.exId}</span>
                    {x && <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ fontSize: '10px' }}>{ML[x.muscle] || x.muscle}</span>}
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
      )}

      {/* ── 모달 (pick / routine-select / ex-select) ── */}
      {modal && modal !== 'fill' && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="mo" style={{ maxWidth: '480px' }}>

            {modal === 'pick' && (
              <>
                <div className="mt2">운동 추가</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  <button onClick={() => { setRoutineSearch(''); setModal('routine-select') }}
                    style={{ padding: '18px', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', background: 'var(--bg2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>루틴으로 추가</div>
                    <div style={{ fontSize: '12px', color: 'var(--tm)' }}>저장된 루틴을 불러와 세트/무게를 입력합니다</div>
                  </button>
                  <button onClick={() => { setExSearch(''); setModal('ex-select') }}
                    style={{ padding: '18px', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', background: 'var(--bg2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>개별 운동 추가</div>
                    <div style={{ fontSize: '12px', color: 'var(--tm)' }}>운동을 하나 선택해 기록합니다</div>
                  </button>
                </div>
                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button className="btn" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}

            {modal === 'routine-select' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <button className="idb" onClick={() => setModal('pick')}><IconChevronLeft size={16} /></button>
                  <div className="mt2" style={{ margin: 0 }}>루틴 선택</div>
                </div>
                <div className="sw" style={{ marginBottom: '8px' }}>
                  <IconSearch size={16} className="si" />
                  <input value={routineSearch} onChange={e => setRoutineSearch(e.target.value)}
                    placeholder="루틴 검색..." style={{ paddingLeft: '36px' }} autoFocus />
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)' }}>
                  {routines.filter(r => !routineSearch || r.name.toLowerCase().includes(routineSearch.toLowerCase())).length === 0
                    ? <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--tm)' }}>루틴 없음</div>
                    : routines.filter(r => !routineSearch || r.name.toLowerCase().includes(routineSearch.toLowerCase())).map(r => (
                      <div key={r.id} onClick={() => openRoutineFill(r)}
                        style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '2px' }}>{r.exercises.length}개 운동</div>
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
                  <div className="mt2" style={{ margin: 0 }}>운동 선택</div>
                </div>
                <div className="sw" style={{ marginBottom: '8px' }}>
                  <IconSearch size={16} className="si" />
                  <input value={exSearch} onChange={e => setExSearch(e.target.value)}
                    placeholder="이름 검색..." style={{ paddingLeft: '36px' }} autoFocus />
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)' }}>
                  {filterEx(exSearch).slice(0, 80).map(x => (
                    <div key={x.id} onClick={() => openExFill(x.id)}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{x.ko || x.name}</div>
                        {x.ko && <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{x.name}</div>}
                      </div>
                      <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ fontSize: '10px' }}>{ML[x.muscle] || x.muscle}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Fill 모달 ── */}
      {modal === 'fill' && (
        <div className="mbg">
          <div className="mo" style={{ maxWidth: '560px', padding: 0 }}>
            <div style={{ padding: '12px 18px', borderBottom: '0.5px solid var(--bd)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: timerPhase !== 'idle' ? '10px' : 0 }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{fillTitle || '운동 기록'}</div>
                <div style={{ fontSize: '12px', color: 'var(--tm)' }}>{formatDateHeader(selectedDate)}</div>
              </div>
              {timerPhase !== 'idle' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    {([
                      { label: '총', ms: totalMs, color: 'var(--tp)' },
                      { label: '운동', ms: workMs, color: '#1D9E75' },
                      { label: '휴식', ms: restMs, color: '#BA7517' },
                    ] as const).map(({ label, ms, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--tm)' }}>{label}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(ms)}</span>
                      </div>
                    ))}
                  </div>
                  {timerPhase === 'resting' && (
                    <button onClick={resumeWorkout} style={{
                      padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                      background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}>▶ 시작</button>
                  )}
                  {timerPhase === 'working' && (
                    <span style={{ fontSize: '11px', color: '#1D9E75', fontWeight: 600 }}>● 운동 중</span>
                  )}
                </div>
              )}
            </div>
            <div style={{ maxHeight: 'calc(75vh - 120px)', overflowY: 'auto', padding: '14px 18px' }}>
              {draftExes.map((d, di) => renderDraftEx(d, di))}
              {showAddExInFill ? (
                <div style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: '10px' }}>
                  <div className="sw" style={{ marginBottom: '6px' }}>
                    <IconSearch size={14} className="si" />
                    <input value={addExSearch} onChange={e => setAddExSearch(e.target.value)}
                      placeholder="운동 검색..." style={{ paddingLeft: '32px', fontSize: '13px' }} autoFocus />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filterEx(addExSearch).slice(0, 50).map(x => (
                      <div key={x.id} onClick={() => addDraftEx(x.id)}
                        style={{ padding: '7px 8px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <span>{x.ko || x.name}</span>
                        <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ fontSize: '10px' }}>{ML[x.muscle] || x.muscle}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn" onClick={() => { setShowAddExInFill(false); setAddExSearch('') }}
                    style={{ marginTop: '6px', fontSize: '12px' }}>취소</button>
                </div>
              ) : (
                <button className="btn" onClick={() => setShowAddExInFill(true)} style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
                  <IconPlus size={14} style={{ marginRight: 5 }} />운동 추가
                </button>
              )}
            </div>
            <div style={{ padding: '12px 18px', borderTop: '0.5px solid var(--bd)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={closeFill}>Cancel</button>
              <button className="btn btn-p" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
