import { Types } from 'mongoose';
import { AdminModel, UserModel, PromptModel } from '../model/index.js';
import MatchModel from '../model/matches/schema.js';
import SubscriptionModel from '../model/subscription/schema.js';
import ReportModel from '../model/chat/reportSchema.js';
import SendForgotPasswordEmailModel from '../model/admin/sendForgotPasswordEmail.js';
import ResetPasswordModel from '../model/admin/resetPassword.js';
import NoShowUsersListModel from '../model/admin/noShowUsersList.js';
import DashboardModel from '../model/admin/dashboard.js';
import {
  HashUtility,
  TokenUtility,
  ResponseUtility,
  SchemaMapperUtility,
} from '../utility/index.js';
import { RedisClient } from '../services/index.js';
import { PAGINATION_LIMIT, PROMPTS } from '../constants.js';

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
    const result = await DashboardModel();
    return res.json(result);
  } catch (err) {
    return res.status(err.httpStatus || 500).json(err.success !== undefined ? err : ResponseUtility.GENERIC_ERR({ error: err.message }));
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

export const UserDetailsController = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User ID is required' }));
    if (!Types.ObjectId.isValid(userId)) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Invalid User ID' }));

    const [userData] = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'reports',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$reportedUserId', '$$userId'] } } },
            { $lookup: { from: 'users', localField: 'reporterId', foreignField: '_id', as: 'reporter' } },
            { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                category: 1, subOption: 1, source: 1, createdOn: 1, status: 1, deleted: 1,
                reporter: {
                  _id: 1, firstName: 1, phoneNumber: 1, deleted: 1,
                },
              },
            },
            { $sort: { createdOn: -1 } },
          ],
          as: 'reports',
        },
      },
      {
        $lookup: {
          from: 'matches',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $or: [{ $eq: ['$user1Ref', '$$userId'] }, { $eq: ['$user2Ref', '$$userId'] }] },
                    { $eq: ['$deleted', false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1, user1Ref: 1, user2Ref: 1, status: 1, createdOn: 1, updatedOn: 1, datePlanned: 1, dateDetails: 1, source: 1,
              },
            },
            { $sort: { createdOn: -1 } },
          ],
          as: 'matches',
        },
      },
      { $lookup: { from: 'subscriptions', localField: '_id', foreignField: 'userRef', as: 'subscriptionData' } },
      {
        $addFields: {
          matchCount: { $size: '$matches' },
          currentSubscription: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$subscriptionData',
                  as: 'sub',
                  cond: { $and: [{ $eq: ['$$sub.deleted', false] }, { $gt: ['$$sub.expireDate', '$$NOW'] }] },
                },
              },
              0,
            ],
          },
          statusTag: {
            $cond: {
              if: { $eq: ['$deleted', true] },
              then: 'Deleted',
              else: {
                $cond: {
                  if: { $eq: ['$blocked', true] },
                  then: 'Blocked',
                  else: {
                    $cond: {
                      if: { $gt: [{ $size: { $ifNull: ['$reportedBy', []] } }, 0] },
                      then: 'Flagged',
                      else: { $cond: { if: { $eq: ['$verified', false] }, then: 'Pending Verification', else: 'Active' } },
                    },
                  },
                },
              },
            },
          },
          reportCount: { $size: { $ifNull: ['$reportedBy', []] } },
          photoCount: { $size: { $ifNull: ['$photos', []] } },
        },
      },
      {
        $project: {
          password: 0,
          fcmToken: 0,
          deviceToken: 0,
          socialId: 0,
          socialToken: 0,
          socialIdentifier: 0,
          changePassToken: 0,
          changePassTokenDate: 0,
          phoneToken: 0,
          phoneTokenDate: 0,
          phoneTokenExpiry: 0,
          subscriptionData: 0,
          phoneTokenRetries: 0,
          matchScore: 0,
          missedMatchCount: 0,
          sessionSwipeCount: 0,
          dailyMissedMatchShown: 0,
          inboundLikesLast7Days: 0,
          lastInboundLikesUpdate: 0,
          lastMissedMatchReset: 0,
          userSegment: 0,
        },
      },
    ]);

    if (!userData) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User not found' }));

    const prompts = await PromptModel.find({ userRef: userData._id, deleted: false })
      .select('promptId response order').sort({ order: 1 }).lean();

    userData.prompts = prompts.map((p) => ({
      promptId: p.promptId, promptText: PROMPTS[p.promptId] || null, response: p.response, order: p.order,
    }));

    return res.json(ResponseUtility.SUCCESS({ data: userData }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const BlockUserController = async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User ID is required' }));
    if (!Types.ObjectId.isValid(userId)) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Invalid User ID' }));
    if (!action || !['block', 'unblock'].includes(action)) {
      return res.json(ResponseUtility.GENERIC_ERR({ message: "Action must be either 'block' or 'unblock'" }));
    }

    const blockStatus = action === 'block';
    const user = await UserModel.findOneAndUpdate({ _id: userId }, { blocked: blockStatus }, { new: true });
    if (!user) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User not found' }));

    // Flag in Redis so an active session can be force-logged-out on its next request.
    await RedisClient.set(`user-status:${user._id}`, JSON.stringify({ blocked: blockStatus, forceLogout: blockStatus }));

    return res.json(ResponseUtility.SUCCESS({
      message: `User ${blockStatus ? 'blocked' : 'unblocked'} successfully`,
      data: { userId: user._id, blocked: user.blocked },
    }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const DeleteUserController = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User ID is required' }));
    if (!Types.ObjectId.isValid(userId)) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Invalid User ID' }));

    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      { deleted: true, deleteReason: 'Deleted by admin', deletedOn: new Date() },
      { new: true },
    );
    if (!user) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User not found' }));

    await RedisClient.set(`user-status:${user._id}`, JSON.stringify({ deleted: true, forceLogout: true }));

    return res.json(ResponseUtility.SUCCESS({
      message: 'User account deleted successfully',
      data: { userId: user._id, deleted: user.deleted },
    }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const GetVerificationDetailsController = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User ID is required.' }));
    if (!Types.ObjectId.isValid(userId)) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Invalid User ID.' }));

    const user = await UserModel.findOne(
      { _id: userId, deleted: false },
      {
        firstName: 1,
        phoneNumber: 1,
        phoneCode: 1,
        email: 1,
        age: 1,
        gender: 1,
        city: 1,
        state: 1,
        country: 1,
        photos: 1,
        verifiedByAdmin: 1,
        verificationImage: 1,
        verificationAttempts: 1,
        verificationReviewedBy: 1,
        verificationReviewedAt: 1,
        createdOn: 1,
      },
    );

    if (!user) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User not found.' }));

    return res.json(ResponseUtility.SUCCESS({ data: user }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ReviewVerificationController = async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;
    const { userId, action } = req.body;

    if (!userId) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User ID is required.' }));
    if (!Types.ObjectId.isValid(userId)) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Invalid User ID.' }));
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.json(ResponseUtility.GENERIC_ERR({ message: "Action must be either 'approve' or 'reject'." }));
    }

    const user = await UserModel.findOne({ _id: userId, deleted: false });
    if (!user) return res.json(ResponseUtility.GENERIC_ERR({ message: 'User not found.' }));

    if (!user.verificationImage?.url || user.verificationImage.status !== 'pending') {
      return res.json(ResponseUtility.GENERIC_ERR({ message: 'No pending verification found for this user.' }));
    }

    const updateData = {
      verificationReviewedBy: adminId,
      verificationReviewedAt: new Date(),
      verifiedByAdmin: action === 'approve',
      'verificationImage.status': action === 'approve' ? 'approved' : 'rejected',
    };

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false },
      { $set: updateData },
      { new: true },
    ).select('firstName verifiedByAdmin verificationImage');

    return res.json(ResponseUtility.SUCCESS({
      message: `Verification ${action}d successfully.`,
      data: {
        userId: updatedUser._id,
        userName: updatedUser.firstName,
        verifiedByAdmin: updatedUser.verifiedByAdmin,
        verificationStatus: updatedUser.verificationImage.status,
        verificationType: updatedUser.verificationImage.actionType,
      },
    }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ReportsController = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search = '', status = '', source = '', category = '', subOption = '',
    } = req.body;

    const matchQuery = { deleted: false };
    if (status) matchQuery.status = status;
    if (source) matchQuery.source = source;
    if (category) matchQuery.category = category;
    if (subOption) matchQuery.subOption = subOption;

    const pipeline = [
      { $match: matchQuery },
      { $lookup: { from: 'users', localField: 'reportedUserId', foreignField: '_id', as: 'reportedUser' } },
      { $unwind: { path: '$reportedUser', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'reporterId', foreignField: '_id', as: 'reporter' } },
      { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'reportedUser.firstName': new RegExp(search, 'i') },
            { 'reportedUser.phoneNumber': new RegExp(search, 'i') },
            { 'reporter.firstName': new RegExp(search, 'i') },
            { 'reporter.phoneNumber': new RegExp(search, 'i') },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { createdOn: -1 } },
      {
        $project: {
          category: 1,
          subOption: 1,
          source: 1,
          status: 1,
          deleted: 1,
          createdOn: 1,
          reportedUser: {
            _id: 1, firstName: 1, phoneNumber: 1, blocked: 1, deleted: 1, verifiedByAdmin: 1, profilePicture: { $arrayElemAt: ['$reportedUser.photos.url', 0] },
          },
          reporter: {
            _id: 1, firstName: 1, phoneNumber: 1, deleted: 1, verifiedByAdmin: 1, profilePicture: { $arrayElemAt: ['$reporter.photos.url', 0] },
          },
        },
      },
      {
        $facet: {
          list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
      { $unwind: { path: '$total', preserveNullAndEmptyArrays: true } },
    );

    const [data] = await ReportModel.aggregate(pipeline);
    const list = data?.list || [];
    const total = data?.total?.count || 0;

    return res.json(ResponseUtility.SUCCESS({
      data: {
        list, page: Number(page), limit: Number(limit), total, size: list.length, hasMore: list.length === Number(limit),
      },
    }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ReviewReportController = async (req, res) => {
  try {
    const { reportId } = req.body;
    if (!reportId) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Report ID is required' }));
    if (!Types.ObjectId.isValid(reportId)) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Invalid Report ID' }));

    const report = await ReportModel.findOne({ _id: reportId });
    if (!report) return res.json(ResponseUtility.GENERIC_ERR({ message: 'Report not found' }));

    if (report.status === 'reviewed' && report.deleted === true) {
      return res.json(ResponseUtility.GENERIC_ERR({ message: 'Report already reviewed' }));
    }

    report.status = 'reviewed';
    report.deleted = true;
    await report.save();

    return res.json(ResponseUtility.SUCCESS({
      message: 'Report marked as reviewed successfully',
      data: { reportId: report._id, status: report.status, deleted: report.deleted },
    }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const AdminLogoutController = async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;
    const { authorization } = req.headers;

    const admin = await AdminModel.findById(adminId);
    if (!admin) return res.status(404).json(ResponseUtility.GENERIC_ERR({ message: 'Admin not found' }));

    if (authorization) {
      const token = authorization.replace(/^Bearer\s+/i, '');
      const decoded = TokenUtility.decodeWithoutVerifying(token);
      const exp = decoded?.payload?.exp;

      if (exp) {
        const ttl = Math.max(exp - Math.floor(Date.now() / 1000), 0);
        await RedisClient.set(`blacklist:${token}`, 'true');
        if (ttl > 0) await RedisClient.expire(`blacklist:${token}`, ttl);
      }
    }

    return res.json(ResponseUtility.SUCCESS({ message: 'Admin logged out successfully.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const AdminSendForgotPasswordEmailController = async (req, res) => {
  try {
    const result = await SendForgotPasswordEmailModel(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(err.httpStatus || 500).json(err.success !== undefined ? err : ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const AdminResetPasswordController = async (req, res) => {
  try {
    const result = await ResetPasswordModel(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(err.httpStatus || 500).json(err.success !== undefined ? err : ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const NoShowUsersListController = async (req, res) => {
  try {
    const result = await NoShowUsersListModel(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(err.httpStatus || 500).json(err.success !== undefined ? err : ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

const sanitizeAdmin = (admin) => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  isSuperAdmin: admin.isSuperAdmin,
  createdAt: admin.createdAt,
});