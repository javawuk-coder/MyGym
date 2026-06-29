import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a fitness coach assistant. Analyze the workout image and extract the workout information.

Return ONLY a valid JSON object with this exact structure:
{
  "name": "workout name (use date + type if visible, e.g. '2026.06.29 Metcon')",
  "format": {
    "type": "one of: sets_reps | tabata | for_time | amrap | emom | interval",
    "workSec": 20, "restSec": 10, "tabataRounds": 8, "tabataSets": 1, "setRestSec": 120,
    "formatRounds": 1, "timeCap": null,
    "duration": 20,
    "every": 1, "emomSets": 20,
    "intervalUnit": "min", "workMin": 2, "restMin": 1, "workSec2": 45, "restSec2": 15, "intervalRounds": 6
  },
  "exercises": [
    {
      "name": "standard English exercise name (e.g. 'Barbell Thruster', 'Cal Run', 'Wall Walk')",
      "sets": 1, "reps": 10,
      "maxReps": false,
      "roundType": "all",
      "note": ""
    }
  ]
}

Rules:
- Common abbreviations to expand: RKS/R.K.S.=Russian Kettlebell Swing, S2OH/STOH=Shoulder to Overhead, C2B=Chest-to-Bar Pull-Up, HSPU=Handstand Push-Up, DU=Double Under, T2B/TTB=Toes-to-Bar, OHS=Overhead Squat, GHD=GHD Sit-Up, BJO=Box Jump Over
- For 'Cal' exercises (Cal Row, Cal Ski, Cal Run, Cal Bike), set maxReps=true unless specific number given
- For 'Max' prefix exercises, always set maxReps=true
- Detect ODD/EVEN round patterns and set roundType ('odd', 'even', or 'all')
- If intervalUnit is 'sec', populate workSec2/restSec2 fields
- Only include format fields relevant to the detected format type
- Return ONLY the JSON, no markdown fences, no explanation`

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  const { imageBase64, mimeType } = req.body as { imageBase64: string; mimeType: string }
  if (!imageBase64 || !mimeType) return res.status(400).json({ error: 'imageBase64 and mimeType required' })

  const body = JSON.stringify({
    contents: [{
      parts: [
        { inline_data: { mime_type: mimeType, data: imageBase64 } },
        { text: SYSTEM_PROMPT },
      ],
    }],
    generationConfig: { temperature: 0.1, response_mime_type: 'application/json' },
  })

  let lastError = ''
  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      )

      if (r.status === 429) { lastError = `${model}: quota exceeded`; continue }
      if (!r.ok) { lastError = `${model}: ${await r.text()}`; continue }

      const data = await r.json() as { candidates: { content: { parts: { text: string }[] } }[] }
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      return res.status(200).json(JSON.parse(clean))
    } catch (e) {
      lastError = String(e)
    }
  }

  return res.status(429).json({ error: `모든 모델 실패: ${lastError}` })
}
