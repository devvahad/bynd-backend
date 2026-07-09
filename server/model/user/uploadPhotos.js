import { logger } from '../../services/logger.js';
import { randomUUID } from 'node:crypto';
import UserModel from './index.js';
import { ResponseUtility } from '../../utility/index.js';
import { MAX_PHOTOS, MIN_PHOTOS, MAX_PHOTO_SIZE_BYTES } from '../../constants.js';
import ImageUploadUtility, { IMAGE_VARIANTS } from '../../utility/imageUpload.js';
import S3Services from '../../services/s3.js';

const detectImageType = (buffer) => {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  return null;
};

export default async ({ id, photo, action = 'upload', photoUrl, photoOrder }) => {
  try {
    if (!id) {
      throw ResponseUtility.GENERIC_ERR({ message: 'User ID missing from authentication context.' });
    }

    const user = await UserModel.findOne({ _id: id, deleted: false });
    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
    }

    const currentPhotos = user.photos || [];

    switch (action) {
      case 'upload': {
        const photoBuffer = Buffer.isBuffer(photo) ? photo : photo?.data;
        if (!Buffer.isBuffer(photoBuffer) || photoBuffer.length === 0) {
          throw ResponseUtility.MISSING_PROPS({ message: 'Photo is required for upload.' });
        }

        if (photoBuffer.length > MAX_PHOTO_SIZE_BYTES) {
          throw ResponseUtility.GENERIC_ERR({ message: 'Photo exceeds maximum allowed size of 8MB.' });
        }

        const imageType = detectImageType(photoBuffer);
        if (!imageType) {
          throw ResponseUtility.GENERIC_ERR({ message: 'Unsupported image format. Use PNG, JPG, or WEBP.' });
        }

        if (currentPhotos.length >= MAX_PHOTOS) {
          throw ResponseUtility.GENERIC_ERR({ message: `Maximum ${MAX_PHOTOS} photos allowed.` });
        }

        const fileName = `user_${id}_${randomUUID()}.${imageType}`;
        const uploadResult = await ImageUploadUtility(fileName, photoBuffer);
        if (!uploadResult?.success) {
          throw ResponseUtility.GENERIC_ERR({ message: 'Failed to upload image.' });
        }

        const newPhoto = { url: fileName, order: currentPhotos.length, uploadedAt: new Date() };

        const updatedUser = await UserModel.findOneAndUpdate(
          {
            _id: id,
            deleted: false,
            $expr: { $lt: [{ $size: { $ifNull: ['$photos', []] } }, MAX_PHOTOS] },
          },
          {
            $push: { photos: newPhoto },
            $set: { photosSkipped: false, lastUpdatedAt: new Date() },
          },
          { new: true },
        ).select('photos photosSkipped');

        if (!updatedUser) {
          throw ResponseUtility.GENERIC_ERR({ message: `Maximum ${MAX_PHOTOS} photos allowed.` });
        }

        return ResponseUtility.SUCCESS({
          message: 'Photo uploaded successfully.',
          data: {
            photos: updatedUser.photos,
            totalPhotos: updatedUser.photos.length,
            canProceed: updatedUser.photos.length >= MIN_PHOTOS,
          },
        });
      }

      case 'reorder': {
        if (!Array.isArray(photoOrder)) {
          throw ResponseUtility.MISSING_PROPS({ message: 'Photo order array is required for reordering.' });
        }

        const existingUrlSet = new Set(currentPhotos.map((p) => p.url));
        const photoOrderSet = new Set(photoOrder);

        const isValid =
          photoOrder.length === currentPhotos.length &&
          photoOrderSet.size === photoOrder.length &&
          photoOrder.every((url) => existingUrlSet.has(url));

        if (!isValid) {
          throw ResponseUtility.GENERIC_ERR({
            message: 'Invalid photo order. Must contain each existing photo URL exactly once.',
          });
        }

        const photosByUrl = new Map(currentPhotos.map((p) => [p.url, p]));
        const reordered = photoOrder.map((url, index) => ({
          url,
          order: index,
          uploadedAt: photosByUrl.get(url).uploadedAt,
        }));

        const updatedUser = await UserModel.findOneAndUpdate(
          { _id: id, deleted: false, __v: user.__v },
          { $set: { photos: reordered, lastUpdatedAt: new Date() }, $inc: { __v: 1 } },
          { new: true },
        ).select('photos');

        if (!updatedUser) {
          throw ResponseUtility.GENERIC_ERR({ message: 'Photos were updated by another request. Please retry.' });
        }

        return ResponseUtility.SUCCESS({
          message: 'Photos reordered successfully.',
          data: { photos: updatedUser.photos, totalPhotos: updatedUser.photos.length },
        });
      }

      case 'remove': {
        if (!photoUrl) {
          throw ResponseUtility.MISSING_PROPS({ message: 'Photo URL is required for removal.' });
        }

        if (!currentPhotos.some((p) => p.url === photoUrl)) {
          throw ResponseUtility.GENERIC_ERR({ message: 'Photo not found.' });
        }

        const remaining = currentPhotos
          .filter((p) => p.url !== photoUrl)
          .map((p, i) => ({ url: p.url, order: i, uploadedAt: p.uploadedAt }));

        const updatedUser = await UserModel.findOneAndUpdate(
          { _id: id, deleted: false, __v: user.__v },
          { $set: { photos: remaining, lastUpdatedAt: new Date() }, $inc: { __v: 1 } },
          { new: true },
        ).select('photos');

        if (!updatedUser) {
          throw ResponseUtility.GENERIC_ERR({ message: 'Photos were updated by another request. Please retry.' });
        }

        const deleteResults = await Promise.allSettled(
          IMAGE_VARIANTS.map(({ bucket }) => S3Services.removeFile({ Bucket: bucket, Key: photoUrl }))
        );
        deleteResults.forEach((result, i) => {
          if (result.status === 'rejected') {
            logger.error({ message: 'S3 photo deletion failed', key: photoUrl, bucket: IMAGE_VARIANTS[i].bucket, reason: result.reason });
          }
        });

        return ResponseUtility.SUCCESS({
          message: 'Photo removed successfully.',
          data: {
            photos: updatedUser.photos,
            totalPhotos: updatedUser.photos.length,
            canProceed: updatedUser.photos.length >= MIN_PHOTOS,
          },
        });
      }

      case 'get': {
        return ResponseUtility.SUCCESS({
          data: {
            photos: currentPhotos,
            totalPhotos: currentPhotos.length,
            photosSkipped: user.photosSkipped || false,
            canProceed: currentPhotos.length >= MIN_PHOTOS,
          },
        });
      }

      case 'validate': {
        if (currentPhotos.length < MIN_PHOTOS) {
          throw ResponseUtility.GENERIC_ERR({
            message: `Minimum ${MIN_PHOTOS} photos required.`,
            code: 'MIN_PHOTOS_REQUIRED',
          });
        }
        return ResponseUtility.SUCCESS({
          message: 'Photos validated successfully. You can proceed.',
          data: { canProceed: true, totalPhotos: currentPhotos.length },
        });
      }

      default:
        throw ResponseUtility.GENERIC_ERR({
          message: "Invalid action. Use 'upload', 'reorder', 'remove', 'get', or 'validate'.",
        });
    }
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logger.error('PhotoManagementService:', err);
    throw ResponseUtility.GENERIC_ERR({ message: 'Something went wrong. Please try again.' });
  }
};