import prisma from '../config/prisma'
import type { DolarApiItem } from '../types/tasas';


async function fetchFromUrl(url: string): Promise<DolarApiItem[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error fetching ${url}: ${res.status}`)
  const data = await res.json()
  return data as DolarApiItem[]
}

export async function fetchAndSaveTasasFromDolarApi(): Promise<void> {
  try {
    const [dolares, euros] = await Promise.all([
      fetchFromUrl('https://ve.dolarapi.com/v1/dolares'),
      fetchFromUrl('https://ve.dolarapi.com/v1/euros'),
    ])

    const paraleloUsd = dolares.find((d) => d.fuente === 'paralelo')
    const oficialUsd = dolares.find((d) => d.fuente === 'oficial')
    const paraleloEur = euros.find((d) => d.fuente === 'paralelo')
    const oficialEur = euros.find((d) => d.fuente === 'oficial')

    const tasa_usd = oficialUsd?.promedio ?? paraleloUsd?.promedio ?? null
    const tasa_euro = oficialEur?.promedio ?? paraleloEur?.promedio ?? null

    const existing = await prisma.tasa_moneda.findFirst({ orderBy: { id: 'desc' } })

    if (existing) {
      await prisma.tasa_moneda.update({
        where: { id: existing.id },
        data: {
          tasa_usd: tasa_usd ?? undefined,
          tasa_euro: tasa_euro ?? undefined,
          updated_at: new Date(),
        },
      })
      console.log('tasa_moneda updated', { id: existing.id, tasa_usd, tasa_euro })
    } else {
      const created = await prisma.tasa_moneda.create({
        data: {
          moneda: 'Bs',
          tasa_usd: tasa_usd ?? undefined,
          tasa_euro: tasa_euro ?? undefined,
        },
      })
      console.log('tasa_moneda created', { id: created.id, tasa_usd, tasa_euro })
    }
  } catch (error) {
    console.error('fetchAndSaveTasasFromDolarApi error:', error)
    throw error
  }
}

export default { fetchAndSaveTasasFromDolarApi }
