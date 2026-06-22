import prisma from '../config/prisma'
import type { DolarApiItem } from '../types/tasas';

async function fetchFromUrl(url: string): Promise<DolarApiItem[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error fetching ${url}: ${res.status}`)
  const data = await res.json()
  return data as DolarApiItem[]
}

export async function fetchAndSaveTasasFromDolarApi(): Promise<void> {
  let tasa_usd: number | null = null;
  let tasa_euro: number | null = null;
  let tasa_paralelo: number | null = null;

  // Intentamos obtener la tasa del Dólar
  try {
    const dolares = await fetchFromUrl('https://ve.dolarapi.com/v1/dolares');
    const paraleloUsd = dolares.find((d) => d.fuente === 'paralelo');
    const oficialUsd = dolares.find((d) => d.fuente === 'oficial');
    tasa_usd = oficialUsd?.promedio ?? paraleloUsd?.promedio ?? null;
    tasa_paralelo = paraleloUsd?.promedio ?? null;
  } catch (e) {
    console.error('Error fetching USD rates from DolarApi:', e);
  }

  // Intentamos obtener la tasa del Euro
  try {
    const euros = await fetchFromUrl('https://ve.dolarapi.com/v1/euros');
    const paraleloEur = euros.find((d) => d.fuente === 'paralelo');
    const oficialEur = euros.find((d) => d.fuente === 'oficial');
    tasa_euro = oficialEur?.promedio ?? paraleloEur?.promedio ?? null;
  } catch (e) {
    console.error('Error fetching EUR rates from DolarApi:', e);
  }

  // Si no pudimos obtener ninguna de las tasas, arrojamos un error para no guardar datos vacíos
  if (tasa_usd === null && tasa_euro === null && tasa_paralelo === null) {
    throw new Error('No se pudo obtener ninguna tasa de cambio (USD/EUR) de DolarApi');
  }

  // Si falló una de las tasas pero la otra funciona, intentamos rellenar la fallida con el último valor registrado
  const lastTasa = await prisma.tasa_moneda.findFirst({ orderBy: { id: 'desc' } });
  if (tasa_usd === null && lastTasa?.tasa_usd) {
    tasa_usd = Number(lastTasa.tasa_usd);
  }
  if (tasa_euro === null && lastTasa?.tasa_euro) {
    tasa_euro = Number(lastTasa.tasa_euro);
  }
  if (tasa_paralelo === null && lastTasa?.tasa_paralelo) {
    tasa_paralelo = Number(lastTasa.tasa_paralelo);
  }

  // Siempre creamos un nuevo registro histórico en lugar de sobreescribir el anterior
  const created = await prisma.tasa_moneda.create({
    data: {
      moneda: 'Bs',
      tasa_usd: tasa_usd,
      tasa_euro: tasa_euro,
      tasa_paralelo: tasa_paralelo,
    },
  });
  console.log('Tasa de moneda registrada históricamente:', { id: created.id, tasa_usd, tasa_euro, tasa_paralelo });
}

export default { fetchAndSaveTasasFromDolarApi }

