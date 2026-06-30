import { useState } from 'react'
import { IconPlus, IconSearch, IconInfoCircle, IconBrandYoutube } from '@tabler/icons-react'
import type { Exercise } from '../types'
import { tr, exName, type Lang } from '../lib/i18n'
import MUSCLE_MAP from '../data/muscle_map.json'

const RC: Record<string, string> = { primary: '#E24B4A', secondary: '#EF9F27', stabilizer: '#378ADD' }
const RL: Record<string, string> = { primary: 'Primary', secondary: 'Secondary', stabilizer: 'Stabilizer' }
type MuscleMap = Record<string, { primary?: string[]; secondary?: string[]; stabilizer?: string[] }>

const ML: Record<string, string> = {
  chest:'Chest', back:'Back', legs:'Legs', shoulder:'Shoulder',
  arm:'Arms', core:'Core', glute:'Glute', hiit:'HIIT', cardio:'Cardio',
}
const MB: Record<string, string> = {
  chest:'bc', back:'bb', legs:'bl', shoulder:'bs', arm:'ba',
  core:'bco', glute:'bg', hiit:'bhiit', cardio:'bcard', custom:'bx',
}
const EQ_LABELS: Record<string, string> = {
  barbell: 'Barbell', dumbbell: 'Dumbbell', cable: 'Cable',
  machine: 'Machine', bodyweight: 'Bodyweight', smith: 'Smith Machine',
  band: 'Band',
}
const EQ_CLASS: Record<string, string> = {
  barbell: 'esm', dumbbell: 'edb', cable: 'ecb',
  machine: 'emc', bodyweight: 'ebw', smith: 'esmt', band: 'ebg2',
}

function ExerciseNameCell({ x, lang }: { x: Exercise; lang: Lang }) {
  const nm = exName(x, lang)
  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 500 }}>
        {nm.main}
        {x.custom && <span className="ctag" style={{ marginLeft: '6px' }}>{tr(lang, 'custom')}</span>}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '2px' }}>
        {nm.sub || '—'}
        {x.equipment && <span className={`badge ${EQ_CLASS[x.equipment] || 'bx'}`} style={{ marginLeft: '6px' }}>{EQ_LABELS[x.equipment] || x.equipment}</span>}
      </div>
    </div>
  )
}

interface Props {
  allExercises: Exercise[]
  onAddCustom: (ex: Omit<Exercise, 'id' | 'custom'>) => Promise<void>
  onDeleteCustom: (id: string) => Promise<void>
  lang: Lang
}

