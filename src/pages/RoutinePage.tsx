import { useState } from 'react'
import { IconLayoutList, IconPlus, IconPlayerPlay, IconTrash, IconSearch, IconCircle, IconCircleCheck } from '@tabler/icons-react'
import type { Exercise, Routine } from '../types'

const ML: Record<string, string> = {
  chest:'Chest', back:'Back', legs:'Legs', shoulder:'Shoulder',
  arm:'Arms', core:'Core', glute:'Glute', hiit:'HIIT', cardio:'Cardio',
}
const MB: Record<string, string> = {
  chest:'bc', back:'bb', legs:'bl', shoulder:'bs', arm:'ba',
  core:'bco', glute:'bg', hiit:'bhiit', cardio:'bcard', custom:'bx',
}

interface Props {
  routines: (Routine & { id: string })[]
  allExercises: Exercise[]
  onAddRoutine: (r: Omit<Routine, 'id'>) => Promise<void>
  onDeleteRoutine: (id: string) => Promise<void>
  onStartRoutine: (r: Routine & { id: string }) => void
}

function MBadge({ muscle }: { muscle: string }) {
  return <span className={`badge ${MB[muscle] || 'bx'}`}>{ML[muscle] || muscle}</span>
}

export default function RoutinePage({ routines, allExercises, onAddRoutine, onDeleteRoutine, onStartRoutine }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [routineName, setRoutineName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('all')

  const sortedEx = [...allExercises].sort((a, b) => (a.ko || a.name).localeCompare(b.ko || b.name, 'ko'))
  const filtered = sortedEx.filter(x => {
    const mOk = filterMuscle === 'all' || x.muscle === filterMuscle
    const qOk = !search || x.name.toLowerCase().includes(search.toLowerCase()) || (x.ko && x.ko.includes(search))
    return mOk && qOk
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const openModal = () => {
    setShowModal(true)
    setRoutineName('')
    setSelected([])
    setSearch('')
    setFilterMuscle('all')
  }

  const saveRoutine = async () => {
    if (!routineName.trim()) { alert('Routine name required'); return }
    if (!selected.length) { alert('Select at least one exercise'); return }
    await onAddRoutine({ name: routineName.trim(), exercises: selected })
    setShowModal(false)
  }

  const getEx = (id: string) => allExercises.find(e => e.id === id)

  const muscles = ['all', ...Object.keys(ML)]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="stitle">My Routines</div>
        <button className="btn btn-p" onClick={openModal}><IconPlus size={14} style={{ marginRight: 4 }} />New Routine</button>
      </div>

      {!routines.length ? (
        <div className="emp">
          <IconLayoutList size={36} style={{ display: 'block', margin: '0 auto 12px' }} />
          루틴을 추가해보세요
        </div>
      ) : (
        routines.map(r => (
          <div className="card" key={r.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '16px' }}>{r.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--tm)', marginLeft: '8px' }}>{r.exercises.length} exercises</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-p" onClick={() => onStartRoutine(r)}>
                  <IconPlayerPlay size={14} style={{ marginRight: 4 }} />Start
                </button>
                <button className="btn btn-d" onClick={() => { if (confirm('Delete?')) onDeleteRoutine(r.id) }}>
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {r.exercises.map(id => {
                const x = getEx(id)
                if (!x) return null
                return <span key={id} className={`badge ${MB[x.muscle] || 'bx'}`}>{x.name}</span>
              })}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="mo">
            <div className="mt2">New Routine</div>
            <span className="fl">Routine name</span>
            <input
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              placeholder="e.g. Push Day"
              style={{ marginBottom: '12px' }}
            />
            <div className="sw" style={{ marginBottom: '8px' }}>
              <IconSearch size={16} className="si" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exercises..."
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {muscles.map(m => (
                <button
                  key={m}
                  className={`mfb${filterMuscle === m ? ' on' : ''}`}
                  onClick={() => setFilterMuscle(m)}
                >
                  {m === 'all' ? 'All' : (ML[m] || m)}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: '260px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '0 4px' }}>
              {!filtered.length ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--tm)', fontSize: '13px' }}>No results</div>
              ) : filtered.map(x => {
                const checked = selected.includes(x.id)
                return (
                  <div
                    key={x.id}
                    className={`exrow${checked ? ' sel' : ''}`}
                    onClick={() => toggleSelect(x.id)}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {x.name}
                        {x.custom && <span className="ctag" style={{ marginLeft: '4px' }}>custom</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--tm)' }}>
                        {x.ko || '—'} · <MBadge muscle={x.muscle} />
                      </div>
                    </div>
                    {checked
                      ? <IconCircleCheck size={18} style={{ color: '#185FA5' }} />
                      : <IconCircle size={18} style={{ color: 'var(--bds)' }} />
                    }
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--ts)' }}>{selected.length} selected</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '1.2rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-p" onClick={saveRoutine}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
