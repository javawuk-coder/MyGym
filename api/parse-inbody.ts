import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a health assistant. Analyze this InBody body composition report image and extract the measurements.

Return ONLY a valid JSON object with these fields (all values as numbers, null if not found):
{
  "weight": 75.5,
  "skeletalMuscle": 32.1,
  "bodyFatMass": 18.3,
  "bodyFatPct": 24.2,
  "visceralFat": 8,
  "waist": 84.5,
  "trunkFat": 9.2
}

Field descriptions:
- weight: Body weight in kg (체중, 체중(kg))
- skeletalMuscle: Skeletal muscle mass in kg (골격근량, 근육량)
- bodyFatMass: Body fat mass in kg (체지방량)
- bodyFatPct: Body fat percentage % (체지방률, 체지방(%))
- visceralFat: Visceral fat level number (내장지방레벨, 내장지방 단계)
- waist: Waist circumference in cm (허리둘레)
- trunkFat: Trunk fat mass in kg (복부지방량, 몸통체지방)

Return ONLY the JSON, no markdown fences, no explanation. Use null for any field not visible in the image.`

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
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
    generationConfig: { temperature: 0.1 },
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
