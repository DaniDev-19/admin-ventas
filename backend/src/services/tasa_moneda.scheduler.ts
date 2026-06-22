import { fetchAndSaveTasasFromDolarApi } from './tasa_moneda.service';
import cron from 'node-cron';

let task: any = null

export function startTasaScheduler(cronExpr = process.env.TASA_CRON ?? '0 * * * *') {

  void fetchAndSaveTasasFromDolarApi().catch((e) => console.error(e))

  if (task) task.stop()

  task = cron.schedule(cronExpr, () => {
    void fetchAndSaveTasasFromDolarApi().catch((e) => console.error(e))
  })

  console.log(`Tasa scheduler started, cron='${cronExpr}'`)
}

export function stopTasaScheduler() {
  if (task) {
    task.stop()
    task = null
  }
}

export default { startTasaScheduler, stopTasaScheduler }
