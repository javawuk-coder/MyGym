import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query } = req.query
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query required' })
  }

  const key = process.env.FOOD_API_KEY
  if (!key) return res.status(500).json({ error: 'FOOD_API_KEY not configured' })

  // 두 가지 URL 포맷 시도 (경로 파라미터 / 쿼리 스트링)
  const urls = [
    `https://openapi.foodsafetykorea.go.kr/api/${key}/I2790/json/1/30/FOOD_NM_KR=${encodeURIComponent(query)}`,
    `https://openapi.foodsafetykorea.go.kr/api/${key}/I2790/json/1/30?FOOD_NM_KR=${encodeURIComponent(query)}`,
  ]

  for (const url of urls) {
    try {
      console.log('[search-food] trying:', url.replace(key, '***'))
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) })
      const text = await resp.text()
      console.log('[search-food] status:', resp.status, 'body[:200]:', text.slice(0, 200))
      if (!resp.ok) continue
      let data: unknown
      try { data = JSON.parse(text) } catch { continue }
      const rows = (data as Record<string, unknown>)?.['I2790']
      console.log('[search-food] I2790 keys:', rows ? Object.keys(rows as object) : 'none')
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
      return res.json(data)
    } catch (e) {
      console.error('[search-food] attempt failed:', String(e))
    }
  }
  return res.status(502).json({ error: 'all attempts failed' })
}
