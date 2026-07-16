export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')
  if (!query) {
    return new Response(JSON.stringify({ error: 'query required' }), { status: 400 })
  }

  const key = process.env.FOOD_API_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: 'FOOD_API_KEY not configured' }), { status: 500 })
  }

  try {
    const url = `https://openapi.foodsafetykorea.go.kr/api/${key}/I2790/json/1/30/FOOD_NM_KR=${encodeURIComponent(query)}`
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'upstream error', status: resp.status }), { status: 502 })
    }
    const data = await resp.text()
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502 })
  }
}
