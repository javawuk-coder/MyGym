import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query } = req.query
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query required' })
  }

  const key = process.env.FOOD_API_KEY
  if (!key) return res.status(500).json({ error: 'FOOD_API_KEY not configured' })

  try {
    const url = `https://openapi.foodsafetykorea.go.kr/api/${key}/I2790/json/1/30/FOOD_NM_KR=${encodeURIComponent(query)}`
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!resp.ok) return res.status(502).json({ error: 'upstream error', status: resp.status })
    const data = await resp.json()
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    return res.json(data)
  } catch (e) {
    return res.status(502).json({ error: 'fetch failed', detail: String(e) })
  }
}
