import { useState } from 'react'
import type { DayLog, Exercise } from '../types'
import { tr, exName, muscleLabel, type Lang } from '../lib/i18n'

const MR: Record<string, string> = {
  chest: '#378ADD', back: '#639922', legs: '#BA7517', shoulder: '#534AB7',
  arm: '#D4537E', core: '#1D9E75', glute: '#D85A30', hiit: '#E24B4A', cardio: '#1D9E75',
}

const PERIODS = [
  { key: 'period7', days: 7 },
  { key: 'period30', days: 30 },
  { key: 'period90', days: 90 },
  { key: 'periodAll', days: 0 },
] as const

interface Props {
  logs: DayLog[]
  allExercises: Exercise[]
  unit: 'kg' | 'lb'
  lang: Lang
}

function fromKg(kg: number, unit: 'kg' | 'lb') {
  return unit === 'lb' ? Math.round(kg * 2.205 * 10) / 10 : kg
}

export default function StatsPage({ logs, allExercises, unit, lang }: Props) {
  const [periodDays, setPeriodDays] = useState(30)

  const getEx = (id: string) => allExercises.find(e => e.id === id)

  const cutoff = periodDays > 0
    ? new Date(Date.now() - periodDays * 86400000).toISOString().slice(0, 10)
    : ''

  const filtered = cutoff ? logs.filter(l => l.date >= cutoff) : logs

  const all = filtered.flatMap(l => l.exercises)
  const totalSets = all.filter(e => e.sets).reduce((a, e) => a + (e.sets?.length || 0), 0)
  const totalVol = Math.round(
    all.filter(e => e.log_type === 'weight_reps' || !e.log_type)
      .reduce((a, e) => a + (e.sets || []).reduce((b, s) => b + (s.weight || 0) * (s.reps || 0), 0), 0)
  )
  const workoutDays = filtered.filter(l => l.exercises.length).length

  // Volume by muscle
  const mv: Record<string, number> = {}
  all.forEach(e => {
    const x = getEx(e.exId)
    const v = (e.sets || []).reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0)
    const m = x?.muscle || 'custom'
    mv[m] = (mv[m] || 0) + v
  })
  const maxVol = Math.max(...Object.values(mv), 1)

  // Est. 1RM top 6
  const orm: Record<string, number> = {}
  all.forEach(e => {
    (e.sets || []).forEach(s => {
      if (!s.weight || !s.reps) return
      const r = s.weight * (1 + s.reps / 30)
      if (!orm[e.exId] || r > orm[e.exId]) orm[e.exId] = r
    })
  })
  const top6 = Object.entries(orm).sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div>
      {/* 기간 필터 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {PERIODS.map(p => (
          <button key={p.days} onClick={() => setPeriodDays(p.days)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
            border: `1px solid ${periodDays === p.days ? 'var(--tp)' : 'var(--bd)'}`,
            background: periodDays === p.days ? 'var(--tp)' : 'transparent',
            color: periodDays === p.days ? '#fff' : 'var(--ts)',
            fontWeight: periodDays === p.days ? 600 : 400, fontFamily: 'inherit',
          }}>{tr(lang, p.key)}</button>
        ))}
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
        <div className="sc"><div className="sn">{workoutDays}</div><div className="sl">{tr(lang, 'workoutDays')}</div></div>
        <div className="sc"><div className="sn">{totalSets}</div><div className="sl">{tr(lang, 'totalSets')}</div></div>
        <div className="sc"><div className="sn">{(fromKg(totalVol, unit) / 1000).toFixed(1)}{unit === 'kg' ? 't' : 'k lb'}</div><div className="sl">{tr(lang, 'totalVolume')}</div></div>
      </div>

      {/* Volume by muscle */}
      <div className="card">
        <div className="stitle" style={{ marginBottom: '12px' }}>{tr(lang, 'volumeByMuscle')}</div>
        {!Object.keys(mv).length ? (
          <div style={{ fontSize: '13px', color: 'var(--tm)', textAlign: 'center', padding: '1rem' }}>{tr(lang, 'logToSee')}</div>
        ) : (
          Object.entries(mv).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
            <div key={m} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{muscleLabel(m, lang)}</span>
                <span>{Math.round(fromKg(v, unit)).toLocaleString()} {unit}</span>
              </div>
              <div className="cbg">
                <div className="cb" style={{ width: `${Math.round(v / maxVol * 100)}%`, background: MR[m] || '#888' }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Top lifts 1RM */}
      <div className="card">
        <div className="stitle" style={{ marginBottom: '12px' }}>{tr(lang, 'statsTopLifts')}</div>
        {!top6.length ? (
          <div style={{ fontSize: '13px', color: 'var(--tm)', textAlign: 'center', padding: '.5rem' }}>{tr(lang, 'noData')}</div>
        ) : (
          top6.map(([id, rm]) => {
            const x = getEx(id)
            const nm = x ? exName(x, lang) : { main: id }
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--bd)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{nm.main}</div>
                  <div style={{ fontSize: '12px', color: 'var(--tm)' }}>{nm.sub || '—'}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                  {fromKg(rm, unit).toFixed(1)} {unit} <span style={{ fontSize: '12px', color: 'var(--tm)', fontWeight: 400 }}>1RM</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
