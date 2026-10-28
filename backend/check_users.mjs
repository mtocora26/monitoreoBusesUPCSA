import { pool } from './src/config/database.js'
const [rows] = await pool.execute('SELECT correo, tipo_usuario FROM usuario LIMIT 10')
console.log(JSON.stringify(rows))
process.exit(0)
