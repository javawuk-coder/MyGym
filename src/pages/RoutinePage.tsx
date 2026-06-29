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
  tabata: 'Tabata',
  for_time: 'For Time',
  amrap: 'AMRAP',
  emom: 'EMOM',
  interval: 'Interval',
}
const FORMAT_COLORS: Record<WorkoutFormatType, string> = {
  sets_reps: '#378ADD',
  tabata: '#E24B4A',
  for_time: '#EF9F27',
  amrap: '#534AB7',
  emom: '#1D9E75',
  interval: '#D4537E',
}

function formatSummary(f: WorkoutFormat): string {
  switch (f.type) {
    case 'tabata':   return `${f.workSec ?? 20}s on / ${f.restSec ?? 10}s off × ${f.rounds ?? 8}rounds`
    case 'for_time': return `For Time${f.timeCap ? ` (cap ${f.timeCap}min)` : ''}`
    case 'amrap':    return `AMRAP ${f.duration ?? 20}min`
    case 'emom':     return `E${f.every ?? 1}MOM × ${f.duration ?? 20}min`
    case 'interval': return `${f.workMin ?? 1}min on / ${f.restMin ?? 1}min off × ${f.rounds ?? 5}rounds`
    default:         return 'Sets & Reps'
  }
}

function matchesQuery(x: Exercise, q: string) {
  if (!q) return true
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
  const target = `${x.name} ${x.ko || ''}`.toLowerCase()
  return tokens.every(t => target.includes(t))
}

