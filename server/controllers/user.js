import { UserModel } from '../model/index.js';
import {
  HashUtility,
  TokenUtility,
  ResponseUtility,
  RandomCodeUtility,
  SchemaMapperUtility,
  TimeConversionUtility,
} from '../utility/index.js';
import { TemplateMailServices } from '../services/index.js';

const TOKEN_ROLE = 'user';

export const SignupController = async (req, res) => {
  try {
    const { name, email, password, phone, deviceToken, deviceType } = req.body;

    const existing = await UserModel.findOne({ email, isDeleted: false });
    if (existing) return res.json(ResponseUtility.EMAIL_ALREADY_TAKEN());

    const hashedPassword = await HashUtility.generate({ text: password });
    const verificationCode = RandomCodeUtility(6);
    const verificationCodeExpiry = Date.now() + TimeConversionUtility.hoursToMillis(24);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      deviceToken,
      deviceType,
      verificationCode,
      verificationCodeExpiry,
    });

    await TemplateMailServices.NewAccountMail({ to: email, name, verificationCode });

    const token = TokenUtility.generateToken({ _id: user._id, email, role: TOKEN_ROLE });
    return res.json(ResponseUtility.SUCCESS({ data: { token, user: sanitize(user) } }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const LoginController = async (req, res) => {
  try {
    const { email, password, deviceToken, deviceType } = req.body;

    const user = await UserModel.findOne({ email, isDeleted: false });
    if (!user) return res.json(ResponseUtility.NO_USER());

    const match = await HashUtility.compare({ hash: user.password, text: password });
    if (!match) return res.json(ResponseUtility.LOGIN_AUTH_FAILED());

    if (deviceToken) {
      await UserModel.findByIdAndUpdate(user._id, { deviceToken, deviceType });
    }

    const token = TokenUtility.generateToken({ _id: user._id, email, role: TOKEN_ROLE });
    return res.json(ResponseUtility.SUCCESS({ data: { token, user: sanitize(user) } }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const VerifyEmailController = async (req, res) => {
  try {
    const { email, code } = req.params;
    const user = await UserModel.findOne({ email, isDeleted: false });
    if (!user) return res.json(ResponseUtility.NO_USER());
    if (user.isVerified) return res.json(ResponseUtility.EMAIL_ALREADY_VERIFIED);
    if (Date.now() > user.verificationCodeExpiry) return res.json(ResponseUtility.TOKEN_EXPIRED);
    if (user.verificationCode !== Number(code)) return res.json(ResponseUtility.INVALID_VERIFICATION_CODE);

    await UserModel.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    });
    return res.json(ResponseUtility.SUCCESS({ message: 'Email verified successfully.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ResendVerificationController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email, isDeleted: false });
    if (!user) return res.json(ResponseUtility.NO_USER());
    if (user.isVerified) return res.json(ResponseUtility.EMAIL_ALREADY_VERIFIED);

    const verificationCode = RandomCodeUtility(6);
    const verificationCodeExpiry = Date.now() + TimeConversionUtility.hoursToMillis(24);
    await UserModel.findByIdAndUpdate(user._id, { verificationCode, verificationCodeExpiry });
    await TemplateMailServices.VerificationToken({ to: email, name: user.name, code: verificationCode });

    return res.json(ResponseUtility.SUCCESS({ message: 'Verification email resent.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ForgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email, isDeleted: false });
    if (!user) return res.json(ResponseUtility.NO_USER());

    const code = RandomCodeUtility(6);
    const expiry = Date.now() + TimeConversionUtility.hoursToMillis(1);
    await UserModel.findByIdAndUpdate(user._id, { passwordResetCode: code, passwordResetExpiry: expiry });
    await TemplateMailServices.ChangePasswordToken({ to: email, name: user.name, code });

    return res.json(ResponseUtility.SUCCESS({ message: 'Password reset code sent to your email.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ResetPasswordController = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await UserModel.findOne({ email, isDeleted: false });
    if (!user) return res.json(ResponseUtility.NO_USER());
    if (Date.now() > user.passwordResetExpiry) return res.json(ResponseUtility.TOKEN_EXPIRED);
    if (user.passwordResetCode !== Number(code)) return res.json(ResponseUtility.TOKEN_NOT_VERIFIED);

    const password = await HashUtility.generate({ text: newPassword });
    await UserModel.findByIdAndUpdate(user._id, {
      password,
      passwordResetCode: null,
      passwordResetExpiry: null,
    });
    return res.json(ResponseUtility.SUCCESS({ message: 'Password reset successfully.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const UpdatePasswordController = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.json(ResponseUtility.NO_USER());

    const match = await HashUtility.compare({ hash: user.password, text: oldPassword });
    if (!match) return res.json(ResponseUtility.LOGIN_AUTH_FAILED({ message: 'Current password is incorrect.' }));

    const password = await HashUtility.generate({ text: newPassword });
    await UserModel.findByIdAndUpdate(user._id, { password });
    return res.json(ResponseUtility.SUCCESS({ message: 'Password updated.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const UserDetailsController = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select('-password -verificationCode -passwordResetCode');
    if (!user) return res.json(ResponseUtility.NO_USER());
    return res.json(ResponseUtility.SUCCESS({ data: user }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const UpdateUserController = async (req, res) => {
  try {
    const updates = await SchemaMapperUtility(req.body);
    const user = await UserModel.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password -verificationCode -passwordResetCode');
    return res.json(ResponseUtility.SUCCESS({ data: user }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ContactAdminController = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const user = await UserModel.findById(req.user._id);
    return res.json(ResponseUtility.SUCCESS({ message: 'Your message has been sent.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  isVerified: user.isVerified,
  profilePicture: user.profilePicture,
  role: user.role,
  createdAt: user.createdAt,
});