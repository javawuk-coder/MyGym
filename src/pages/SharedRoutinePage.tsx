import { useEffect, useState } from 'react'
import { IconBarbell } from '@tabler/icons-react'
import { useSharedRoutines, type SharedRoutine } from '../hooks/useSharedRoutines'
import { tr, exName, type Lang } from '../lib/i18n'
import type { Exercise, Routine } from '../types'

interface Props {
  shareId: string
  lang: Lang
  allExercises: Exercise[]
  onAddRoutine: (r: Omit<Routine, 'id'>) => Promise<void>
  onDone: () => void
}

export default function SharedRoutinePage({ shareId, lang, allExercises, onAddRoutine, onDone }: Props) {
  const { getSharedRoutine } = useSharedRoutines()
  const [routine, setRoutine] = useState<SharedRoutine | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    getSharedRoutine(shareId)
      .then(setRoutine)
      .finally(() => setLoading(false))
  }, [shareId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!routine) return
    setAdding(true)
    await onAddRoutine({ name: routine.name, exercises: routine.exercises, format: routine.format })
    setAdded(true)
    setAdding(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tm)', fontSize: '14px' }}>
        ...
      </div>
    )
  }

  if (!routine) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ fontSize: '32px' }}>🔍</div>
        <div style={{ fontSize: '15px', color: 'var(--tm)' }}>{tr(lang, 'sharedRoutineNotFound')}</div>
        <button className="btn" onClick={onDone}>{tr(lang, 'cancel')}</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconBarbell size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '2px' }}>{tr(lang, 'sharedRoutineTitle')}</div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{routine.name}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        {routine.exercises.map((re, i) => {
          const ex = allExercises.find(e => e.id === re.exId)
          const nm = ex ? exName(ex, lang) : { main: re.exId }
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < routine.exercises.length - 1 ? '0.5px solid var(--bd)' : 'none' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{nm.main}</div>
                {nm.sub && <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{nm.sub}</div>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tm)', flexShrink: 0, marginLeft: '12px' }}>
                {re.sets}세트 × {re.reps}회
              </div>
            </div>
          )
        })}
      </div>

      {added ? (
        <div style={{ textAlign: 'center', padding: '16px', color: '#1D9E75', fontWeight: 600, fontSize: '16px' }}>
          ✓ {tr(lang, 'sharedRoutineAdded')}
        </div>
      ) : (
        <button className="btn btn-p" onClick={handleAdd} disabled={adding} style={{ width: '100%', fontSize: '16px', padding: '14px' }}>
          {adding ? '...' : tr(lang, 'addSharedRoutine')}
        </button>
      )}
      <button className="btn" onClick={onDone} style={{ width: '100%', marginTop: '10px', fontSize: '14px' }}>
        {tr(lang, 'cancel')}
      </button>
    </div>
  )
}
