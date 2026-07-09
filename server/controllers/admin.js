import { AdminModel, UserModel } from '../model/index.js';
import {
  HashUtility,
  TokenUtility,
  ResponseUtility,
  SchemaMapperUtility,
} from '../utility/index.js';
import { PAGINATION_LIMIT } from '../constants.js';

export const AdminLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await AdminModel.findOne({ email, isDeleted: false });
    if (!admin) return res.json(ResponseUtility.NO_USER({ message: 'Admin not found.' }));

    const match = await HashUtility.compare({ hash: admin.password, text: password });
    if (!match) return res.json(ResponseUtility.LOGIN_AUTH_FAILED());

    await AdminModel.findByIdAndUpdate(admin._id, { lastLogin: new Date() });
    const token = TokenUtility.generateToken({ _id: admin._id, email, role: 'admin' });
    return res.json(ResponseUtility.SUCCESS({ data: { token, admin: sanitizeAdmin(admin) } }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};


export const AdminSignupController = async (req, res) => {
  try {
    const { name, email, password, isSuperAdmin } = req.body;
    const existingAdminCount = await AdminModel.countDocuments({});

    if (existingAdminCount > 0) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN());
      }
      const token = authHeader.slice(7);
      const decoded = TokenUtility.verifyTokenSafe(token);
      if (!decoded) {
        return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN());
      }
      if (decoded.data?.role !== 'admin') {
        return res.status(403).json(ResponseUtility.GENERIC_ERR({ code: 403, message: 'Forbidden.' }));
      }
      const admin = await AdminModel.findOne({ _id: decoded.data._id || decoded.data.id }).select('isActive isDeleted');
      if (!admin || !admin.isActive || admin.isDeleted) {
        return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN());
      }
    }

    const existing = await AdminModel.findOne({ email });
    if (existing) return res.json(ResponseUtility.EMAIL_ALREADY_TAKEN());

    const hashed = await HashUtility.generate({ text: password });
    const admin = await AdminModel.create({ name, email, password: hashed, isSuperAdmin });
    const token = TokenUtility.generateToken({ _id: admin._id, email, role: 'admin' });
    return res.json(ResponseUtility.SUCCESS({ data: { token, admin: sanitizeAdmin(admin) } }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};


export const DashboardController = async (_req, res) => {
  try {
    const [totalUsers, verifiedUsers, activeUsers] = await Promise.all([
      // UserModel.countDocuments({ isDeleted: false }),
      // UserModel.countDocuments({ isDeleted: false, isVerified: true }),
      // UserModel.countDocuments({ isDeleted: false, isActive: true }),
      UserModel.countDocuments({ deleted: false }),
      UserModel.countDocuments({ deleted: false, isVerified: true }),
      UserModel.countDocuments({ deleted: false, isActive: true }),
    ]);
    return res.json(ResponseUtility.SUCCESS({ data: { totalUsers, verifiedUsers, activeUsers } }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const UserListController = async (req, res) => {
  try {
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? String(PAGINATION_LIMIT), 10);
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const query = { isDeleted: false };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await UserModel.find(query)
      .select('-password -verificationCode -passwordResetCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);

    return res.json(ResponseUtility.SUCCESS_PAGINATION({ data: users, page, limit }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const EditUserController = async (req, res) => {
  try {
    const { userId, ...updates } = req.body;
    const mapped = await SchemaMapperUtility(updates);
    const user = await UserModel.findByIdAndUpdate(userId, mapped, { new: true })
      .select('-password -verificationCode -passwordResetCode');
    if (!user) return res.json(ResponseUtility.NO_USER());
    return res.json(ResponseUtility.SUCCESS({ data: user }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

const sanitizeAdmin = (admin) => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  isSuperAdmin: admin.isSuperAdmin,
  createdAt: admin.createdAt,
});