export default function ExercisesPage({ allExercises, onAddCustom, onDeleteCustom, lang }: Props) {
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('')
  const [filterEquip, setFilterEquip] = useState('')
  const [openMuscleId, setOpenMuscleId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newKo, setNewKo] = useState('')
  const [newMuscle, setNewMuscle] = useState('')
  const [newEquip, setNewEquip] = useState('')
  const [newLogType, setNewLogType] = useState<'weight_reps' | 'reps_only' | 'time' | 'cardio'>('weight_reps')

  const muscles = Object.keys(ML)
  const equipments = [...new Set(allExercises.map(x => x.equipment).filter(Boolean))]

  const filtered = allExercises.filter(x => {
    const mOk = !filterMuscle || x.muscle === filterMuscle
    const eOk = !filterEquip || x.equipment === filterEquip
    const qOk = (() => {
      if (!search) return true
      const tokens = search.toLowerCase().split(/\s+/).filter(Boolean)
      const target = `${x.name} ${x.ko || ''}`.toLowerCase()
      return tokens.every(t => target.includes(t))
    })()
    return mOk && eOk && qOk
  })

  // Group by muscle
  const grouped: Record<string, Exercise[]> = {}
  filtered.forEach(x => {
    const m = x.muscle || 'custom'
    if (!grouped[m]) grouped[m] = []
    grouped[m].push(x)
  })

  const saveCustom = async () => {
    if (!newName.trim()) { alert(tr(lang, 'nameRequired')); return }
    if (!newMuscle) { alert(tr(lang, 'muscleRequired')); return }
    await onAddCustom({
      name: newName.trim(),
      ko: newKo.trim() || undefined,
      muscle: newMuscle,
      equipment: newEquip,
      log_type: newLogType,
      type: 'custom',
    })
    setShowModal(false)
    setNewName(''); setNewKo(''); setNewMuscle(''); setNewEquip(''); setNewLogType('weight_reps')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <span className="stitle">Exercise Library</span>
          <span style={{ fontSize: '12px', color: 'var(--tm)', marginLeft: '6px' }}>{filtered.length} exercises</span>
        </div>
        <button className="btn btn-p" onClick={() => setShowModal(true)}>
          <IconPlus size={14} style={{ marginRight: 4 }} />Custom
        </button>
      </div>

      <div className="sw" style={{ marginBottom: '8px' }}>
        <IconSearch size={16} className="si" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr(lang, 'searchEx')} style={{ paddingLeft: '36px' }} />
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <button className={`mfb${!filterMuscle ? ' on' : ''}`} onClick={() => setFilterMuscle('')}>All</button>
        {muscles.map(m => (
          <button key={m} className={`mfb${filterMuscle === m ? ' on' : ''}`} onClick={() => setFilterMuscle(filterMuscle === m ? '' : m)}>
            {ML[m]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {equipments.map(e => (
          <button key={e} className={`mfb${filterEquip === e ? ' on' : ''}`} onClick={() => setFilterEquip(filterEquip === e ? '' : e)}>
            {EQ_LABELS[e] || e}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="emp">{tr(lang, 'noResults')}</div>
      ) : (
        Object.entries(grouped).map(([m, xs]) => (
          <div key={m} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="stitle">{ML[m] || m}</span>
              <span style={{ fontSize: '12px', color: 'var(--tm)' }}>{xs.length}</span>
            </div>
            <div style={{ background: 'var(--s2)', border: '0.5px solid var(--bd)', borderRadius: '12px', padding: '0 8px' }}>
              {xs.map(x => {
                const muscleData = (MUSCLE_MAP as MuscleMap)[x.id]
                const isOpen = openMuscleId === x.id
                return (
                  <div key={x.id}>
                    <div className="exrow" style={{ cursor: 'default' }}>
                      <ExerciseNameCell x={x} lang={lang} />
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`badge ${MB[x.muscle] || 'bx'}`}>{ML[x.muscle] || x.muscle}</span>
                        <button
                          className="idb"
                          onClick={() => setOpenMuscleId(isOpen ? null : x.id)}
                          title="Muscles worked"
                          style={{ color: isOpen ? '#185FA5' : undefined }}
                        >
                          <IconInfoCircle size={16} />
                        </button>
                        {x.custom && (
                          <button className="idb" onClick={() => { if (confirm(tr(lang, 'confirmDelete'))) onDeleteCustom(x.id) }}>
                            <IconPlus size={14} style={{ transform: 'rotate(45deg)' }} />
                          </button>
                        )}
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{
                        background: 'var(--s1)', border: '0.5px solid var(--bd)',
                        borderRadius: 'var(--r)', padding: '10px 12px', margin: '0 0 6px',
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ts)', marginBottom: '6px' }}>{tr(lang, 'musclesWorked')}</div>
                        {!muscleData ? (
                          <div style={{ fontSize: '12px', color: 'var(--tm)' }}>{tr(lang, 'dataLoading')}</div>
                        ) : (
                          (['primary', 'secondary', 'stabilizer'] as const).map(role => {
                            const list = muscleData[role]
                            if (!list?.length) return null
                            return (
                              <div key={role} style={{ marginBottom: '5px' }}>
                                <span style={{
                                  display: 'inline-block', fontSize: '10px', padding: '1px 8px',
                                  borderRadius: '20px', fontWeight: 500, marginBottom: '2px',
                                  background: `${RC[role]}22`, color: RC[role], border: `0.5px solid ${RC[role]}44`,
                                }}>{RL[role]}</span>
                                <div style={{ fontSize: '12px', color: 'var(--tp)', lineHeight: 1.7 }}>
                                  {list.join(' · ')}
                                </div>
                              </div>
                            )
                          })
                        )}
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(x.name + ' proper form tutorial')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            marginTop: '8px', fontSize: '12px', color: '#FF0000',
                            textDecoration: 'none', padding: '4px 10px',
                            border: '0.5px solid #FF000044', borderRadius: '20px',
                            background: '#FF000011',
                          }}
                        >
                          <IconBrandYoutube size={14} />
                          {tr(lang, 'ytLink')}
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="mo">
            <div className="mt2">{tr(lang, 'customExTitle')}</div>
            <span className="fl">{tr(lang, 'nameEn')}</span>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Cable Pulldown" />
            <span className="fl">{tr(lang, 'nameKo')}</span>
            <input value={newKo} onChange={e => setNewKo(e.target.value)} placeholder="e.g. 케이블 풀다운" />
            <span className="fl">{tr(lang, 'muscleGroup')}</span>
            <div id="cxm" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
              {muscles.map(m => (
                <button key={m} className={`mpb${newMuscle === m ? ' on' : ''}`} onClick={() => setNewMuscle(m)}>
                  {ML[m]}
                </button>
              ))}
            </div>
            <span className="fl">{tr(lang, 'equipment')}</span>
            <select value={newEquip} onChange={e => setNewEquip(e.target.value)}>
              <option value="">— Select —</option>
              {Object.entries(EQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <span className="fl">{tr(lang, 'logType')}</span>
            <select value={newLogType} onChange={e => setNewLogType(e.target.value as typeof newLogType)}>
              <option value="weight_reps">Weight + Reps</option>
              <option value="reps_only">Reps only</option>
              <option value="time">Time (seconds)</option>
              <option value="cardio">Cardio</option>
            </select>
            <div style={{ display: 'flex', gap: '8px', marginTop: '1.2rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)}>{tr(lang, 'cancel')}</button>
              <button className="btn btn-p" onClick={saveCustom}>{tr(lang, 'save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
