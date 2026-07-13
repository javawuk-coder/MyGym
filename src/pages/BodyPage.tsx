import { useRef, useState } from 'react'
import { IconPlus, IconTrash, IconChevronDown, IconChevronUp, IconUpload, IconDownload, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import type { BodyEntry, CustomBodyField } from '../types'
import { tr, type Lang } from '../lib/i18n'

interface Props {
  bodyLogs: BodyEntry[]
  lang: Lang
  onSave: (entry: BodyEntry) => Promise<void>
  onSaveBatch: (entries: BodyEntry[]) => Promise<void>
  onDelete: (date: string) => Promise<void>
}

type StdField = 'weight' | 'skeletalMuscle' | 'bodyFatMass' | 'bodyFatPct' | 'visceralFat' | 'waist' | 'trunkFat'

const STD_FIELDS: { key: StdField; labelKey: string; unit: string; required?: boolean; color: string }[] = [
  { key: 'weight',         labelKey: 'bodyWeight',         unit: 'kg',    required: true, color: '#185FA5' },
  { key: 'skeletalMuscle', labelKey: 'bodySkeletalMuscle', unit: 'kg',    color: '#1D9E75' },
  { key: 'bodyFatMass',    labelKey: 'bodyFatMass',        unit: 'kg',    color: '#E24B4A' },
  { key: 'bodyFatPct',     labelKey: 'bodyFatPct',         unit: '%',     color: '#E8892B' },
  { key: 'visceralFat',    labelKey: 'bodyVisceralFat',    unit: 'level', color: '#9B59B6' },
  { key: 'waist',          labelKey: 'bodyWaist',          unit: 'cm',    color: '#E67E22' },
  { key: 'trunkFat',       labelKey: 'bodyTrunkFat',       unit: 'kg',    color: '#BA7517' },
]

const CUSTOM_COLORS = ['#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

function today() { return new Date().toISOString().slice(0, 10) }
function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

// 모든 로그에 등장한 커스텀 필드 이름 수집
function collectCustomNames(logs: BodyEntry[]): string[] {
  const seen = new Set<string>()
  for (const l of logs) for (const f of (l.customFields || [])) seen.add(f.name)
  return [...seen]
}

function customColor(name: string, allNames: string[]) {
  return CUSTOM_COLORS[allNames.indexOf(name) % CUSTOM_COLORS.length]
}

// 감소가 좋은 지표 (체중, 체지방 계열)
const LOWER_IS_BETTER = new Set<string>(['weight', 'bodyFatMass', 'bodyFatPct', 'visceralFat', 'waist', 'trunkFat'])

function metricDomain(values: number[]): [number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.15 || max * 0.05
  return [Math.max(0, min - pad), max + pad]
}

interface MiniChartProps {
  data: { date: string; value: number | undefined }[]
  color: string
  unit: string
  label: string
  fieldKey: string
}

function MiniChart({ data, color, unit, label, fieldKey }: MiniChartProps) {
  const pts = data.filter(d => d.value != null) as { date: string; value: number }[]
  if (pts.length < 2) return null

  const first = pts[0].value
  const last = pts[pts.length - 1].value
  const change = last - first
  const pct = Math.abs(change / first * 100)
  const lowerIsBetter = LOWER_IS_BETTER.has(fieldKey)
  const isGood = lowerIsBetter ? change < 0 : change > 0
  const isFlat = Math.abs(change) < 0.05
  const changeColor = isFlat ? 'var(--tm)' : isGood ? '#1D9E75' : '#E24B4A'
  const domain = metricDomain(pts.map(p => p.value))

  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>
            {last}<span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--tm)', marginLeft: '2px' }}>{unit}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end', color: changeColor, fontSize: '12px', fontWeight: 600 }}>
            {isFlat ? <IconMinus size={13} /> : isGood ? <IconTrendingDown size={13} /> : <IconTrendingUp size={13} />}
            {change > 0 ? '+' : ''}{change.toFixed(1)}{unit}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--tm)', marginTop: '1px' }}>
            {pct.toFixed(1)}% ({pts.length}회 측정)
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
          <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
          <YAxis domain={domain} tick={{ fontSize: 9, fill: 'var(--tm)' }} tickCount={3} width={36} />
          <Tooltip
            contentStyle={{ background: 'var(--bg2)', border: '0.5px solid var(--bd)', borderRadius: '8px', fontSize: '11px', padding: '4px 8px' }}
            labelStyle={{ color: 'var(--tm)', fontSize: '10px' }}
            formatter={(v) => [`${v} ${unit}`, label]}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            dot={{ r: 2, fill: color, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── CSV 파싱 ──────────────────────────────────────────────────────────────────
const CSV_HEADERS = ['date', 'weight', 'skeletalMuscle', 'bodyFatMass', 'bodyFatPct', 'visceralFat', 'waist', 'trunkFat']

function downloadTemplate() {
  const header = CSV_HEADERS.join(',')
  const example = '2024-11-02,105.1,43.2,29.1,27.7,13,109.8,15.5'
  const blob = new Blob([header + '\n' + example], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'body_template.csv'; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text: string): { entries: BodyEntry[]; skipped: number } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { entries: [], skipped: 0 }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''))
  const entries: BodyEntry[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/%/g, ''))
    const get = (key: string) => {
      const idx = headers.indexOf(key.toLowerCase())
      return idx >= 0 ? cols[idx] : ''
    }
    const date = get('date')
    const weight = parseFloat(get('weight'))
    if (!date || isNaN(weight) || weight <= 0) { skipped++; continue }

    const entry: BodyEntry = { date, weight }
    const optionals: [string, StdField][] = [
      ['skeletalmuscle', 'skeletalMuscle'], ['bodyfatmass', 'bodyFatMass'],
      ['bodyfatpct', 'bodyFatPct'], ['visceralfat', 'visceralFat'],
      ['waist', 'waist'], ['trunkfat', 'trunkFat'],
    ]
    for (const [col, field] of optionals) {
      const v = parseFloat(get(col))
      if (!isNaN(v) && v > 0) entry[field] = v
    }
    entries.push(entry)
  }
  return { entries, skipped }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BodyPage({ bodyLogs, lang, onSave, onSaveBatch, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [date, setDate] = useState(today())
  const [stdValues, setStdValues] = useState<Record<StdField, string>>({
    weight: '', skeletalMuscle: '', bodyFatMass: '', bodyFatPct: '',
    visceralFat: '', waist: '', trunkFat: '',
  })
  const [customDraft, setCustomDraft] = useState<{ name: string; value: string; unit: string }[]>([])
  // (activeLines 제거 — 지표별 개별 차트로 대체)

  // CSV import state
  const fileRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<{ entries: BodyEntry[]; skipped: number } | null>(null)
  const [importing, setImporting] = useState(false)

  const latest = bodyLogs.at(-1)
  const allCustomNames = collectCustomNames(bodyLogs)

  // ── Form helpers ──────────────────────────────────────────────
  const openForm = () => {
    const existing = bodyLogs.find(l => l.date === today())
    if (existing) {
      setDate(existing.date)
      setStdValues({
        weight:         existing.weight         != null ? String(existing.weight)         : '',
        skeletalMuscle: existing.skeletalMuscle != null ? String(existing.skeletalMuscle) : '',
        bodyFatMass:    existing.bodyFatMass    != null ? String(existing.bodyFatMass)    : '',
        bodyFatPct:     existing.bodyFatPct     != null ? String(existing.bodyFatPct)     : '',
        visceralFat:    existing.visceralFat    != null ? String(existing.visceralFat)    : '',
        waist:          existing.waist          != null ? String(existing.waist)          : '',
        trunkFat:       existing.trunkFat       != null ? String(existing.trunkFat)       : '',
      })
      setCustomDraft((existing.customFields || []).map(f => ({ name: f.name, value: String(f.value), unit: f.unit || '' })))
    } else {
      setDate(today())
      setStdValues({ weight: '', skeletalMuscle: '', bodyFatMass: '', bodyFatPct: '', visceralFat: '', waist: '', trunkFat: '' })
      setCustomDraft([])
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    const w = parseFloat(stdValues.weight)
    if (isNaN(w) || w <= 0) return
    const entry: BodyEntry = { date, weight: w }
    const opt: [StdField, string][] = [
      ['skeletalMuscle', stdValues.skeletalMuscle], ['bodyFatMass', stdValues.bodyFatMass],
      ['bodyFatPct', stdValues.bodyFatPct], ['visceralFat', stdValues.visceralFat],
      ['waist', stdValues.waist], ['trunkFat', stdValues.trunkFat],
    ]
    for (const [k, v] of opt) { const n = parseFloat(v); if (!isNaN(n) && n > 0) entry[k] = n }
    const customs: CustomBodyField[] = customDraft
      .filter(c => c.name.trim() && parseFloat(c.value) > 0)
      .map(c => ({ name: c.name.trim(), value: parseFloat(c.value), ...(c.unit.trim() ? { unit: c.unit.trim() } : {}) }))
    if (customs.length) entry.customFields = customs
    await onSave(entry)
    setShowForm(false)
  }

  const addCustomRow = () => setCustomDraft(p => [...p, { name: '', value: '', unit: '' }])
  const updateCustom = (i: number, field: 'name' | 'value' | 'unit', val: string) =>
    setCustomDraft(p => p.map((r, j) => j === i ? { ...r, [field]: val } : r))
  const removeCustom = (i: number) => setCustomDraft(p => p.filter((_, j) => j !== i))

  // ── Chart data per metric ─────────────────────────────────────
  const miniData = (key: StdField) =>
    bodyLogs.map(l => ({ date: fmtDate(l.date), value: l[key] }))

  const miniCustomData = (name: string) =>
    bodyLogs.map(l => ({ date: fmtDate(l.date), value: l.customFields?.find(f => f.name === name)?.value }))

  // ── CSV import ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setImportPreview(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const confirmImport = async () => {
    if (!importPreview?.entries.length) return
    setImporting(true)
    await onSaveBatch(importPreview.entries)
    setImporting(false)
    setImportPreview(null)
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>{tr(lang, 'tabBody')}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn" onClick={downloadTemplate} style={{ fontSize: '12px' }}>
            <IconDownload size={13} style={{ marginRight: 3 }} />CSV 템플릿
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()} style={{ fontSize: '12px' }}>
            <IconUpload size={13} style={{ marginRight: 3 }} />가져오기
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
          <button className="btn btn-p" onClick={openForm}>
            <IconPlus size={14} style={{ marginRight: 4 }} />{tr(lang, 'bodyAddRecord')}
          </button>
        </div>
      </div>

      {bodyLogs.length === 0 ? (
        <div className="emp">{tr(lang, 'bodyNoData')}</div>
      ) : (
        <>
          {/* 최근 측정일 표시 */}
          {latest && (
            <div style={{ fontSize: '12px', color: 'var(--tm)', marginBottom: '10px' }}>
              {tr(lang, 'bodyLatest')} — {latest.date}
            </div>
          )}

          {/* 지표별 개별 차트 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {STD_FIELDS.map(f => {
              if (!bodyLogs.some(l => l[f.key] != null)) return null
              return (
                <MiniChart
                  key={f.key}
                  fieldKey={f.key}
                  label={tr(lang, f.labelKey as Parameters<typeof tr>[1])}
                  unit={f.unit}
                  color={f.color}
                  data={miniData(f.key)}
                />
              )
            })}
            {allCustomNames.map(name => {
              const unit = bodyLogs.findLast(l => l.customFields?.some(c => c.name === name))
                ?.customFields?.find(c => c.name === name)?.unit || ''
              return (
                <MiniChart
                  key={name}
                  fieldKey={name}
                  label={name}
                  unit={unit}
                  color={customColor(name, allCustomNames)}
                  data={miniCustomData(name)}
                />
              )
            })}
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
                        {STD_FIELDS.map(f => {
                          const val = entry[f.key]; if (val == null) return null
                          return (
                            <span key={f.key} style={{ fontSize: '11px', color: 'var(--tm)' }}>
                              <span style={{ color: f.color, fontWeight: 600 }}>{val}</span>{f.unit} {tr(lang, f.labelKey as Parameters<typeof tr>[1])}
                            </span>
                          )
                        })}
                        {(entry.customFields || []).map(f => (
                          <span key={f.name} style={{ fontSize: '11px', color: 'var(--tm)' }}>
                            <span style={{ color: customColor(f.name, allCustomNames), fontWeight: 600 }}>{f.value}</span>{f.unit} {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="idb" onClick={() => { if (confirm(tr(lang, 'bodyDeleteConfirm'))) onDelete(entry.date) }}
                      style={{ marginLeft: '8px', flexShrink: 0 }}>
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 기록 입력 모달 */}
      {showForm && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="mo" style={{ maxWidth: '460px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="mt2">{tr(lang, 'bodyAddRecord')}</div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px' }}>Date</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today()} style={{ width: '100%' }} />
            </div>

            {/* 기본 필드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {STD_FIELDS.map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px' }}>
                    {tr(lang, f.labelKey as Parameters<typeof tr>[1])}
                    <span style={{ color: 'var(--bd)', marginLeft: '3px' }}>({f.unit})</span>
                    {f.required && <span style={{ color: '#E24B4A', marginLeft: '2px' }}>*</span>}
                  </div>
                  <input type="number" value={stdValues[f.key]}
                    onChange={e => setStdValues(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.required ? '필수' : '선택'} min="0" step="0.1" />
                </div>
              ))}
            </div>

            {/* 커스텀 필드 */}
            {customDraft.length > 0 && (
              <div style={{ borderTop: '0.5px solid var(--bd)', paddingTop: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '8px', fontWeight: 600 }}>커스텀 필드</div>
                {customDraft.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                    <input value={row.name} onChange={e => updateCustom(i, 'name', e.target.value)}
                      placeholder={tr(lang, 'bodyCustomName')} style={{ fontSize: '12px' }} />
                    <input type="number" value={row.value} onChange={e => updateCustom(i, 'value', e.target.value)}
                      placeholder="0" min="0" step="0.01" style={{ fontSize: '12px', textAlign: 'center' }} />
                    <input value={row.unit} onChange={e => updateCustom(i, 'unit', e.target.value)}
                      placeholder={tr(lang, 'bodyCustomUnit')} style={{ fontSize: '12px' }} />
                    <button className="idb" onClick={() => removeCustom(i)}><IconTrash size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            <button className="btn" onClick={addCustomRow}
              style={{ width: '100%', fontSize: '12px', marginBottom: '16px', borderStyle: 'dashed' }}>
              <IconPlus size={12} style={{ marginRight: 4 }} />{tr(lang, 'bodyCustomField')}
            </button>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowForm(false)}>{tr(lang, 'cancel')}</button>
              <button className="btn btn-p" onClick={handleSave}
                disabled={!stdValues.weight || isNaN(parseFloat(stdValues.weight))}>
                {tr(lang, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV 가져오기 미리보기 모달 */}
      {importPreview && (
        <div className="mbg" onClick={e => { if (e.target === e.currentTarget) setImportPreview(null) }}>
          <div className="mo" style={{ maxWidth: '480px' }}>
            <div className="mt2">CSV 가져오기</div>
            <div style={{ fontSize: '13px', marginBottom: '12px' }}>
              <span style={{ color: '#1D9E75', fontWeight: 600 }}>{importPreview.entries.length}건</span> 가져올 수 있습니다.
              {importPreview.skipped > 0 && (
                <span style={{ color: 'var(--tm)', marginLeft: '8px' }}>({importPreview.skipped}건 스킵 — 체중 0 또는 날짜 없음)</span>
              )}
            </div>

            {importPreview.entries.length > 0 && (
              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '0.5px solid var(--bd)', borderRadius: 'var(--r)', marginBottom: '16px' }}>
                {importPreview.entries.map(e => (
                  <div key={e.date} style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--bd)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{e.date}</span>
                    <span style={{ color: 'var(--tm)' }}>
                      {e.weight}kg
                      {e.skeletalMuscle != null && ` · 근육 ${e.skeletalMuscle}kg`}
                      {e.bodyFatPct != null && ` · 체지방 ${e.bodyFatPct}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '16px' }}>
              기존 같은 날짜 기록은 덮어씁니다.
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setImportPreview(null)} disabled={importing}>{tr(lang, 'cancel')}</button>
              <button className="btn btn-p" onClick={confirmImport} disabled={importing || !importPreview.entries.length}>
                {importing ? '저장 중...' : `${importPreview.entries.length}건 저장`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
