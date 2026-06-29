import { useState } from 'react'
import { IconPlus, IconTrash, IconSearch, IconCheck } from '@tabler/icons-react'
import type { Exercise, DayLog, LogEntry, LogType, Routine, ExerciseSet } from '../types'

const ML: Record<string, string> = {
  chest:'Chest', back:'Back', legs:'Legs', shoulder:'Shoulder',
  arm:'Arms', core:'Core', glute:'Glute', hiit:'HIIT', cardio:'Cardio',
}
const MB: Record<string, string> = {
  chest:'bc', back:'bb', legs:'bl', shoulder:'bs', arm:'ba',
  core:'bco', glute:'bg', hiit:'bhiit', cardio:'bcard', custom:'bx',
}

function toKg(v: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(v / 2.205 * 10) / 10 : parseFloat(String(v)) || 0 }
function fromKg(kg: number, unit: 'kg' | 'lb') { return unit === 'lb' ? Math.round(kg * 2.205 * 10) / 10 : kg }
function formatDate(d: string) { return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }) }
function today() { return new Date().toISOString().slice(0, 10) }

interface SetRow { weight: string; reps: string; duration: string }

interface Props {
  logs: DayLog[]
  allExercises: Exercise[]
  unit: 'kg' | 'lb'
  onAddEntry: (date: string, entry: LogEntry) => Promise<void>
  onDeleteEntry: (date: string, index: number) => Promise<void>
  initialRoutine?: Routine | null
}

