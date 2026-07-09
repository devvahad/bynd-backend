import { UserModel } from '../../model/index.js';
import { ResponseUtility, RandomCodeUtility, ImageUploadUtility } from '../../utility/index.js';

const PictureResolver = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const rawFile = req.files?.picture;
    if (!rawFile) {
      return res.json(
        ResponseUtility.MISSING_PROPS({ message: 'No picture file provided.' }),
      );
    }

    const imageBuffer = Buffer.isBuffer(rawFile) ? rawFile : rawFile.data;
    if (!imageBuffer) {
      return res.json(
        ResponseUtility.MISSING_PROPS({ message: 'Invalid picture file provided.' }),
      );
    }

    const imageName = `profile-${userId}-${Date.now()}-${RandomCodeUtility(4)}`;
    const result = await ImageUploadUtility(imageName, imageBuffer);

    if (!result.success) {
      return res.json(
        ResponseUtility.GENERIC_ERR({ message: 'Failed to upload picture. Please try again.' }),
      );
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { picture: imageName },
      { new: true },
    ).select('-password -verificationCode -verificationCodeExpiry -passwordResetCode -passwordResetExpiry');

    if (!user) {
      return res.json(ResponseUtility.NO_USER());
    }

    return res.json(ResponseUtility.SUCCESS({ data: user }));
  } catch (err) {
    return res.json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export default PictureResolver;