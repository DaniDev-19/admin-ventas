;(async function main(){
  try {
    const [dolaresRes, eurosRes] = await Promise.all([
      fetch('https://ve.dolarapi.com/v1/dolares').then(r => r.json()),
      fetch('https://ve.dolarapi.com/v1/euros').then(r => r.json()),
    ])

    const paraleloUsd = (dolaresRes || []).find(d => d.fuente === 'paralelo')
    const oficialUsd = (dolaresRes || []).find(d => d.fuente === 'oficial')
    const paraleloEur = (eurosRes || []).find(d => d.fuente === 'paralelo')
    const oficialEur = (eurosRes || []).find(d => d.fuente === 'oficial')

    const tasa_usd = paraleloUsd?.promedio ?? oficialUsd?.promedio ?? null
    const tasa_euro = paraleloEur?.promedio ?? oficialEur?.promedio ?? null

    console.log('== Resultado fetch ==')
    console.log('tasa_usd:', tasa_usd)
    console.log('tasa_euro:', tasa_euro)

    console.log('\n== Dólares (respuesta cruda) ==')
    console.log(JSON.stringify(dolaresRes, null, 2))

    console.log('\n== Euros (respuesta cruda) ==')
    console.log(JSON.stringify(eurosRes, null, 2))

    console.log('\n== Objeto a insertar/actualizar en la tabla tasa_moneda ==')
    console.log(JSON.stringify({ moneda: 'Bs', tasa_usd, tasa_euro, updated_at: new Date().toISOString() }, null, 2))
  } catch (err) {
    console.error('Error en prueba:', err)
    process.exit(1)
  }
})()
