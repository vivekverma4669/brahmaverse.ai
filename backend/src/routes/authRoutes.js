import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
} from '../middleware/validation.js';
const router = Router();
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, me);
export default router;
