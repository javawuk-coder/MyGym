import { useState, useRef } from 'react'
import {
  IconLayoutList, IconPlus, IconPlayerPlay, IconTrash,
  IconPencil, IconSearch, IconX, IconGripVertical,
} from '@tabler/icons-react'
import type { Exercise, Routine, RoutineExercise, WorkoutFormat, WorkoutFormatType } from '../types'

const ML: Record<string, string> = {
  chest:'Chest', back:'Back', legs:'Legs', shoulder:'Shoulder',
  arm:'Arms', core:'Core', glute:'Glute', hiit:'HIIT', cardio:'Cardio',
}
const MB: Record<string, string> = {
  chest:'bc', back:'bb', legs:'bl', shoulder:'bs', arm:'ba',
  core:'bco', glute:'bg', hiit:'bhiit', cardio:'bcard', custom:'bx',
}

const FORMAT_LABELS: Record<WorkoutFormatType, string> = {
  sets_reps: 'Sets & Reps',
  tabata:    'Tabata',
  for_time:  'For Time',
  amrap:     'AMRAP',
  emom:      'EMOM',
  interval:  'Interval',
}
const FORMAT_COLORS: Record<WorkoutFormatType, string> = {
  sets_reps: '#378ADD',
  tabata:    '#E24B4A',
  for_time:  '#EF9F27',
  amrap:     '#534AB7',
  emom:      '#1D9E75',
  interval:  '#D4537E',
}

// 카드에 표시할 포맷 요약
function formatSummary(f: WorkoutFormat): string {
  switch (f.type) {
    case 'tabata': {
      const w = f.workSec ?? 20, r = f.restSec ?? 10, rds = f.tabataRounds ?? 8
      const sets = f.tabataSets ?? 1
      return `Tabata ${w}s/${r}s × ${rds}rds${sets > 1 ? ` × ${sets}sets` : ''}`
    }
    case 'for_time': {
      const rds = f.formatRounds ?? 1
      return `For Time${rds > 1 ? ` — ${rds} Rounds` : ''}${f.timeCap ? ` (cap ${f.timeCap}min)` : ''}`
    }
    case 'amrap':
      return `AMRAP ${f.duration ?? 20}min`
    case 'emom': {
      const ev = f.every ?? 1
      return `E${ev > 1 ? ev : ''}MOM × ${f.duration ?? 20}min`
    }
    case 'interval': {
      const wm = f.workMin ?? 1, rm = f.restMin ?? 1, rds = f.intervalRounds ?? 5
      return `${wm}min on / ${rm}min off × ${rds}rounds`
    }
    default: return 'Sets & Reps'
  }
}

// 운동 목록에서 reps 레이블
function repsLabel(fmt: WorkoutFormat, ex: Exercise, re: RoutineExercise): string {
  if (re.maxReps) return 'MAX'
  const isTime = ex.log_type === 'time'
  const isCardio = ex.log_type === 'cardio'
  if (isCardio) return 'cardio'
  switch (fmt.type) {
    case 'sets_reps':
      return `${re.sets}세트 × ${isTime ? `${re.reps}초` : `${re.reps}회`}`
    case 'for_time':
    case 'amrap':
      return `${isTime ? `${re.reps}초` : `${re.reps}회`}/round`
    case 'emom':
      return `${isTime ? `${re.reps}초` : `${re.reps}회`}/min`
    case 'tabata':
      return `target ${isTime ? `${re.reps}초` : `${re.reps}회`}`
    case 'interval':
      return isTime ? `${re.reps}초` : `${re.reps}회`
    default: return ''
  }
}

const ROUND_TYPE_COLORS: Record<string, string> = {
  odd:  '#EF9F27',
  even: '#534AB7',
  all:  'var(--tm)',
}
const ROUND_TYPE_LABELS: Record<string, string> = { odd: 'ODD', even: 'EVEN', all: 'ALL' }

function matchesQuery(x: Exercise, q: string) {
  if (!q) return true
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
  const target = `${x.name} ${x.ko || ''}`.toLowerCase()
  return tokens.every(t => target.includes(t))
}

function defaultFormat(): WorkoutFormat { return { type: 'sets_reps' } }

