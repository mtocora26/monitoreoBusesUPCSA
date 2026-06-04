import { pool } from './src/models/database.js'
const [rows] = await pool.execute('SELECT correo, tipo_usuario FROM usuarios LIMIT 10')
console.log(JSON.stringify(rows))
process.exit(0)
