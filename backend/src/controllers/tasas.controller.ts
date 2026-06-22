import { Request, Response, NextFunction } from 'express'
import { enrichAndNext } from '../utils/nextError'
import { fetchAndSaveTasasFromDolarApi } from '../services/tasa_moneda.service'

export const getLatestTasa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma
    if (!prisma) throw new Error('database the client not found in request')

    const latest = await prisma.tasa_moneda.findFirst({ orderBy: { id: 'desc' } })

    res.status(200).json({ status: 'success', data: latest, timeResponseISO: new Date().toISOString() })
  } catch (err) {
    enrichAndNext(err, next)
  }
}

export const refreshTasas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fetchAndSaveTasasFromDolarApi()
    res.status(200).json({ status: 'success', message: 'tasas refreshed' })
  } catch (err) {
    enrichAndNext(err, next)
  }
}

export default { getLatestTasa, refreshTasas }