// 포맷별 sets 열 표시 여부
function showSetsCol(fmt: WorkoutFormat) { return fmt.type === 'sets_reps' }
// 포맷별 reps 레이블
function repsColLabel(fmt: WorkoutFormat) {
  switch (fmt.type) {
    case 'for_time': case 'amrap': return '회/round'
    case 'emom': return '회/min'
    case 'tabata': return 'target'
    default: return '횟수/초'
  }
}

interface Props {
  routines: (Routine & { id: string })[]
  allExercises: Exercise[]
  onAddRoutine: (r: Omit<Routine, 'id'>) => Promise<void>
  onUpdateRoutine: (id: string, data: { name: string; exercises: RoutineExercise[]; format: WorkoutFormat }) => Promise<void>
  onDeleteRoutine: (id: string) => Promise<void>
  onStartRoutine: (r: Routine & { id: string }) => void
}

export default function RoutinePage({ routines, allExercises, onAddRoutine, onUpdateRoutine, onDeleteRoutine, onStartRoutine }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [routineName, setRoutineName] = useState('')
  const [selected, setSelected] = useState<RoutineExercise[]>([])
  const [format, setFormat] = useState<WorkoutFormat>(defaultFormat())
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('all')
  const dragIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const getEx = (id: string) => allExercises.find(e => e.id === id)

  const sortedEx = [...allExercises].sort((a, b) => (a.ko || a.name).localeCompare(b.ko || b.name, 'ko'))
  const filtered = sortedEx.filter(x => {
    const mOk = filterMuscle === 'all' || x.muscle === filterMuscle
    return mOk && matchesQuery(x, search)
  })

  const isSelected = (id: string) => selected.some(s => s.exId === id)

  const toggleExercise = (id: string) => {
    if (isSelected(id)) {
      setSelected(prev => prev.filter(s => s.exId !== id))
    } else {
      setSelected(prev => [...prev, { exId: id, sets: 3, reps: 10 }])
    }
  }

  const updateSetsReps = (exId: string, field: 'sets' | 'reps', val: string) => {
    const n = Math.max(1, parseInt(val) || 1)
    setSelected(prev => prev.map(s => s.exId === exId ? { ...s, [field]: n } : s))
  }

  const updateExercise = (exId: string, patch: Partial<RoutineExercise>) =>
    setSelected(prev => prev.map(s => s.exId === exId ? { ...s, ...patch } : s))

  const removeFromSelected = (exId: string) => setSelected(prev => prev.filter(s => s.exId !== exId))

  const onDragStart = (i: number) => { dragIndex.current = i }
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i) }
  const onDrop = (i: number) => {
    const from = dragIndex.current
    if (from === null || from === i) { setDragOverIndex(null); return }
    setSelected(prev => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(i, 0, item)
      return arr
    })
    dragIndex.current = null; setDragOverIndex(null)
  }
  const onDragEnd = () => { dragIndex.current = null; setDragOverIndex(null) }

  const updateFormat = (patch: Partial<WorkoutFormat>) => setFormat(prev => ({ ...prev, ...patch }))

  const setFormatType = (t: WorkoutFormatType) => {
    const defaults: Record<WorkoutFormatType, Partial<WorkoutFormat>> = {
      sets_reps: {},
      tabata:    { workSec: 20, restSec: 10, tabataRounds: 8, tabataSets: 1, setRestSec: 120 },
      for_time:  { formatRounds: 1 },
      amrap:     { duration: 20 },
      emom:      { every: 1, duration: 20 },
      interval:  { workMin: 2, restMin: 1, intervalRounds: 6 },
    }
    setFormat({ type: t, ...defaults[t] })
  }

  const openAdd = () => {
    setEditingId(null); setRoutineName(''); setSelected([])
    setFormat(defaultFormat()); setSearch(''); setFilterMuscle('all')
    setShowModal(true)
  }

  const openEdit = (r: Routine & { id: string }) => {
    setEditingId(r.id); setRoutineName(r.name)
    setSelected(r.exercises.map(e =>
      typeof e === 'string' ? { exId: e as unknown as string, sets: 3, reps: 10 } : e
    ))
    setFormat(r.format ?? defaultFormat())
    setSearch(''); setFilterMuscle('all'); setShowModal(true)
  }

  const save = async () => {
    if (!routineName.trim()) { alert('Routine name required'); return }
    if (!selected.length) { alert('Select at least one exercise'); return }
    const data = { name: routineName.trim(), exercises: selected, format }
    if (editingId) await onUpdateRoutine(editingId, data)
    else await onAddRoutine(data)
    setShowModal(false)
  }

  const muscles = ['all', ...Object.keys(ML)]
  const hasSets = showSetsCol(format)
  const gridCols = hasSets ? '20px 1fr 52px 68px 28px' : '20px 1fr 80px 28px'
  const gridColsHeader = hasSets ? '20px 1fr 52px 68px 28px' : '20px 1fr 80px 28px'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="stitle">My Routines</div>
        <button className="btn btn-p" onClick={openAdd}><IconPlus size={14} style={{ marginRight: 4 }} />New Routine</button>
      </div>

      {!routines.length ? (
        <div className="emp">
          <IconLayoutList size={36} style={{ display: 'block', margin: '0 auto 12px' }} />
          루틴을 추가해보세요
        </div>
      ) : (
        routines.map(r => {
          const fmt = r.format ?? { type: 'sets_reps' as WorkoutFormatType }
          const color = FORMAT_COLORS[fmt.type]
          return (
            <div className="card" key={r.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{r.name}</div>
                  <span style={{
                    display: 'inline-block', fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
                    fontWeight: 600, background: `${color}22`, color, border: `0.5px solid ${color}44`,
                  }}>{formatSummary(fmt)}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                  <button className="btn btn-p" onClick={() => onStartRoutine(r)}>
                    <IconPlayerPlay size={14} style={{ marginRight: 4 }} />Start
                  </button>
                  <button className="btn" onClick={() => openEdit(r)}><IconPencil size={14} /></button>
                  <button className="btn btn-d" onClick={() => { if (confirm('Delete?')) onDeleteRoutine(r.id) }}>
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
              <div>
                {r.exercises.map((re, i) => {
                  const raw = re as unknown
                  const exId = typeof raw === 'string' ? raw as string : (raw as RoutineExercise).exId
                  const reObj: RoutineExercise = typeof raw === 'string'
                    ? { exId: raw as string, sets: 3, reps: 10 }
                    : raw as RoutineExercise
                  const ex = getEx(exId)
                  if (!ex) return null
                  const rt = reObj.roundType
                  const rtColor = rt && rt !== 'all' ? ROUND_TYPE_COLORS[rt] : undefined
                  return (
                    <div key={exId + i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '5px 0', borderBottom: i < r.exercises.length - 1 ? '0.5px solid var(--bd)' : 'none',
                    }}>
                      {rt && rt !== 'all' && (
                        <span style={{
                          fontSize: '10px', padding: '1px 6px', borderRadius: '20px', flexShrink: 0,
                          fontWeight: 700, background: `${rtColor}22`, color: rtColor, border: `0.5px solid ${rtColor}44`,
                        }}>{ROUND_TYPE_LABELS[rt]}</span>
                      )}
                      {(!rt || rt === 'all') && <span style={{ color: 'var(--tm)', minWidth: '18px', fontSize: '11px', flexShrink: 0 }}>{i + 1}.</span>}
                      <span style={{ flex: 1, fontSize: '13px' }}>
                        <span style={{ fontWeight: 500 }}>{ex.ko || ex.name}</span>
                        {ex.ko && <span style={{ color: 'var(--tm)', fontSize: '11px', marginLeft: '5px' }}>({ex.name})</span>}
                        {reObj.note && <span style={{ color: 'var(--tm)', fontSize: '11px', marginLeft: '5px' }}>@ {reObj.note}</span>}
                      </span>
                      <span style={{ color: reObj.maxReps ? '#E24B4A' : 'var(--tm)', fontSize: '12px', flexShrink: 0, fontWeight: reObj.maxReps ? 700 : 400 }}>
                        {repsLabel(fmt, ex, reObj)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* ───── 모달 ───── */}
      {showModal && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="mo" style={{ maxWidth: '540px' }}>
            <div className="mt2">{editingId ? 'Edit Routine' : 'New Routine'}</div>

            {/* 루틴 이름 */}
            <span className="fl">Routine name</span>
            <input value={routineName} onChange={e => setRoutineName(e.target.value)}
              placeholder="e.g. Push Day" style={{ marginBottom: '16px' }} />

            {/* ── 워크아웃 포맷 선택 ── */}
            <div className="stitle" style={{ marginBottom: '8px' }}>Workout Format</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {(Object.keys(FORMAT_LABELS) as WorkoutFormatType[]).map(ft => (
                <button key={ft} onClick={() => setFormatType(ft)} style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                  border: `1px solid ${format.type === ft ? FORMAT_COLORS[ft] : 'var(--bd)'}`,
                  background: format.type === ft ? `${FORMAT_COLORS[ft]}22` : 'transparent',
                  color: format.type === ft ? FORMAT_COLORS[ft] : 'var(--ts)',
                  fontWeight: format.type === ft ? 600 : 400, fontFamily: 'inherit',
                }}>{FORMAT_LABELS[ft]}</button>
              ))}
            </div>

            {/* ── 포맷별 파라미터 ── */}
            {format.type === 'tabata' && (
              <div style={{ background: 'var(--s1)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '10px', fontWeight: 500 }}>
                  Tabata: 운동 블록을 work/rest 인터벌로 반복합니다
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  {[
                    { label: 'Work (초)', key: 'workSec', def: 20 },
                    { label: 'Rest (초)', key: 'restSec', def: 10 },
                    { label: 'Rounds/운동', key: 'tabataRounds', def: 8 },
                  ].map(({ label, key, def }) => (
                    <div key={key}>
                      <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>{label}</div>
                      <input type="number" min="1"
                        value={(format as unknown as Record<string, number>)[key] ?? def}
                        onChange={e => updateFormat({ [key]: parseInt(e.target.value) || def })}
                        style={{ textAlign: 'center', padding: '5px' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Sets (전체 반복)', key: 'tabataSets', def: 1 },
                    { label: 'Set 간 휴식 (초)', key: 'setRestSec', def: 120 },
                  ].map(({ label, key, def }) => (
                    <div key={key}>
                      <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>{label}</div>
                      <input type="number" min="1"
                        value={(format as unknown as Record<string, number>)[key] ?? def}
                        onChange={e => updateFormat({ [key]: parseInt(e.target.value) || def })}
                        style={{ textAlign: 'center', padding: '5px' }} />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '8px' }}>
                  예: 20s on / 10s off × 8rounds × 1set = 4분/운동
                </div>
              </div>
            )}

            {format.type === 'for_time' && (
              <div style={{ background: 'var(--s1)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '10px', fontWeight: 500 }}>
                  For Time: 정해진 운동량을 최대한 빠르게 완료. 점수 = 완료 시간
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Rounds (circuit 반복)</div>
                    <input type="number" min="1" value={format.formatRounds ?? 1}
                      onChange={e => updateFormat({ formatRounds: parseInt(e.target.value) || 1 })}
                      style={{ textAlign: 'center', padding: '5px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Time Cap (분, 선택)</div>
                    <input type="number" min="1" value={format.timeCap ?? ''}
                      onChange={e => updateFormat({ timeCap: parseInt(e.target.value) || undefined })}
                      placeholder="없음" style={{ textAlign: 'center', padding: '5px' }} />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '8px' }}>
                  아래 운동별 reps = 라운드당 횟수. 총 운동량 = reps × rounds
                </div>
              </div>
            )}

            {format.type === 'amrap' && (
              <div style={{ background: 'var(--s1)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '10px', fontWeight: 500 }}>
                  AMRAP: 정해진 시간 안에 circuit를 최대한 반복. 점수 = rounds + reps
                </div>
                <div style={{ maxWidth: '180px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Duration (분)</div>
                  <input type="number" min="1" value={format.duration ?? 20}
                    onChange={e => updateFormat({ duration: parseInt(e.target.value) || 20 })}
                    style={{ textAlign: 'center', padding: '5px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '8px' }}>
                  아래 운동별 reps = 1라운드당 횟수
                </div>
              </div>
            )}

            {format.type === 'emom' && (
              <div style={{ background: 'var(--s1)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '10px', fontWeight: 500 }}>
                  EMOM: 매 X분 시작에 정해진 reps 수행, 나머지는 휴식. 점수 = 완료율
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Every X분 (E<strong>X</strong>MOM)</div>
                    <input type="number" min="1" max="10" value={format.every ?? 1}
                      onChange={e => updateFormat({ every: parseInt(e.target.value) || 1 })}
                      style={{ textAlign: 'center', padding: '5px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Total Duration (분)</div>
                    <input type="number" min="1" value={format.duration ?? 20}
                      onChange={e => updateFormat({ duration: parseInt(e.target.value) || 20 })}
                      style={{ textAlign: 'center', padding: '5px' }} />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '8px' }}>
                  예: E2MOM × 20min = 10번의 인터벌. 아래 reps = 인터벌당 횟수
                </div>
              </div>
            )}

            {format.type === 'interval' && (
              <div style={{ background: 'var(--s1)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '10px', fontWeight: 500 }}>
                  Interval: 자유 형식 work / rest 반복 — 운동별 ODD/EVEN 라운드 지정 가능
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Work (분)', key: 'workMin', def: 2 },
                    { label: 'Rest (분)', key: 'restMin', def: 1 },
                    { label: 'Rounds', key: 'intervalRounds', def: 6 },
                  ].map(({ label, key, def }) => (
                    <div key={key}>
                      <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>{label}</div>
                      <input type="number" min="1"
                        value={(format as unknown as Record<string, number>)[key] ?? def}
                        onChange={e => updateFormat({ [key]: parseInt(e.target.value) || def })}
                        style={{ textAlign: 'center', padding: '5px' }} />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '8px' }}>
                  아래 운동별로 ODD/EVEN 라운드 지정 및 MAX 플래그, 메모 입력 가능
                </div>
              </div>
            )}

            {/* ── 운동 검색 ── */}
            <div className="stitle" style={{ marginBottom: '8px' }}>운동 추가</div>
            <div className="sw" style={{ marginBottom: '6px' }}>
              <IconSearch size={16} className="si" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search... (단어 순서 무관)" style={{ paddingLeft: '36px' }} />
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {muscles.map(m => (
                <button key={m} className={`mfb${filterMuscle === m ? ' on' : ''}`} onClick={() => setFilterMuscle(m)}>
                  {m === 'all' ? 'All' : (ML[m] || m)}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '0 4px', marginBottom: '14px' }}>
              {!filtered.length ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--tm)', fontSize: '13px' }}>No results</div>
              ) : filtered.map(x => {
                const checked = isSelected(x.id)
                return (
                  <div key={x.id} className={`exrow${checked ? ' sel' : ''}`} onClick={() => toggleExercise(x.id)}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {x.ko || x.name}
                        {x.ko && <span style={{ color: 'var(--tm)', fontSize: '11px', marginLeft: '5px' }}>({x.name})</span>}
                        {x.custom && <span className="ctag" style={{ marginLeft: '4px' }}>custom</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--tm)' }}>
                        <span className={`badge ${MB[x.muscle] || 'bx'}`}>{ML[x.muscle] || x.muscle}</span>
                      </div>
                    </div>
                    <div style={{ color: checked ? '#185FA5' : 'var(--bds)', fontSize: '18px' }}>{checked ? '✓' : '+'}</div>
                  </div>
                )
              })}
            </div>

            {/* ── 선택된 운동 ── */}
            {selected.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div className="stitle" style={{ marginBottom: '8px' }}>선택된 운동 ({selected.length})</div>
                <div style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                  {/* 헤더 */}
                  <div style={{ display: 'grid', gridTemplateColumns: gridColsHeader, gap: '4px', padding: '6px 10px', background: 'var(--s1)', fontSize: '11px', color: 'var(--tm)' }}>
                    <span></span>
                    <span>운동</span>
                    {hasSets && <span style={{ textAlign: 'center' }}>세트</span>}
                    <span style={{ textAlign: 'center' }}>{repsColLabel(format)}</span>
                    <span></span>
                  </div>
                  {selected.map((s, i) => {
                    const ex = getEx(s.exId)
                    if (!ex) return null
                    const isTime = ex.log_type === 'time'
                    const isCardio = ex.log_type === 'cardio'
                    const isDragOver = dragOverIndex === i
                    const isInterval = format.type === 'interval'
                    const rt = s.roundType ?? 'all'

                    return (
                      <div key={s.exId} draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)}
                        onDrop={() => onDrop(i)}
                        onDragEnd={onDragEnd}
                        style={{
                          padding: '8px 10px', borderTop: '0.5px solid var(--bd)',
                          background: isDragOver ? 'var(--s1)' : undefined,
                          borderLeft: isDragOver ? '2px solid #378ADD' : '2px solid transparent',
                        }}>

                        {/* 1행: grip + 이름 + 컨트롤 */}
                        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '4px', alignItems: 'center', cursor: 'grab' }}>
                          <IconGripVertical size={14} style={{ color: 'var(--tm)' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{ex.ko || ex.name}</div>
                            {ex.ko && <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{ex.name}</div>}
                          </div>
                          {hasSets && (
                            isCardio
                              ? <div style={{ fontSize: '11px', color: 'var(--tm)', textAlign: 'center' }}>—</div>
                              : <input type="number" min="1" value={s.sets}
                                  onChange={e => updateSetsReps(s.exId, 'sets', e.target.value)}
                                  style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }} />
                          )}
                          {s.maxReps
                            ? <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#E24B4A' }}>MAX</div>
                            : isCardio
                              ? <div style={{ fontSize: '11px', color: 'var(--tm)', textAlign: 'center' }}>cardio</div>
                              : <input type="number" min="1" value={s.reps}
                                  onChange={e => updateSetsReps(s.exId, 'reps', e.target.value)}
                                  style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }}
                                  placeholder={isTime ? '초' : '회'} />
                          }
                          <button className="idb" onClick={() => removeFromSelected(s.exId)}><IconX size={14} /></button>
                        </div>

                        {/* 2행: Interval 전용 — ODD/EVEN/ALL + MAX + note */}
                        {isInterval && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', paddingLeft: '24px', flexWrap: 'wrap' }}>
                            {/* ODD / EVEN / ALL 선택 */}
                            {(['odd', 'even', 'all'] as const).map(v => (
                              <button key={v} onClick={() => updateExercise(s.exId, { roundType: v })} style={{
                                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                                border: `1px solid ${rt === v ? ROUND_TYPE_COLORS[v] : 'var(--bd)'}`,
                                background: rt === v ? `${ROUND_TYPE_COLORS[v]}22` : 'transparent',
                                color: rt === v ? ROUND_TYPE_COLORS[v] : 'var(--tm)',
                                fontWeight: rt === v ? 700 : 400,
                              }}>{ROUND_TYPE_LABELS[v]}</button>
                            ))}
                            {/* MAX 토글 */}
                            <button onClick={() => updateExercise(s.exId, { maxReps: !s.maxReps })} style={{
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                              border: `1px solid ${s.maxReps ? '#E24B4A' : 'var(--bd)'}`,
                              background: s.maxReps ? '#E24B4A22' : 'transparent',
                              color: s.maxReps ? '#E24B4A' : 'var(--tm)',
                              fontWeight: s.maxReps ? 700 : 400,
                            }}>MAX</button>
                            {/* 메모 (@ weight 등) */}
                            <input value={s.note ?? ''} onChange={e => updateExercise(s.exId, { note: e.target.value || undefined })}
                              placeholder="메모 (예: @ 55/75 lb)" style={{ flex: 1, minWidth: '120px', fontSize: '12px', padding: '3px 8px' }} />
                          </div>
                        )}
                        {/* non-interval에서도 MAX 토글 제공 (AMRAP, EMOM, Tabata, For Time) */}
                        {!isInterval && (format.type === 'amrap' || format.type === 'emom' || format.type === 'tabata' || format.type === 'for_time') && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '5px', paddingLeft: '24px', flexWrap: 'wrap' }}>
                            <button onClick={() => updateExercise(s.exId, { maxReps: !s.maxReps })} style={{
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                              border: `1px solid ${s.maxReps ? '#E24B4A' : 'var(--bd)'}`,
                              background: s.maxReps ? '#E24B4A22' : 'transparent',
                              color: s.maxReps ? '#E24B4A' : 'var(--tm)',
                              fontWeight: s.maxReps ? 700 : 400,
                            }}>MAX</button>
                            <input value={s.note ?? ''} onChange={e => updateExercise(s.exId, { note: e.target.value || undefined })}
                              placeholder="메모 (예: @ 55/75 lb)" style={{ flex: 1, minWidth: '120px', fontSize: '12px', padding: '3px 8px' }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-p" onClick={save}>{editingId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