export default function LogPage({ logs, allExercises, unit, onAddEntry, onDeleteEntry, initialRoutine }: Props) {
  const firstExId = (() => {
    const first = initialRoutine?.exercises[0] as unknown
    if (!first) return allExercises[0]?.id ?? ''
    if (typeof first === 'string') return first
    return (first as { exId: string }).exId
  })()
  const [showModal, setShowModal] = useState(!!initialRoutine)
  const [selId, setSelId] = useState<string>(firstExId)
  const [exSearch, setExSearch] = useState('')
  const [sets, setSets] = useState<SetRow[]>([
    { weight: '', reps: '', duration: '' },
    { weight: '', reps: '', duration: '' },
    { weight: '', reps: '', duration: '' },
  ])
  const [cardio, setCardio] = useState({ dist: '', time: '', cal: '' })

  const todayStr = today()
  const todayLog = logs.find(l => l.date === todayStr)
  const history = logs.filter(l => l.date !== todayStr && l.exercises.length).slice(0, 5)

  const getEx = (id: string) => allExercises.find(e => e.id === id)
  const selEx = getEx(selId)
  const logType: LogType = selEx?.log_type || 'weight_reps'

  const sortedEx = [...allExercises].sort((a, b) => (a.ko || a.name).localeCompare(b.ko || b.name, 'ko'))
  const filteredEx = sortedEx.filter(x => {
    if (!exSearch) return true
    const tokens = exSearch.toLowerCase().split(/\s+/).filter(Boolean)
    const target = `${x.name} ${x.ko || ''}`.toLowerCase()
    return tokens.every(t => target.includes(t))
  })

  const openModal = (routine?: Routine | null) => {
    const firstId = routine?.exercises[0] || sortedEx[0]?.id || ''
    setSelId(firstId)
    setExSearch('')
    setSets([
      { weight: '', reps: '', duration: '' },
      { weight: '', reps: '', duration: '' },
      { weight: '', reps: '', duration: '' },
    ])
    setCardio({ dist: '', time: '', cal: '' })
    setShowModal(true)
  }

  const selectEx = (id: string) => {
    setSelId(id)
    setSets([
      { weight: '', reps: '', duration: '' },
      { weight: '', reps: '', duration: '' },
      { weight: '', reps: '', duration: '' },
    ])
  }

  const updateSet = (i: number, field: keyof SetRow, val: string) => {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  const addSet = () => setSets(prev => [...prev, { weight: '', reps: '', duration: '' }])
  const removeSet = (i: number) => setSets(prev => prev.filter((_, idx) => idx !== i))

  const saveLog = async () => {
    if (!selId) { alert('운동을 선택하세요'); return }
    const lt = logType

    if (lt === 'cardio') {
      const dist = parseFloat(cardio.dist) || 0
      const time = parseInt(cardio.time) || 0
      const cal = parseInt(cardio.cal) || 0
      if (!dist && !time) { alert('거리 또는 시간을 입력하세요'); return }
      await onAddEntry(todayStr, { exId: selId, log_type: 'cardio', dist, time, cal })
      setShowModal(false)
      return
    }

    const validSets: ExerciseSet[] = []
    for (const s of sets) {
      if (lt === 'weight_reps') {
        const w = parseFloat(s.weight), r = parseInt(s.reps)
        if (!isNaN(w) && !isNaN(r) && r > 0) validSets.push({ weight: toKg(w, unit), reps: r })
      } else if (lt === 'reps_only') {
        const r = parseInt(s.reps)
        if (!isNaN(r) && r > 0) validSets.push({ reps: r })
      } else {
        const d = parseInt(s.duration)
        if (!isNaN(d) && d > 0) validSets.push({ duration: d })
      }
    }
    if (!validSets.length) { alert('최소 1세트를 입력하세요'); return }
    await onAddEntry(todayStr, { exId: selId, log_type: lt, sets: validSets })
    setShowModal(false)
  }

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
    const hdrLabel = lt === 'weight_reps' ? <><span>Weight</span><span>Reps</span></> : <span>{lt === 'time' ? '시간' : 'Reps'}</span>
    const rows = (entry.sets || []).map((s, si) => {
      const val = lt === 'weight_reps'
        ? <><span style={{ textAlign: 'center', fontWeight: 500 }}>{fromKg(s.weight || 0, unit)} {unit}</span><span style={{ textAlign: 'center' }}>{s.reps} reps</span></>
        : lt === 'time'
        ? <span style={{ fontWeight: 500 }}>{s.duration}초</span>
        : <span style={{ fontWeight: 500 }}>{s.reps} reps</span>
      return (
        <div key={si} style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px', padding: '4px 0', borderBottom: '0.5px solid var(--bd)', fontSize: '13px' }}>
          <span style={{ textAlign: 'center', color: 'var(--tm)' }}>{si + 1}</span>
          {val}
        </div>
      )
    })
    const vol = lt === 'weight_reps'
      ? Math.round((entry.sets || []).reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0))
      : null
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px', fontSize: '11px', color: 'var(--tm)', padding: '3px 0' }}>
          <span>#</span>{hdrLabel}
        </div>
        {rows}
        {vol !== null && <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--tm)', textAlign: 'right' }}>Volume: {vol} kg</div>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="stitle">
          Today<span className="tp2">{formatDate(todayStr)}</span>
        </div>
        <button className="btn btn-p" onClick={() => openModal()}>
          <IconPlus size={14} style={{ marginRight: 4 }} />Add
        </button>
      </div>

      {!todayLog || !todayLog.exercises.length ? (
        <div className="emp">오늘 기록이 없어요</div>
      ) : (
        todayLog.exercises.map((entry, ei) => {
          const x = getEx(entry.exId)
          return (
            <div className="card" key={ei}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{x?.name || entry.exId}</span>
                  {x?.ko && <span style={{ fontSize: '12px', color: 'var(--tm)', marginLeft: '8px' }}>{x.ko}</span>}
                  {x && <span className={`badge ${MB[x.muscle] || 'bx'}`} style={{ marginLeft: '6px' }}>{ML[x.muscle] || x.muscle}</span>}
                </div>
                <button className="idb" onClick={() => onDeleteEntry(todayStr, ei)}>
                  <IconTrash size={16} />
                </button>
              </div>
              {renderEntryBody(entry)}
            </div>
          )
        })
      )}

      <div style={{ marginTop: '2rem' }}>
        <div className="stitle" style={{ marginBottom: '10px' }}>History</div>
        {!history.length ? (
          <div style={{ fontSize: '13px', color: 'var(--tm)', textAlign: 'center', padding: '1.5rem' }}>기록 없음</div>
        ) : (
          history.map(l => (
            <div className="le" key={l.date}>
              <div style={{ fontSize: '12px', color: 'var(--tm)', marginBottom: '5px' }}>{formatDate(l.date)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {l.exercises.map((e, i) => {
                  const x = getEx(e.exId)
                  return <span key={i} className={`badge ${x ? (MB[x.muscle] || 'bx') : 'bx'}`}>{x?.name || e.exId}</span>
                })}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tm)', marginTop: '5px' }}>{l.exercises.length} exercises</div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="mo">
            <div className="mt2">운동 추가</div>
            <span className="fl">운동 검색</span>
            <div className="sw" style={{ marginBottom: '6px' }}>
              <IconSearch size={16} className="si" />
              <input
                value={exSearch}
                onChange={e => setExSearch(e.target.value)}
                placeholder="이름 또는 한국어 검색..."
                style={{ paddingLeft: '36px' }}
                autoComplete="off"
              />
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', marginBottom: '8px' }}>
              {!filteredEx.length ? (
                <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--tm)' }}>결과 없음</div>
              ) : filteredEx.map(x => {
                const isSel = selId === x.id
                return (
                  <div
                    key={x.id}
                    onClick={() => selectEx(x.id)}
                    style={{
                      padding: '9px 10px', cursor: 'pointer',
                      borderBottom: '0.5px solid var(--bd)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: isSel ? 'var(--s1)' : undefined,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{x.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{x.ko || '—'} · <span className={`badge ${MB[x.muscle] || 'bx'}`}>{ML[x.muscle] || x.muscle}</span></div>
                    </div>
                    <IconCheck size={16} style={{ color: isSel ? '#185FA5' : 'transparent' }} />
                  </div>
                )
              })}
            </div>

            {selEx && (
              <div style={{ fontSize: '13px', minHeight: '20px', marginBottom: '10px', padding: '2px 0' }}>
                <span style={{ fontWeight: 500 }}>{selEx.name}</span>{' '}
                <span style={{ color: 'var(--tm)', fontSize: '12px' }}>{selEx.ko || ''}</span>
              </div>
            )}

            {logType === 'cardio' ? (
              <div>
                <div className="stitle" style={{ marginBottom: '10px' }}>기록</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px', textAlign: 'center' }}>거리 (km)</div>
                    <input type="number" value={cardio.dist} onChange={e => setCardio(p => ({ ...p, dist: e.target.value }))} placeholder="0.0" min="0" step="0.1" style={{ textAlign: 'center' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px', textAlign: 'center' }}>시간 (분)</div>
                    <input type="number" value={cardio.time} onChange={e => setCardio(p => ({ ...p, time: e.target.value }))} placeholder="0" min="0" style={{ textAlign: 'center' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px', textAlign: 'center' }}>칼로리</div>
                    <input type="number" value={cardio.cal} onChange={e => setCardio(p => ({ ...p, cal: e.target.value }))} placeholder="0" min="0" style={{ textAlign: 'center' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div className="stitle">Sets</div>
                  <button className="btn" onClick={addSet}><IconPlus size={13} style={{ marginRight: 3 }} />Set</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: logType === 'weight_reps' ? '28px 1fr 1fr 24px' : '28px 1fr 24px', gap: '6px', padding: '3px 0', fontSize: '11px', color: 'var(--tm)' }}>
                  <span style={{ textAlign: 'center' }}>#</span>
                  {logType === 'weight_reps' ? <><span style={{ textAlign: 'center' }}>Weight ({unit})</span><span style={{ textAlign: 'center' }}>Reps</span></> : <span style={{ textAlign: 'center' }}>{logType === 'time' ? '시간 (초)' : 'Reps'}</span>}
                  <span></span>
                </div>
                {sets.map((s, i) => (
                  <div key={i} className="sr" style={{ gridTemplateColumns: logType === 'weight_reps' ? '28px 1fr 1fr 24px' : '28px 1fr 24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--tm)', textAlign: 'center' }}>{i + 1}</span>
                    {logType === 'weight_reps' ? (
                      <>
                        <input type="number" value={s.weight} onChange={e => updateSet(i, 'weight', e.target.value)} placeholder="0" min="0" step="0.5" style={{ textAlign: 'center' }} />
                        <input type="number" value={s.reps} onChange={e => updateSet(i, 'reps', e.target.value)} placeholder="0" min="0" style={{ textAlign: 'center' }} />
                      </>
                    ) : (
                      <input
                        type="number"
                        value={logType === 'time' ? s.duration : s.reps}
                        onChange={e => updateSet(i, logType === 'time' ? 'duration' : 'reps', e.target.value)}
                        placeholder="0" min="0"
                        style={{ textAlign: 'center' }}
                      />
                    )}
                    <button className="idb" onClick={() => removeSet(i)}>&times;</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-p" onClick={saveLog}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
