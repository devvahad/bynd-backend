import { Router } from 'express';
import {
    AdminLoginController,
    AdminSignupController,
    DashboardController,
    UserListController,
    EditUserController,
} from '../controllers/admin.js';
import { authenticate, authorizeAdmin } from '../controllers/authentication.js';
import { AdminLoginSchema, AdminSignupSchema, EditUserSchema } from '../schemas/index.js';

const router = Router();

router.post('/login', AdminLoginSchema, AdminLoginController);
router.post('/signup', AdminSignupSchema, AdminSignupController);

router.use(authenticate, authorizeAdmin);
router.get('/dashboard', DashboardController);
router.get('/users', UserListController);
router.put('/users', EditUserSchema, EditUserController);

export default router;