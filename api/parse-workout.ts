import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a fitness coach assistant. Analyze the workout image and extract the workout information.

Return ONLY a valid JSON object with this exact structure:
{
  "name": "workout name (use date + type if visible, e.g. '2026.06.29 Metcon')",
  "format": {
    "type": "one of: sets_reps | tabata | for_time | amrap | emom | interval",

    // --- Tabata fields (if type=tabata) ---
    "workSec": 20,          // work duration in seconds
    "restSec": 10,          // rest duration in seconds
    "tabataRounds": 8,      // rounds per exercise
    "tabataSets": 1,        // how many times to repeat the full block
    "setRestSec": 120,      // rest between sets in seconds

    // --- For Time fields (if type=for_time) ---
    "formatRounds": 1,      // number of rounds of the circuit
    "timeCap": null,        // time cap in minutes, or null

    // --- AMRAP fields (if type=amrap) ---
    "duration": 20,         // duration in minutes

    // --- EMOM fields (if type=emom) ---
    "every": 1,             // every X minutes
    "emomSets": 20,         // number of sets (total duration = every * emomSets)

    // --- Interval fields (if type=interval) ---
    "intervalUnit": "min",  // "min" or "sec"
    "workMin": 2,           // work duration in minutes (if intervalUnit=min)
    "restMin": 1,           // rest duration in minutes (if intervalUnit=min)
    "workSec2": 45,         // work duration in seconds (if intervalUnit=sec)
    "restSec2": 15,         // rest duration in seconds (if intervalUnit=sec)
    "intervalRounds": 6     // total number of rounds
  },
  "exercises": [
    {
      "name": "standard English exercise name (e.g. 'Barbell Thruster', 'Cal Run', 'Wall Walk')",
      "sets": 3,            // number of sets (for sets_reps format only, else use 1)
      "reps": 10,           // reps per set/round, or 0 if maxReps=true
      "maxReps": false,     // true if the goal is MAX reps/calories (e.g. 'Max Cal Row', 'Max Wall Walk')
      "roundType": "all",   // "all", "odd", or "even" (for interval format with ODD/EVEN rounds)
      "note": ""            // extra info like weight "@55/75lb" or round number "2R"
    }
  ]
}

Rules:
- For "Cal" exercises (Cal Row, Cal Ski, Cal Run, Cal Bike), set maxReps=true unless a specific number is given
- For "Max" prefix exercises, always set maxReps=true
- Detect ODD/EVEN round patterns and set roundType accordingly
- Use standard gym exercise names in English
- If sets/reps are not specified, use sensible defaults (sets=1, reps=10)
- Only include fields relevant to the detected format type
- Return ONLY the JSON, no markdown, no explanation`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  const { imageBase64, mimeType } = req.body as { imageBase64: string; mimeType: string }
  if (!imageBase64 || !mimeType) return res.status(400).json({ error: 'imageBase64 and mimeType required' })

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: SYSTEM_PROMPT },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json',
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      return res.status(500).json({ error: `Gemini error: ${err}` })
    }

    const data = await geminiRes.json() as {
      candidates: { content: { parts: { text: string }[] } }[]
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    // strip possible markdown fences
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean)

    return res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: String(e) })
  }
}
