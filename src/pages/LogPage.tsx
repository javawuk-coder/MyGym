import { useState, useEffect } from 'react'
import { IconPlus, IconTrash, IconSearch, IconChevronLeft, IconCalendar } from '@tabler/icons-react'
import type { Exercise, DayLog, LogEntry, LogType, Routine, ExerciseSet } from '../types'

const ML: Record<string, string> = {
  chest: 'Chest', back: 'Back', legs: 'Legs', shoulder: 'Shoulder',
  arm: 'Arms', core: 'Core', glute: 'Glute', hiit: 'HIIT', cardio: 'Cardio',
}
const MB: Record<string, string> = {
  chest: 'bc', back: 'bb', legs: 'bl', shoulder: 'bs', arm: 'ba',
  core: 'bco', glute: 'bg', hiit: 'bhiit', cardio: 'bcard', custom: 'bx',
}

function toKg(v: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(v / 2.205 * 10) / 10 : parseFloat(String(v)) || 0 }
function fromKg(kg: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(kg * 2.205 * 10) / 10 : kg }
function formatDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }) }
function today() { return new Date().toISOString().slice(0, 10) }

interface SetRow { weight: string; reps: string; duration: string }
interface DraftEx {
  exId: string
  rows: SetRow[]
  cardio: { dist: string; time: string; cal: string }
}

type ModalState = null | 'pick' | 'routine-select' | 'ex-select' | 'fill'

function makeRows(count: number, reps?: number): SetRow[] {
  return Array.from({ length: count }, () => ({
    weight: '', reps: reps != null ? String(reps) : '', duration: '',
  }))
}

