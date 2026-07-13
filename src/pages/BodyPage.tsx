import { useState } from 'react'
import { IconPlus, IconTrash, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { BodyEntry } from '../types'
import { tr, type Lang } from '../lib/i18n'

interface Props {
  bodyLogs: BodyEntry[]
  lang: Lang
  onSave: (entry: BodyEntry) => Promise<void>
  onDelete: (date: string) => Promise<void>
}

type Field = 'weight' | 'skeletalMuscle' | 'bodyFatMass' | 'bodyFatPct' | 'visceralFat' | 'waist' | 'trunkFat'

const FIELDS: { key: Field; labelKey: string; unit: string; required?: boolean; color: string }[] = [
  { key: 'weight',         labelKey: 'bodyWeight',         unit: 'kg',    required: true, color: '#185FA5' },
  { key: 'skeletalMuscle', labelKey: 'bodySkeletalMuscle', unit: 'kg',    color: '#1D9E75' },
  { key: 'bodyFatMass',    labelKey: 'bodyFatMass',        unit: 'kg',    color: '#E24B4A' },
  { key: 'bodyFatPct',     labelKey: 'bodyFatPct',         unit: '%',     color: '#E8892B' },
  { key: 'visceralFat',    labelKey: 'bodyVisceralFat',    unit: 'level', color: '#9B59B6' },
  { key: 'waist',          labelKey: 'bodyWaist',          unit: 'cm',    color: '#E67E22' },
  { key: 'trunkFat',       labelKey: 'bodyTrunkFat',       unit: '%',     color: '#BA7517' },
]

function today() { return new Date().toISOString().slice(0, 10) }

function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

export default function BodyPage({ bodyLogs, lang, onSave, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [date, setDate] = useState(today())
  const [values, setValues] = useState<Record<Field, string>>({
    weight: '', skeletalMuscle: '', bodyFatMass: '', bodyFatPct: '',
    visceralFat: '', waist: '', trunkFat: '',
  })
  const [activeLines, setActiveLines] = useState<Set<Field>>(new Set(['weight', 'skeletalMuscle', 'bodyFatPct']))

  const latest = bodyLogs.at(-1)

  const openForm = () => {
    const existing = bodyLogs.find(l => l.date === today())
    if (existing) {
      setDate(existing.date)
      setValues({
        weight: existing.weight != null ? String(existing.weight) : '',
        skeletalMuscle: existing.skeletalMuscle != null ? String(existing.skeletalMuscle) : '',
        bodyFatMass: existing.bodyFatMass != null ? String(existing.bodyFatMass) : '',
        bodyFatPct: existing.bodyFatPct != null ? String(existing.bodyFatPct) : '',
        visceralFat: existing.visceralFat != null ? String(existing.visceralFat) : '',
        waist: existing.waist != null ? String(existing.waist) : '',
        trunkFat: existing.trunkFat != null ? String(existing.trunkFat) : '',
      })
    } else {
      setDate(today())
      setValues({ weight: '', skeletalMuscle: '', bodyFatMass: '', bodyFatPct: '', visceralFat: '', waist: '', trunkFat: '' })
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    const w = parseFloat(values.weight)
    if (isNaN(w) || w <= 0) return
    const entry: BodyEntry = { date, weight: w }
    if (values.skeletalMuscle) entry.skeletalMuscle = parseFloat(values.skeletalMuscle) || undefined
    if (values.bodyFatMass)    entry.bodyFatMass    = parseFloat(values.bodyFatMass)    || undefined
    if (values.bodyFatPct)     entry.bodyFatPct     = parseFloat(values.bodyFatPct)     || undefined
    if (values.visceralFat)    entry.visceralFat    = parseFloat(values.visceralFat)    || undefined
    if (values.waist)          entry.waist          = parseFloat(values.waist)          || undefined
    if (values.trunkFat)       entry.trunkFat       = parseFloat(values.trunkFat)       || undefined
    await onSave(entry)
    setShowForm(false)
  }

  const toggleLine = (key: Field) => {
    setActiveLines(prev => {
      const next = new Set(prev)
      if (next.has(key)) { if (next.size > 1) next.delete(key) }
      else next.add(key)
      return next
    })
  }

  // 차트 데이터: 각 항목 개별 단위가 달라서 선택된 지표만 표시
  const chartData = bodyLogs.map(l => ({
    date: fmtDate(l.date),
    weight: l.weight,
    skeletalMuscle: l.skeletalMuscle,
    bodyFatMass: l.bodyFatMass,
    bodyFatPct: l.bodyFatPct,
    visceralFat: l.visceralFat,
    waist: l.waist,
    trunkFat: l.trunkFat,
  }))

  // 선택된 지표들의 단위가 모두 같은지 확인 (Y축 라벨용)
  const activeFields = FIELDS.filter(f => activeLines.has(f.key))
  const units = [...new Set(activeFields.map(f => f.unit))]
  const yUnit = units.length === 1 ? units[0] : ''

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>{tr(lang, 'tabBody')}</span>
        <button className="btn btn-p" onClick={openForm}>
          <IconPlus size={14} style={{ marginRight: 4 }} />{tr(lang, 'bodyAddRecord')}
        </button>
      </div>

      {bodyLogs.length === 0 ? (
        <div className="emp">{tr(lang, 'bodyNoData')}</div>
      ) : (
        <>
          {/* 최근 측정값 */}
          {latest && (
            <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--tm)', marginBottom: '10px' }}>
                {tr(lang, 'bodyLatest')} — {latest.date}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {FIELDS.map(f => {
                  const val = latest[f.key]
                  if (val == null) return null
                  return (
                    <div key={f.key}>
                      <div style={{ fontSize: '10px', color: 'var(--tm)', marginBottom: '2px' }}>{tr(lang, f.labelKey as Parameters<typeof tr>[1])}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: f.color }}>
                        {val}<span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--tm)', marginLeft: '2px' }}>{tr(lang, ('body' + f.unit.charAt(0).toUpperCase() + f.unit.slice(1)) as Parameters<typeof tr>[1])}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 차트 */}
          <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{tr(lang, 'bodyTrend')}</div>

            {/* 지표 선택 토글 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {FIELDS.map(f => {
                const hasData = bodyLogs.some(l => l[f.key] != null)
                if (!hasData) return null
                const active = activeLines.has(f.key)
                return (
                  <button key={f.key} onClick={() => toggleLine(f.key)}
                    style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
                      border: `1.5px solid ${f.color}`,
                      background: active ? f.color : 'transparent',
                      color: active ? '#fff' : f.color,
                      fontFamily: 'inherit', fontWeight: 500,
                    }}>
                    {tr(lang, f.labelKey as Parameters<typeof tr>[1])}
                  </button>
                )
              })}
            </div>

            {units.length > 1 && (
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '8px' }}>
                단위가 다른 지표를 함께 선택하면 상대적 변화 추이로 비교됩니다
              </div>
            )}

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--tm)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--tm)' }} unit={yUnit} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '0.5px solid var(--bd)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--tm)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {FIELDS.filter(f => activeLines.has(f.key)).map(f => (
                  <Line
                    key={f.key}
                    type="monotone"
                    dataKey={f.key}
                    name={tr(lang, f.labelKey as Parameters<typeof tr>[1])}
                    stroke={f.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: f.color }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 히스토리 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button onClick={() => setShowHistory(h => !h)}
              style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ts)' }}>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{tr(lang, 'bodyHistory')}</span>
              {showHistory ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </button>
            {showHistory && (
              <div style={{ borderTop: '0.5px solid var(--bd)' }}>
                {[...bodyLogs].reverse().map(entry => (
                  <div key={entry.date} style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{entry.date}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {FIELDS.map(f => {
                          const val = entry[f.key]
                          if (val == null) return null
                          return (
                            <span key={f.key} style={{ fontSize: '11px', color: 'var(--tm)' }}>
                              <span style={{ color: f.color, fontWeight: 600 }}>{val}</span>{f.unit} {tr(lang, f.labelKey as Parameters<typeof tr>[1])}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <button className="idb" onClick={() => {
                      if (confirm(tr(lang, 'bodyDeleteConfirm'))) onDelete(entry.date)
                    }} style={{ marginLeft: '8px', flexShrink: 0 }}>
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 기록 모달 */}
      {showForm && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="mo" style={{ maxWidth: '420px' }}>
            <div className="mt2">{tr(lang, 'bodyAddRecord')}</div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px' }}>Date</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                max={today()} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px' }}>
                    {tr(lang, f.labelKey as Parameters<typeof tr>[1])}
                    <span style={{ color: 'var(--bd)', marginLeft: '3px' }}>({f.unit})</span>
                    {f.required && <span style={{ color: '#E24B4A', marginLeft: '2px' }}>*</span>}
                  </div>
                  <input
                    type="number"
                    value={values[f.key]}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.required ? '필수' : '선택'}
                    min="0" step="0.1"
                    style={{ borderColor: f.required && !values[f.key] ? undefined : undefined }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowForm(false)}>{tr(lang, 'cancel')}</button>
              <button className="btn btn-p" onClick={handleSave}
                disabled={!values.weight || isNaN(parseFloat(values.weight))}>
                {tr(lang, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
