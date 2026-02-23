/**
 * Script temporal para ejecutar el cron de actualización de estados manualmente.
 */

import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { actualizarEstadoSoportesAlquileres } from '@/lib/helpersAlquileres'

async function run() {
  await actualizarEstadoSoportesAlquileres()
  console.log('Cron ejecutado manualmente')
}

run()