function draftFromRoutine(routine: Routine, allExercises: Exercise[]): DraftEx[] {
  return routine.exercises.map(re => {
    const ex = allExercises.find(e => e.id === re.exId)
    const lt = ex?.log_type || 'weight_reps'
    if (lt === 'cardio') return { exId: re.exId, rows: [], cardio: { dist: '', time: '', cal: '' } }
    const reps = lt !== 'weight_reps' ? re.reps : undefined
    return { exId: re.exId, rows: makeRows(re.sets || 3, reps), cardio: { dist: '', time: '', cal: '' } }
  })
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
  const [selectedDate, setSelectedDate] = useState(today())
  const [modal, setModal] = useState<ModalState>(null)
  const [fillTitle, setFillTitle] = useState('')
  const [draftExes, setDraftExes] = useState<DraftEx[]>([])
  const [exSearch, setExSearch] = useState('')
  const [routineSearch, setRoutineSearch] = useState('')
  const [showAddExInFill, setShowAddExInFill] = useState(false)
  const [addExSearch, setAddExSearch] = useState('')

  // Start 버튼으로 들어온 루틴 처리
  useEffect(() => {
    if (!initialRoutine) return
    setFillTitle(initialRoutine.name)
    setDraftExes(draftFromRoutine(initialRoutine, allExercises))
    setModal('fill')
    onConsumedInitial?.()
  }, [initialRoutine]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLog = logs.find(l => l.date === selectedDate)
  const recentDates = logs
    .filter(l => l.date !== selectedDate && l.exercises.length)
    .slice(0, 8)

  const getEx = (id: string) => allExercises.find(e => e.id === id)

  const sortedEx = [...allExercises].sort((a, b) => (a.ko || a.name).localeCompare(b.ko || b.name, 'ko'))

  const filterEx = (search: string) => {
    if (!search) return sortedEx
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean)
    return sortedEx.filter(x => {
      const target = `${x.name} ${x.ko || ''}`.toLowerCase()
      return tokens.every(t => target.includes(t))
    })
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

  const addDraftEx = (exId: string) => {
    setDraftExes(prev => [...prev, { exId, rows: makeRows(3), cardio: { dist: '', time: '', cal: '' } }])
    setAddExSearch('')
    setShowAddExInFill(false)
  }

  // ── Open helpers ──────────────────────────────────────────────
  const openRoutineFill = (r: Routine & { id: string }) => {
    setFillTitle(r.name)
    setDraftExes(draftFromRoutine(r, allExercises))
    setModal('fill')
  }

  const openExFill = (exId: string) => {
    setFillTitle('')
    setDraftExes([{ exId, rows: makeRows(3), cardio: { dist: '', time: '', cal: '' } }])
    setModal('fill')
  }

  const closeFill = () => {
    setModal(null)
    setDraftExes([])
    setFillTitle('')
    setExSearch('')
    setRoutineSearch('')
    setShowAddExInFill(false)
    setAddExSearch('')
  }

  // ── Save ──────────────────────────────────────────────────────
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

  // ── Entry body renderer (for saved log view) ──────────────────
  const renderEntryBody = (entry: LogEntry) => {
    const lt = entry.log_type || 'weight_reps'
    if (lt === 'cardio') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: 'var(--tm)' }}>거리</div><div style={{ fontWeight: 500 }}>{entry.dist || 0} km</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: 'var(--tm)' }}>시간</div><div style={{ fontWeight: 500 }}>{entry.time || 0} 분</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: 'var(--tm)' }}>칼로리</div><div style={{ fontWeight: 500 }}>{entry.cal || 0} kcal</div></div>
        </div>
      )
    }
    const cols = lt === 'weight_reps' ? '28px 1fr 1fr' : '28px 1fr'
    const vol = lt === 'weight_reps'
      ? Math.round((entry.sets || []).reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0))
      : null
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px', fontSize: '11px', color: 'var(--tm)', padding: '3px 0' }}>
          <span>#</span>
          {lt === 'weight_reps' ? <><span>Weight</span><span>Reps</span></> : <span>{lt === 'time' ? '시간' : 'Reps'}</span>}
        </div>
        {(entry.sets || []).map((s, si) => (
          <div key={si} style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px', padding: '4px 0', borderBottom: '0.5px solid var(--bd)', fontSize: '13px' }}>
            <span style={{ textAlign: 'center', color: 'var(--tm)' }}>{si + 1}</span>
            {lt === 'weight_reps'
              ? <><span style={{ textAlign: 'center', fontWeight: 500 }}>{fromKg(s.weight || 0, unit)} {unit}</span><span style={{ textAlign: 'center' }}>{s.reps} reps</span></>
              : lt === 'time'
              ? <span style={{ fontWeight: 500 }}>{s.duration}초</span>
              : <span style={{ fontWeight: 500 }}>{s.reps} reps</span>
            }
          </div>
        ))}
        {vol !== null && <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--tm)', textAlign: 'right' }}>Volume: {vol} kg</div>}
      </div>
    )
  }

  // ── Draft exercise card ───────────────────────────────────────
  const renderDraftEx = (d: DraftEx, di: number) => {
    const ex = getEx(d.exId)
    const lt: LogType = ex?.log_type || 'weight_reps'
    const isCardio = lt === 'cardio'

    return (
      <div key={di} style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', marginBottom: '10px', overflow: 'hidden' }}>
        {/* 운동 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd)' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{ex?.ko || ex?.name || d.exId}</span>
            {ex?.ko && <span style={{ fontSize: '11px', color: 'var(--tm)', marginLeft: '6px' }}>{ex.name}</span>}
            {ex && <span className={`badge ${MB[ex.muscle] || 'bx'}`} style={{ marginLeft: '6px', fontSize: '10px' }}>{ML[ex.muscle] || ex.muscle}</span>}
          </div>
          <button className="idb" onClick={() => removeDraftEx(di)} title="제거"><IconTrash size={14} /></button>
        </div>

        {/* 세트 입력 */}
        <div style={{ padding: '10px 12px' }}>
          {isCardio ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['dist', 'time', 'cal'] as const).map(f => (
                <div key={f}>
                  <div style={{ fontSize: '10px', color: 'var(--tm)', marginBottom: '3px', textAlign: 'center' }}>
                    {f === 'dist' ? '거리 (km)' : f === 'time' ? '시간 (분)' : '칼로리'}
                  </div>
                  <input type="number" value={d.cardio[f]} onChange={e => updateCardio(di, f, e.target.value)}
                    placeholder="0" min="0" style={{ textAlign: 'center' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: lt === 'weight_reps' ? '24px 1fr 1fr 24px' : '24px 1fr 24px', gap: '6px', fontSize: '10px', color: 'var(--tm)', marginBottom: '4px' }}>
                <span style={{ textAlign: 'center' }}>#</span>
                {lt === 'weight_reps'
                  ? <><span style={{ textAlign: 'center' }}>Weight ({unit})</span><span style={{ textAlign: 'center' }}>Reps</span></>
                  : <span style={{ textAlign: 'center' }}>{lt === 'time' ? '시간 (초)' : 'Reps'}</span>
                }
                <span />
              </div>
              {d.rows.map((row, ri) => (
                <div key={ri} className="sr" style={{ gridTemplateColumns: lt === 'weight_reps' ? '24px 1fr 1fr 24px' : '24px 1fr 24px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--tm)', textAlign: 'center', alignSelf: 'center' }}>{ri + 1}</span>
                  {lt === 'weight_reps' ? (
                    <>
                      <input type="number" value={row.weight} onChange={e => updateRow(di, ri, 'weight', e.target.value)} placeholder="0" min="0" step="0.5" style={{ textAlign: 'center' }} />
                      <input type="number" value={row.reps} onChange={e => updateRow(di, ri, 'reps', e.target.value)} placeholder="0" min="0" style={{ textAlign: 'center' }} />
                    </>
                  ) : (
                    <input type="number"
                      value={lt === 'time' ? row.duration : row.reps}
                      onChange={e => updateRow(di, ri, lt === 'time' ? 'duration' : 'reps', e.target.value)}
                      placeholder="0" min="0" style={{ textAlign: 'center' }} />
                  )}
                  <button className="idb" onClick={() => removeRow(di, ri)}>&times;</button>
                </div>
              ))}
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
  return (
    <div>
      {/* 날짜 선택 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="stitle" style={{ margin: 0 }}>
            {selectedDate === today() ? 'Today' : formatDate(selectedDate)}
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconCalendar size={16} style={{ position: 'absolute', left: 8, color: 'var(--tm)', pointerEvents: 'none' }} />
            <input
              type="date"
              value={selectedDate}
              max={today()}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ paddingLeft: '28px', fontSize: '13px', cursor: 'pointer', width: '150px' }}
            />
          </div>
          {selectedDate !== today() && (
            <button className="btn" onClick={() => setSelectedDate(today())} style={{ fontSize: '12px' }}>Today</button>
          )}
        </div>
        <button className="btn btn-p" onClick={() => setModal('pick')}>
          <IconPlus size={14} style={{ marginRight: 4 }} />Add
        </button>
      </div>

      {/* 선택된 날짜의 로그 */}
      {!selectedLog || !selectedLog.exercises.length ? (
        <div className="emp">{selectedDate === today() ? '오늘 기록이 없어요' : '이 날 기록이 없어요'}</div>
      ) : (
        selectedLog.exercises.map((entry, ei) => {
          const x = getEx(entry.exId)
          return (
            <div className="card" key={ei}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{x?.ko || x?.name || entry.exId}</span>
                  {x?.ko && <span style={{ fontSize: '12px', color: 'var(--tm)', marginLeft: '8px' }}>{x.name}</span>}
                  {x && <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ marginLeft: '6px' }}>{ML[x.muscle] || x.muscle}</span>}
                </div>
                <button className="idb" onClick={() => onDeleteEntry(selectedDate, ei)}><IconTrash size={16} /></button>
              </div>
              {renderEntryBody(entry)}
            </div>
          )
        })
      )}

      {/* History */}
      <div style={{ marginTop: '2rem' }}>
        <div className="stitle" style={{ marginBottom: '10px' }}>History</div>
        {!recentDates.length ? (
          <div style={{ fontSize: '13px', color: 'var(--tm)', textAlign: 'center', padding: '1.5rem' }}>기록 없음</div>
        ) : (
          recentDates.map(l => (
            <div className="le" key={l.date} onClick={() => setSelectedDate(l.date)}
              style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '12px', color: 'var(--tm)', marginBottom: '5px' }}>{formatDate(l.date)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {l.exercises.map((e, i) => {
                  const x = getEx(e.exId)
                  return <span key={i} className={`badge ${x ? (MB[x.muscle] || 'bx') : 'bx'}`}>{x?.ko || x?.name || e.exId}</span>
                })}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tm)', marginTop: '5px' }}>{l.exercises.length} exercises</div>
            </div>
          ))
        )}
      </div>

      {/* ── 모달들 ── */}
      {modal && modal !== 'fill' && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="mo" style={{ maxWidth: '480px' }}>

            {/* Pick: 루틴 vs 개별 */}
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

            {/* Routine select */}
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
                  {routines.filter(r => !routineSearch || r.name.toLowerCase().includes(routineSearch.toLowerCase())).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--tm)' }}>루틴 없음</div>
                  ) : routines
                    .filter(r => !routineSearch || r.name.toLowerCase().includes(routineSearch.toLowerCase()))
                    .map(r => (
                      <div key={r.id} onClick={() => openRoutineFill(r)}
                        style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '2px' }}>
                          {r.exercises.length}개 운동
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}

            {/* Exercise select */}
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

      {/* Fill 모달 */}
      {modal === 'fill' && (
        <div className="mbg">
          <div className="mo" style={{ maxWidth: '560px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* 헤더 */}
            <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--bd)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{fillTitle || '운동 기록'}</div>
                <div style={{ fontSize: '12px', color: 'var(--tm)' }}>{formatDate(selectedDate)}</div>
              </div>
            </div>

            {/* 운동 목록 (스크롤) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', minHeight: 0 }}>
              {draftExes.map((d, di) => renderDraftEx(d, di))}

              {/* 운동 추가 */}
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
                        style={{ padding: '7px 8px', cursor: 'pointer', borderBottom: '0.5px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}
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
                <button className="btn" onClick={() => setShowAddExInFill(true)}
                  style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
                  <IconPlus size={14} style={{ marginRight: 5 }} />운동 추가
                </button>
              )}
            </div>

            {/* 푸터 */}
            <div style={{ padding: '12px 18px', borderTop: '0.5px solid var(--bd)', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button className="btn" onClick={closeFill}>Cancel</button>
              <button className="btn btn-p" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
