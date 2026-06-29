import { useState, useRef, useEffect } from 'react'
import {
  IconLayoutList, IconPlus, IconPlayerPlay, IconTrash,
  IconPencil, IconSearch, IconX, IconGripVertical, IconPhoto,
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

// 포맷별 기본값 적용 (저장된 데이터에 undefined 필드가 있을 때 대비)
function withDefaults(f: WorkoutFormat): WorkoutFormat {
  switch (f.type) {
    case 'tabata':   return { workSec: 20, restSec: 10, tabataRounds: 8, tabataSets: 1, setRestSec: 120, ...f }
    case 'for_time': return { formatRounds: 1, ...f }
    case 'amrap':    return { duration: 20, ...f }
    case 'emom':     return { every: 1, emomSets: 20, ...f }
    case 'interval': return { intervalUnit: 'min', workMin: 2, restMin: 1, workSec2: 45, restSec2: 15, intervalRounds: 6, ...f }
    default:         return f
  }
}

// 카드에 표시할 포맷 요약
function formatSummary(raw: WorkoutFormat): string {
  const f = withDefaults(raw)
  switch (f.type) {
    case 'tabata': {
      const sets = f.tabataSets ?? 1
      return `Tabata ${f.workSec}s/${f.restSec}s × ${f.tabataRounds}rds${sets > 1 ? ` × ${sets}sets` : ''}`
    }
    case 'for_time': {
      const rds = f.formatRounds ?? 1
      return `For Time${rds > 1 ? ` — ${rds} Rounds` : ''}${f.timeCap ? ` (cap ${f.timeCap}min)` : ''}`
    }
    case 'amrap':
      return `AMRAP ${f.duration}min`
    case 'emom': {
      const ev = f.every ?? 1
      const sets = f.emomSets ?? 20
      return `E${ev > 1 ? ev : ''}MOM × ${sets}sets (${ev * sets}min)`
    }
    case 'interval': {
      const unit = f.intervalUnit ?? 'min'
      const w = unit === 'sec' ? `${f.workSec2 ?? 45}s` : `${f.workMin ?? 2}min`
      const r = unit === 'sec' ? `${f.restSec2 ?? 15}s` : `${f.restMin ?? 1}min`
      return `${w} on / ${r} off × ${f.intervalRounds ?? 6}rounds`
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
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getEx = (id: string) => allExercises.find(e => e.id === id)

  const sortedEx = [...allExercises].sort((a, b) => (a.ko || a.name).localeCompare(b.ko || b.name, 'ko'))
  const filtered = sortedEx.filter(x => {
    const mOk = filterMuscle === 'all' || x.muscle === filterMuscle
    return mOk && matchesQuery(x, search)
  })

  const isSelected = (id: string) => selected.some(s => s.exId === id)

  // 항상 추가 (중복 허용) — 제거는 X 버튼으로만
  const toggleExercise = (id: string) =>
    setSelected(prev => [...prev, { exId: id, sets: 3, reps: 10 }])

  const updateAtIndex = (i: number, patch: Partial<RoutineExercise>) =>
    setSelected(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))

  const updateSetsReps = (i: number, field: 'sets' | 'reps', val: string) => {
    const n = Math.max(1, parseInt(val) || 1)
    updateAtIndex(i, { [field]: n })
  }

  const updateExercise = (i: number, patch: Partial<RoutineExercise>) => updateAtIndex(i, patch)

  const removeFromSelected = (i: number) => setSelected(prev => prev.filter((_, idx) => idx !== i))

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
      emom:      { every: 1, emomSets: 20 },
      interval:  { intervalUnit: 'min', workMin: 2, restMin: 1, workSec2: 45, restSec2: 15, intervalRounds: 6 },
    }
    setFormat({ type: t, ...defaults[t] })
  }

  const openAdd = () => {
    setEditingId(null); setRoutineName(''); setSelected([])
    setFormat(defaultFormat()); setSearch(''); setFilterMuscle('all')
    setParseError(null); setParseWarnings([])
    setShowModal(true)
  }

  // 약어/별칭 → 정식 이름 맵
  const ALIASES: Record<string, string> = {
    // CrossFit 약어
    'rks': 'russian kettlebell swing',
    'r.k.s.': 'russian kettlebell swing',
    'r. k. s.': 'russian kettlebell swing',
    's2oh': 'shoulder to overhead',
    'stoh': 'shoulder to overhead',
    'c2b': 'chest-to-bar pull-up',
    'hspu': 'handstand push-up',
    'du': 'double under',
    'tu': 'triple under',
    'kb swing': 'russian kettlebell swing',
    'ohs': 'overhead squat',
    't2b': 'toes-to-bar',
    'ttb': 'toes-to-bar',
    'bjj': 'box jump',
    'bjo': 'box jump over',
    'ghr': 'ghd back extension',
    'w.b.s.': 'wall ball shot',
    'w. b. s.': 'wall ball shot',
    'wbs': 'wall ball shot',
    'wall ball shots': 'wall ball shot',
    // 단축 운동명
    'row': 'rowing machine',
    'ski': 'ski erg',
    'run': 'outdoor running',
    'bike': 'assault bike',
    'farmers carry': "farmer's carry",
    'farmer carry': "farmer's carry",
    // 칼로리
    'cal run': 'run calorie',
    'cal row': 'row calorie',
    'cal ski': 'ski erg calorie',
    'cal bike': 'assault bike calorie',
  }

  // 운동 이름으로 DB 매칭 (약어 → 퍼지 매칭)
  const matchExercise = (name: string): Exercise | null => {
    // 점·공백 정리 후 소문자
    const q = name.toLowerCase().trim().replace(/\.\s*/g, '. ').trim()
    const qClean = q.replace(/[.\s]+/g, ' ').trim()

    // 1. 약어 맵
    const aliased = ALIASES[qClean] ?? ALIASES[q]
    const searchQ = aliased ?? qClean

    // 2. 정확 매칭 (name 또는 ko)
    const exact = allExercises.find(e =>
      e.name.toLowerCase() === searchQ || (e.ko && e.ko.toLowerCase() === searchQ)
    )
    if (exact) return exact

    // 3. 토큰 부분 매칭 (2토큰 이상)
    const tokens = searchQ.split(/\s+/).filter(Boolean)
    if (tokens.length >= 2) {
      const partial = allExercises.find(e => {
        const target = (e.name + ' ' + (e.ko || '')).toLowerCase()
        return tokens.every(t => target.includes(t))
      })
      if (partial) return partial
    }

    // 4. 단일 토큰이라도 핵심어 매칭 (3자 이상, 단어 경계 우선)
    if (tokens.length === 1 && tokens[0].length >= 3) {
      return allExercises.find(e =>
        e.name.toLowerCase().includes(tokens[0]) || (e.ko && e.ko.includes(tokens[0]))
      ) ?? null
    }

    return null
  }

  const processImageFile = async (file: File) => {
    setParsing(true); setParseError(null); setParseWarnings([])

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/parse-workout', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })

      if (!res.ok) {
        const err = await res.json() as { error: string }
        throw new Error(err.error || 'Parse failed')
      }

      const parsed = await res.json() as {
        name?: string
        format?: WorkoutFormat
        exercises?: { name: string; sets: number; reps: number; maxReps?: boolean; roundType?: 'all'|'odd'|'even'; note?: string }[]
      }

      // 루틴 이름
      if (parsed.name) setRoutineName(parsed.name)

      // 포맷
      if (parsed.format?.type) setFormat(withDefaults(parsed.format))

      // 운동 매칭
      const warnings: string[] = []
      const newSelected: RoutineExercise[] = []
      for (const ex of parsed.exercises ?? []) {
        const match = matchExercise(ex.name)
        if (!match) {
          warnings.push(`"${ex.name}" — DB에서 찾지 못했습니다`)
          continue
        }
        newSelected.push({
          exId: match.id,
          sets: ex.sets ?? 1,
          reps: ex.reps ?? 10,
          maxReps: ex.maxReps ?? false,
          roundType: ex.roundType ?? 'all',
          note: ex.note || undefined,
        })
      }
      setSelected(newSelected)
      setParseWarnings(warnings)
    } catch (err) {
      setParseError(String(err))
    } finally {
      setParsing(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    processImageFile(file)
  }

  // 모달 열릴 때 붙여넣기(Ctrl+V) 이미지 감지
  useEffect(() => {
    if (!showModal || editingId) return
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const file = item.getAsFile()
      if (file) { e.preventDefault(); processImageFile(file) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [showModal, editingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (r: Routine & { id: string }) => {
    setEditingId(r.id); setRoutineName(r.name)
    setSelected(r.exercises.map(e =>
      typeof e === 'string' ? { exId: e as unknown as string, sets: 3, reps: 10 } : e
    ))
    setFormat(withDefaults(r.format ?? defaultFormat()))
    setSearch(''); setFilterMuscle('all'); setShowModal(true)
  }

  const save = async () => {
    if (!routineName.trim()) { alert('루틴 이름을 입력하세요'); return }
    if (!selected.length) { alert('운동을 하나 이상 추가하세요'); return }

    // Firestore는 undefined 값을 거부 — undefined 필드 제거
    const cleanExercises = selected.map(s => {
      const e: Record<string, unknown> = { exId: s.exId, sets: s.sets, reps: s.reps }
      if (s.maxReps) e.maxReps = true
      if (s.roundType && s.roundType !== 'all') e.roundType = s.roundType
      if (s.note) e.note = s.note
      return e as unknown as RoutineExercise
    })

    try {
      const data = { name: routineName.trim(), exercises: cleanExercises, format }
      if (editingId) await onUpdateRoutine(editingId, data)
      else await onAddRoutine(data)
      setShowModal(false)
    } catch (err) {
      alert(`저장 실패: ${String(err)}`)
    }
  }

  const muscles = ['all', ...Object.keys(ML)]
  const hasSets = showSetsCol(format)
  const gridCols = hasSets ? '20px 1fr 52px 68px 28px' : '20px 1fr 80px 28px'
  const gridColsHeader = hasSets ? '20px 1fr 52px 68px 28px' : '20px 1fr 80px 28px'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="stitle">My Routines</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-p" onClick={openAdd}><IconPlus size={14} style={{ marginRight: 4 }} />New Routine</button>
        </div>
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
        <div className="mbg">
          <div className="mo" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="mt2" style={{ margin: 0 }}>{editingId ? 'Edit Routine' : 'New Routine'}</div>
              {!editingId && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  <button className="btn" onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                    <IconPhoto size={15} />
                    {parsing ? '분석 중...' : '이미지 업로드 / Ctrl+V'}
                  </button>
                </>
              )}
            </div>

            {/* 파싱 상태 */}
            {parsing && (
              <div style={{ background: '#1D9E7522', border: '0.5px solid #1D9E75', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#1D9E75' }}>
                🤖 Gemini가 워크아웃을 분석 중입니다...
              </div>
            )}
            {parseError && (
              <div style={{ background: '#E24B4A22', border: '0.5px solid #E24B4A', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#E24B4A' }}>
                ⚠ 파싱 오류: {parseError}
              </div>
            )}
            {parseWarnings.length > 0 && (
              <div style={{ background: '#EF9F2722', border: '0.5px solid #EF9F27', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#EF9F27' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>일부 운동을 DB에서 찾지 못했습니다:</div>
                {parseWarnings.map((w, i) => <div key={i}>• {w}</div>)}
              </div>
            )}

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
                    { label: '운동당 반복 횟수', key: 'tabataRounds', def: 8 },
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
                  예: 45s/15s × 2회/운동 → 운동 하나당 2라운드. Sets는 전체 블록 반복
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

            {format.type === 'emom' && (() => {
              const ev = format.every ?? 1
              const sets = format.emomSets ?? 20
              const totalMin = ev * sets
              return (
                <div style={{ background: 'var(--s1)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '10px', fontWeight: 500 }}>
                    EMOM: 매 X분 시작에 정해진 reps 수행, 나머지는 휴식. 점수 = 완료율
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Every X분 (E<strong>X</strong>MOM)</div>
                      <input type="number" min="1" max="10" value={ev}
                        onChange={e => updateFormat({ every: parseInt(e.target.value) || 1 })}
                        style={{ textAlign: 'center', padding: '5px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Sets</div>
                      <input type="number" min="1" value={sets}
                        onChange={e => updateFormat({ emomSets: parseInt(e.target.value) || 1 })}
                        style={{ textAlign: 'center', padding: '5px' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Total Duration</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1D9E75', padding: '4px 0' }}>{totalMin}min</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '8px' }}>
                    E{ev > 1 ? ev : ''}MOM × {sets}sets = {totalMin}분. 아래 reps = 인터벌당 횟수
                  </div>
                </div>
              )
            })()}

            {format.type === 'interval' && (() => {
              const isSec = (format.intervalUnit ?? 'min') === 'sec'
              return (
                <div style={{ background: 'var(--s1)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ts)', marginBottom: '10px', fontWeight: 500 }}>
                    Interval: 자유 형식 work / rest 반복 — 운동별 ODD/EVEN 라운드 지정 가능
                  </div>
                  {/* 단위 전환 */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    {(['min', 'sec'] as const).map(u => (
                      <button key={u} onClick={() => updateFormat({ intervalUnit: u })} style={{
                        padding: '4px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                        border: `1px solid ${!isSec && u === 'min' || isSec && u === 'sec' ? '#D4537E' : 'var(--bd)'}`,
                        background: (!isSec && u === 'min' || isSec && u === 'sec') ? '#D4537E22' : 'transparent',
                        color: (!isSec && u === 'min' || isSec && u === 'sec') ? '#D4537E' : 'var(--tm)',
                        fontWeight: (!isSec && u === 'min' || isSec && u === 'sec') ? 700 : 400,
                      }}>{u === 'min' ? '분 (min)' : '초 (sec)'}</button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {isSec ? (
                      <>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Work (초)</div>
                          <input type="number" min="1" value={format.workSec2 ?? 45}
                            onChange={e => updateFormat({ workSec2: parseInt(e.target.value) || 45 })}
                            style={{ textAlign: 'center', padding: '5px' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Rest (초)</div>
                          <input type="number" min="1" value={format.restSec2 ?? 15}
                            onChange={e => updateFormat({ restSec2: parseInt(e.target.value) || 15 })}
                            style={{ textAlign: 'center', padding: '5px' }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Work (분)</div>
                          <input type="number" min="1" value={format.workMin ?? 2}
                            onChange={e => updateFormat({ workMin: parseInt(e.target.value) || 2 })}
                            style={{ textAlign: 'center', padding: '5px' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Rest (분)</div>
                          <input type="number" min="1" value={format.restMin ?? 1}
                            onChange={e => updateFormat({ restMin: parseInt(e.target.value) || 1 })}
                            style={{ textAlign: 'center', padding: '5px' }} />
                        </div>
                      </>
                    )}
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '3px' }}>Rounds</div>
                      <input type="number" min="1" value={format.intervalRounds ?? 6}
                        onChange={e => updateFormat({ intervalRounds: parseInt(e.target.value) || 6 })}
                        style={{ textAlign: 'center', padding: '5px' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '8px' }}>
                    아래 운동별로 ODD/EVEN 라운드 지정 및 MAX 플래그, 메모 입력 가능
                  </div>
                </div>
              )
            })()}

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
                      <div key={`${s.exId}_${i}`} draggable
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
                                  onChange={e => updateSetsReps(i, 'sets', e.target.value)}
                                  style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }} />
                          )}
                          {s.maxReps
                            ? <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#E24B4A' }}>MAX</div>
                            : isCardio
                              ? <div style={{ fontSize: '11px', color: 'var(--tm)', textAlign: 'center' }}>cardio</div>
                              : <input type="number" min="1" value={s.reps}
                                  onChange={e => updateSetsReps(i, 'reps', e.target.value)}
                                  style={{ textAlign: 'center', padding: '4px 6px', fontSize: '13px' }}
                                  placeholder={isTime ? '초' : '회'} />
                          }
                          <button className="idb" onClick={() => removeFromSelected(i)}><IconX size={14} /></button>
                        </div>

                        {/* 2행: Interval 전용 — ODD/EVEN/ALL + MAX + note */}
                        {isInterval && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', paddingLeft: '24px', flexWrap: 'wrap' }}>
                            {/* ODD / EVEN / ALL 선택 */}
                            {(['odd', 'even', 'all'] as const).map(v => (
                              <button key={v} onClick={() => updateExercise(i, { roundType: v })} style={{
                                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                                border: `1px solid ${rt === v ? ROUND_TYPE_COLORS[v] : 'var(--bd)'}`,
                                background: rt === v ? `${ROUND_TYPE_COLORS[v]}22` : 'transparent',
                                color: rt === v ? ROUND_TYPE_COLORS[v] : 'var(--tm)',
                                fontWeight: rt === v ? 700 : 400,
                              }}>{ROUND_TYPE_LABELS[v]}</button>
                            ))}
                            {/* MAX 토글 */}
                            <button onClick={() => updateExercise(i, { maxReps: !s.maxReps })} style={{
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                              border: `1px solid ${s.maxReps ? '#E24B4A' : 'var(--bd)'}`,
                              background: s.maxReps ? '#E24B4A22' : 'transparent',
                              color: s.maxReps ? '#E24B4A' : 'var(--tm)',
                              fontWeight: s.maxReps ? 700 : 400,
                            }}>MAX</button>
                            {/* 메모 (@ weight 등) */}
                            <input value={s.note ?? ''} onChange={e => updateExercise(i, { note: e.target.value || undefined })}
                              placeholder="메모 (예: @ 55/75 lb)" style={{ flex: 1, minWidth: '120px', fontSize: '12px', padding: '3px 8px' }} />
                          </div>
                        )}
                        {/* non-interval에서도 MAX 토글 제공 (AMRAP, EMOM, Tabata, For Time) */}
                        {!isInterval && (format.type === 'amrap' || format.type === 'emom' || format.type === 'tabata' || format.type === 'for_time') && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '5px', paddingLeft: '24px', flexWrap: 'wrap' }}>
                            <button onClick={() => updateExercise(i, { maxReps: !s.maxReps })} style={{
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                              border: `1px solid ${s.maxReps ? '#E24B4A' : 'var(--bd)'}`,
                              background: s.maxReps ? '#E24B4A22' : 'transparent',
                              color: s.maxReps ? '#E24B4A' : 'var(--tm)',
                              fontWeight: s.maxReps ? 700 : 400,
                            }}>MAX</button>
                            <input value={s.note ?? ''} onChange={e => updateExercise(i, { note: e.target.value || undefined })}
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
