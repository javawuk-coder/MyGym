import { useState, useRef } from 'react'
import {
  IconLayoutList, IconPlus, IconPlayerPlay, IconTrash,
  IconPencil, IconSearch, IconX, IconGripVertical,
} from '@tabler/icons-react'
import type { Exercise, Routine, RoutineExercise } from '../types'

const ML: Record<string, string> = {
  chest:'Chest', back:'Back', legs:'Legs', shoulder:'Shoulder',
  arm:'Arms', core:'Core', glute:'Glute', hiit:'HIIT', cardio:'Cardio',
}
const MB: Record<string, string> = {
  chest:'bc', back:'bb', legs:'bl', shoulder:'bs', arm:'ba',
  core:'bco', glute:'bg', hiit:'bhiit', cardio:'bcard', custom:'bx',
}

function matchesQuery(x: Exercise, q: string) {
  if (!q) return true
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
  const target = `${x.name} ${x.ko || ''}`.toLowerCase()
  return tokens.every(t => target.includes(t))
}

interface Props {
  routines: (Routine & { id: string })[]
  allExercises: Exercise[]
  onAddRoutine: (r: Omit<Routine, 'id'>) => Promise<void>
  onUpdateRoutine: (id: string, data: { name: string; exercises: RoutineExercise[] }) => Promise<void>
  onDeleteRoutine: (id: string) => Promise<void>
  onStartRoutine: (r: Routine & { id: string }) => void
}

export default function RoutinePage({ routines, allExercises, onAddRoutine, onUpdateRoutine, onDeleteRoutine, onStartRoutine }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [routineName, setRoutineName] = useState('')
  const [selected, setSelected] = useState<RoutineExercise[]>([])
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

  const removeFromSelected = (exId: string) => {
    setSelected(prev => prev.filter(s => s.exId !== exId))
  }

  const onDragStart = (i: number) => { dragIndex.current = i }
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    setDragOverIndex(i)
  }
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
    setEditingId(null)
    setRoutineName('')
    setSelected([])
    setSearch('')
    setFilterMuscle('all')
    setShowModal(true)
  }

  const openEdit = (r: Routine & { id: string }) => {
    setEditingId(r.id)
    setRoutineName(r.name)
    setSelected(r.exercises.map(e =>
      typeof e === 'string'
        ? { exId: e as unknown as string, sets: 3, reps: 10 }
        : e
    ))
    setSearch('')
    setFilterMuscle('all')
    setShowModal(true)
  }

  const save = async () => {
    if (!routineName.trim()) { alert('Routine name required'); return }
    if (!selected.length) { alert('Select at least one exercise'); return }
    if (editingId) {
      await onUpdateRoutine(editingId, { name: routineName.trim(), exercises: selected })
    } else {
      await onAddRoutine({ name: routineName.trim(), exercises: selected })
    }
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
        routines.map(r => (
          <div className="card" key={r.id}>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>{r.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--tm)', marginLeft: '8px' }}>{r.exercises.length} exercises</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-p" onClick={() => onStartRoutine(r)}>
                  <IconPlayerPlay size={14} style={{ marginRight: 4 }} />Start
                </button>
                <button className="btn" onClick={() => openEdit(r)} title="Edit">
                  <IconPencil size={14} />
                </button>
                <button className="btn btn-d" onClick={() => { if (confirm('Delete?')) onDeleteRoutine(r.id) }}>
                  <IconTrash size={14} />
                </button>
              </div>
            </div>

            {/* 운동 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {r.exercises.map((re, i) => {
                const ex = getEx(typeof re === 'string' ? re as unknown as string : re.exId)
                if (!ex) return null
                const sets = typeof re === 'string' ? 3 : re.sets
                const reps = typeof re === 'string' ? 10 : re.reps
                const isTime = ex.log_type === 'time'
                const isCardio = ex.log_type === 'cardio'
                const setsLabel = isCardio ? '' : `${sets}세트 × ${isTime ? `${reps}초` : `${reps}회`}`
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
                    {setsLabel && (
                      <span className={`badge ${MB[ex.muscle] || 'bx'}`} style={{ flexShrink: 0, fontSize: '11px' }}>
                        {setsLabel}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* 모달 */}
      {showModal && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="mo" style={{ maxWidth: '520px' }}>
            <div className="mt2">{editingId ? 'Edit Routine' : 'New Routine'}</div>

            <span className="fl">Routine name</span>
            <input
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              placeholder="e.g. Push Day"
              style={{ marginBottom: '14px' }}
            />

            {/* 운동 검색 */}
            <div className="stitle" style={{ marginBottom: '8px' }}>운동 추가</div>
            <div className="sw" style={{ marginBottom: '6px' }}>
              <IconSearch size={16} className="si" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search... (단어 순서 무관)"
                style={{ paddingLeft: '36px' }}
              />
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
                  <div
                    key={x.id}
                    className={`exrow${checked ? ' sel' : ''}`}
                    onClick={() => toggleExercise(x.id)}
                  >
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
                    <div style={{ color: checked ? '#185FA5' : 'var(--bds)', fontSize: '18px', fontWeight: 300 }}>
                      {checked ? '✓' : '+'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 선택된 운동 + 세트/횟수 */}
            {selected.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div className="stitle" style={{ marginBottom: '8px' }}>선택된 운동 ({selected.length})</div>
                <div style={{ border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                  {/* 헤더 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 60px 60px 28px', gap: '6px', padding: '6px 10px', background: 'var(--s1)', fontSize: '11px', color: 'var(--tm)' }}>
                    <span></span>
                    <span>운동</span>
                    <span style={{ textAlign: 'center' }}>세트</span>
                    <span style={{ textAlign: 'center' }}>횟수/초</span>
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
                          display: 'grid', gridTemplateColumns: '20px 1fr 60px 60px 28px', gap: '6px',
                          padding: '7px 10px', borderTop: '0.5px solid var(--bd)', alignItems: 'center',
                          background: isDragOver ? 'var(--s1)' : undefined,
                          borderLeft: isDragOver ? '2px solid #378ADD' : '2px solid transparent',
                          transition: 'background 0.1s',
                          cursor: 'grab',
                        }}
                      >
                        <IconGripVertical size={14} style={{ color: 'var(--tm)', cursor: 'grab' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{ex.ko || ex.name}</div>
                          {ex.ko && <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{ex.name}</div>}
                        </div>
                        {isCardio ? (
                          <div style={{ gridColumn: '3 / 5', fontSize: '11px', color: 'var(--tm)', textAlign: 'center' }}>cardio</div>
                        ) : (
                          <>
                            <input
                              type="number"
                              min="1"
                              value={s.sets}
                              onChange={e => updateSetsReps(s.exId, 'sets', e.target.value)}
                              style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }}
                            />
                            <input
                              type="number"
                              min="1"
                              value={s.reps}
                              onChange={e => updateSetsReps(s.exId, 'reps', e.target.value)}
                              style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }}
                              placeholder={isTime ? '초' : '회'}
                            />
                          </>
                        )}
                        <button className="idb" onClick={() => removeFromSelected(s.exId)}>
                          <IconX size={14} />
                        </button>
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
