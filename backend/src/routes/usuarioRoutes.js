import { Router } from 'express'
import { listarUsuarios, crearUsuario, editarUsuario, eliminarUsuario } from '../controllers/usuarioController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/',       authMiddleware, roleMiddleware('admin'), listarUsuarios)
router.post('/',      authMiddleware, roleMiddleware('admin'), crearUsuario)
router.patch('/:id',  authMiddleware, roleMiddleware('admin'), editarUsuario)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), eliminarUsuario)

export default router