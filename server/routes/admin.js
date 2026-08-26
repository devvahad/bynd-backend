import { Router } from 'express';
import {
    AdminLoginController,
    AdminSignupController,
    DashboardController,
    UserListController,
    EditUserController,
    UserDetailsController,
    BlockUserController,
    DeleteUserController,
    GetVerificationDetailsController,
    ReviewVerificationController,
    ReportsController,
    ReviewReportController,
    AdminLogoutController,
    AdminSendForgotPasswordEmailController,
    AdminResetPasswordController,
    NoShowUsersListController,
} from '../controllers/admin.js';
import { authenticate, authorizeAdmin } from '../controllers/authentication.js';
import {
    AdminLoginSchema, AdminSignupSchema, EditUserSchema,
    AdminUserDetailsSchema, AdminBlockUserSchema, AdminDeleteUserSchema,
    AdminGetVerificationDetailsSchema, AdminReviewVerificationSchema,
    AdminReportsSchema, AdminReviewReportSchema,
    AdminSendForgotPasswordEmailSchema, AdminResetPasswordSchema, NoShowUsersListSchema,
} from '../schemas/index.js';

const router = Router();

router.post('/login', AdminLoginSchema, AdminLoginController);
router.post('/signup', AdminSignupSchema, AdminSignupController);
router.post('/forgot-password', AdminSendForgotPasswordEmailSchema, AdminSendForgotPasswordEmailController);
router.post('/reset-password', AdminResetPasswordSchema, AdminResetPasswordController);

router.use(authenticate, authorizeAdmin);
router.get('/dashboard', DashboardController);
router.get('/users', UserListController);
router.put('/users', EditUserSchema, EditUserController);
router.post('/logout', AdminLogoutController);
router.post('/user-details', AdminUserDetailsSchema, UserDetailsController);
router.post('/block-user', AdminBlockUserSchema, BlockUserController);
router.post('/delete-user', AdminDeleteUserSchema, DeleteUserController);
router.post('/verification/details', AdminGetVerificationDetailsSchema, GetVerificationDetailsController);
router.post('/verification/review', AdminReviewVerificationSchema, ReviewVerificationController);
router.post('/reports', AdminReportsSchema, ReportsController);
router.post('/reports/review', AdminReviewReportSchema, ReviewReportController);
router.post('/no-show-users', NoShowUsersListSchema, NoShowUsersListController);

export default router;