function defaultFormat(): WorkoutFormat {
  return { type: 'sets_reps' }
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
    dragIndex.current = null
    setDragOverIndex(null)
  }
  const onDragEnd = () => { dragIndex.current = null; setDragOverIndex(null) }

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
    setSearch(''); setFilterMuscle('all')
    setShowModal(true)
  }

  const updateFormat = (patch: Partial<WorkoutFormat>) => setFormat(prev => ({ ...prev, ...patch }))

  const save = async () => {
    if (!routineName.trim()) { alert('Routine name required'); return }
    if (!selected.length) { alert('Select at least one exercise'); return }
    const data = { name: routineName.trim(), exercises: selected, format }
    if (editingId) await onUpdateRoutine(editingId, data)
    else await onAddRoutine(data)
    setShowModal(false)
  }

  const muscles = ['all', ...Object.keys(ML)]

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
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>{r.name}</span>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{
                      display: 'inline-block', fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
                      fontWeight: 600, background: `${color}22`, color, border: `0.5px solid ${color}44`,
                    }}>{formatSummary(fmt)}</span>
                  </div>
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
                  const ex = getEx(typeof re === 'string' ? re as unknown as string : re.exId)
                  if (!ex) return null
                  const sets = typeof re === 'string' ? 3 : re.sets
                  const reps = typeof re === 'string' ? 10 : re.reps
                  const isTime = ex.log_type === 'time'
                  const isCardio = ex.log_type === 'cardio'
                  const showSets = fmt.type === 'sets_reps' && !isCardio

                  return (
                    <div key={re.exId ?? i} style={{
                      display: 'flex', alignItems: 'baseline', gap: '8px',
                      padding: '5px 0', borderBottom: i < r.exercises.length - 1 ? '0.5px solid var(--bd)' : 'none',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: 'var(--tm)', minWidth: '18px', fontSize: '11px' }}>{i + 1}.</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{ex.ko || ex.name}</span>
                        {ex.ko && <span style={{ color: 'var(--tm)', fontSize: '11px', marginLeft: '5px' }}>({ex.name})</span>}
                      </span>
                      {showSets && (
                        <span style={{ color: 'var(--tm)', fontSize: '12px', flexShrink: 0 }}>
                          {sets}세트 × {isTime ? `${reps}초` : `${reps}회`}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* 모달 */}
      {showModal && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="mo" style={{ maxWidth: '520px' }}>
            <div className="mt2">{editingId ? 'Edit Routine' : 'New Routine'}</div>

            {/* 루틴 이름 */}
            <span className="fl">Routine name</span>
            <input value={routineName} onChange={e => setRoutineName(e.target.value)} placeholder="e.g. Push Day" style={{ marginBottom: '14px' }} />

            {/* 워크아웃 포맷 */}
            <div className="stitle" style={{ marginBottom: '8px' }}>Workout Format</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {(Object.keys(FORMAT_LABELS) as WorkoutFormatType[]).map(ft => (
                <button
                  key={ft}
                  onClick={() => updateFormat({ type: ft })}
                  style={{
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${format.type === ft ? FORMAT_COLORS[ft] : 'var(--bd)'}`,
                    background: format.type === ft ? `${FORMAT_COLORS[ft]}22` : 'transparent',
                    color: format.type === ft ? FORMAT_COLORS[ft] : 'var(--ts)',
                    fontWeight: format.type === ft ? 600 : 400, fontFamily: 'inherit',
                  }}
                >{FORMAT_LABELS[ft]}</button>
              ))}
            </div>

            {/* 포맷별 파라미터 */}
            {format.type === 'tabata' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Work (초)', key: 'workSec', def: 20 },
                  { label: 'Rest (초)', key: 'restSec', def: 10 },
                  { label: 'Rounds', key: 'rounds', def: 8 },
                ].map(({ label, key, def }) => (
                  <div key={key}>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>{label}</div>
                    <input type="number" min="1" value={(format as Record<string, number>)[key] ?? def}
                      onChange={e => updateFormat({ [key]: parseInt(e.target.value) || def })}
                      style={{ textAlign: 'center', padding: '5px' }} />
                  </div>
                ))}
              </div>
            )}
            {format.type === 'for_time' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Time Cap (분)</div>
                  <input type="number" min="1" value={format.timeCap ?? 20}
                    onChange={e => updateFormat({ timeCap: parseInt(e.target.value) || 20 })}
                    style={{ textAlign: 'center', padding: '5px' }} />
                </div>
              </div>
            )}
            {format.type === 'amrap' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Duration (분)</div>
                  <input type="number" min="1" value={format.duration ?? 20}
                    onChange={e => updateFormat({ duration: parseInt(e.target.value) || 20 })}
                    style={{ textAlign: 'center', padding: '5px' }} />
                </div>
              </div>
            )}
            {format.type === 'emom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Every X분 (E<b>X</b>MOM)</div>
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
            )}
            {format.type === 'interval' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Work (분)', key: 'workMin', def: 1 },
                  { label: 'Rest (분)', key: 'restMin', def: 1 },
                  { label: 'Rounds', key: 'rounds', def: 5 },
                ].map(({ label, key, def }) => (
                  <div key={key}>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>{label}</div>
                    <input type="number" min="1" value={(format as Record<string, number>)[key] ?? def}
                      onChange={e => updateFormat({ [key]: parseInt(e.target.value) || def })}
                      style={{ textAlign: 'center', padding: '5px' }} />
                  </div>
                ))}
              </div>
            )}

            {/* 운동 검색 */}
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

            {/* 선택된 운동 + 세트/횟수 (sets_reps 모드일 때만) */}
            {selected.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div className="stitle" style={{ marginBottom: '8px' }}>선택된 운동 ({selected.length})</div>
                <div style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: format.type === 'sets_reps' ? '20px 1fr 60px 60px 28px' : '20px 1fr 28px', gap: '6px', padding: '6px 10px', background: 'var(--s1)', fontSize: '11px', color: 'var(--tm)' }}>
                    <span></span><span>운동</span>
                    {format.type === 'sets_reps' && <><span style={{ textAlign: 'center' }}>세트</span><span style={{ textAlign: 'center' }}>횟수/초</span></>}
                    <span></span>
                  </div>
                  {selected.map((s, i) => {
                    const ex = getEx(s.exId)
                    if (!ex) return null
                    const isTime = ex.log_type === 'time'
                    const isCardio = ex.log_type === 'cardio'
                    const isDragOver = dragOverIndex === i
                    return (
                      <div
                        key={s.exId}
                        draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)}
                        onDrop={() => onDrop(i)}
                        onDragEnd={onDragEnd}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: format.type === 'sets_reps' ? '20px 1fr 60px 60px 28px' : '20px 1fr 28px',
                          gap: '6px', padding: '7px 10px', borderTop: '0.5px solid var(--bd)', alignItems: 'center',
                          background: isDragOver ? 'var(--s1)' : undefined,
                          borderLeft: isDragOver ? '2px solid #378ADD' : '2px solid transparent',
                          cursor: 'grab',
                        }}
                      >
                        <IconGripVertical size={14} style={{ color: 'var(--tm)' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{ex.ko || ex.name}</div>
                          {ex.ko && <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{ex.name}</div>}
                        </div>
                        {format.type === 'sets_reps' && (
                          isCardio ? (
                            <div style={{ gridColumn: '3 / 5', fontSize: '11px', color: 'var(--tm)', textAlign: 'center' }}>cardio</div>
                          ) : (
                            <>
                              <input type="number" min="1" value={s.sets}
                                onChange={e => updateSetsReps(s.exId, 'sets', e.target.value)}
                                style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }} />
                              <input type="number" min="1" value={s.reps}
                                onChange={e => updateSetsReps(s.exId, 'reps', e.target.value)}
                                style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }}
                                placeholder={isTime ? '초' : '회'} />
                            </>
                          )
                        )}
                        <button className="idb" onClick={() => removeFromSelected(s.exId)}><IconX size={14} /></button>
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
