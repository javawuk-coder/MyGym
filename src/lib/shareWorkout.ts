import type { DayLog, LogEntry } from '../types'

function fromKg(kg: number, unit: 'kg' | 'lb') {
  return unit === 'lb' ? Math.round(kg * 2.20462 * 10) / 10 : kg
}

function entryDetail(entry: LogEntry, unit: 'kg' | 'lb'): string {
  const lt = entry.log_type || 'weight_reps'
  const sets = entry.sets || []
  if (lt === 'cardio') {
    const parts: string[] = []
    if (entry.dist) parts.push(`${entry.dist}km`)
    if (entry.time) parts.push(`${entry.time}분`)
    if (entry.cal) parts.push(`${entry.cal}kcal`)
    return parts.join(' · ') || '—'
  }
  if (!sets.length) return '—'
  if (lt === 'weight_reps') {
    const ws = sets.map(s => s.weight || 0)
    const rs = sets.map(s => s.reps || 0)
    const w = fromKg(ws[0], unit)
    if (ws.every(v => v === ws[0]) && rs.every(v => v === rs[0]))
      return `${w}${unit} × ${rs[0]}회 × ${sets.length}세트`
    return sets.map(s => `${fromKg(s.weight || 0, unit)}${unit}×${s.reps}회`).join(', ')
  }
  if (lt === 'reps_only') {
    const rs = sets.map(s => s.reps || 0)
    return rs.every(r => r === rs[0]) ? `${rs[0]}회 × ${sets.length}세트` : rs.map(r => `${r}회`).join(', ')
  }
  if (lt === 'time') {
    const ds = sets.map(s => s.duration || 0)
    return ds.every(d => d === ds[0]) ? `${ds[0]}초 × ${sets.length}세트` : ds.map(d => `${d}초`).join(', ')
  }
  return '—'
}

export interface ShareWorkoutOptions {
  log: DayLog
  exNames: Record<string, string>
  unit: 'kg' | 'lb'
  dateLabel: string
}


export async function shareWorkout({ log, exNames, unit, dateLabel }: ShareWorkoutOptions) {
  const SCALE = 2
  const W = 375
  const PAD = 24
  const ACCENT = '#1D9E75'
  const BG = '#111111'
  const exes = log.exercises

  // measure height
  const ROW_H = 38
  const headerH = 24 + 20 + 8 + 20 + 32 + 56 + 16 + 1 + 16
  const footerH = 20 + PAD
  const H = headerH + exes.length * ROW_H + footerH

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  const font = `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

  // background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  let y = PAD

  // app tag
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = `500 10px ${font}`
  ctx.letterSpacing = '1px'
  ctx.fillText('MYGYM', PAD, y + 10)
  ctx.letterSpacing = '0px'
  y += 24

  // date
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `400 12px ${font}`
  ctx.fillText(dateLabel, PAD, y + 12)
  y += 20

  // workout name / routine
  const title = log.routineName || '운동 기록'
  ctx.fillStyle = '#ffffff'
  ctx.font = `500 20px ${font}`
  ctx.fillText(title, PAD, y + 20)
  y += 32

  // stats
  let totalSets = 0, totalVol = 0, hasWeight = false
  for (const e of exes) {
    for (const s of (e.sets || [])) {
      totalSets++
      if (s.weight && s.reps) { totalVol += s.weight * s.reps; hasWeight = true }
    }
  }
  const stats = [
    { val: `${exes.length}`, label: '운동' },
    { val: `${totalSets}`, label: '세트' },
    ...(hasWeight ? [{ val: `${Math.round(fromKg(totalVol, unit)).toLocaleString()}${unit}`, label: '볼륨' }] : []),
  ]
  const statW = (W - PAD * 2) / stats.length
  for (let i = 0; i < stats.length; i++) {
    const sx = PAD + i * statW
    ctx.fillStyle = ACCENT
    ctx.font = `500 18px ${font}`
    ctx.fillText(stats[i].val, sx, y + 18)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = `400 10px ${font}`
    ctx.fillText(stats[i].label, sx, y + 34)
  }
  y += 56

  // divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
  y += 16

  // exercise rows
  for (let i = 0; i < exes.length; i++) {
    const entry = exes[i]
    const name = exNames[entry.exId] || entry.exId
    const detail = entryDetail(entry, unit)

    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    }

    const rowMid = y + ROW_H / 2

    // exercise name
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = `400 13px ${font}`
    ctx.fillText(name, PAD, rowMid + 5)

    // detail (right-aligned)
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.font = `400 12px ${font}`
    const detailW = ctx.measureText(detail).width
    ctx.fillText(detail, W - PAD - detailW, rowMid + 5)

    y += ROW_H
  }

  // logo
  y += 16
  const DOT_R = 4
  const logoText = 'MyGym'
  ctx.font = `400 10px ${font}`
  const logoTW = ctx.measureText(logoText).width
  const logoX = W - PAD - logoTW - DOT_R * 2 - 5
  ctx.fillStyle = ACCENT
  ctx.beginPath(); ctx.arc(logoX + DOT_R, y, DOT_R, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillText(logoText, logoX + DOT_R * 2 + 5, y + 4)

  // export
  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], `workout-${log.date}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'MyGym 운동 기록' })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = file.name; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }, 'image/png')
}
