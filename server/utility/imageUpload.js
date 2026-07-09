import sharp from 'sharp';
import S3Services from '../services/s3.js';
import { logger } from '../services/logger.js';
import { S3_IMAGES, IMAGE_MIN_DIMENSION, IMAGE_MAX_DIMENSION, IMAGE_MAX_INPUT_BYTES, IMAGE_ALLOWED_FORMATS } from '../constants.js';

const VARIANTS = [
  { key: 'small', bucket: S3_IMAGES.SMALL, width: 500 },
  { key: 'medium', bucket: S3_IMAGES.AVERAGE, width: 1000 },
  { key: 'original', bucket: S3_IMAGES.BEST, width: null },
];

class ImageUploadError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ImageUploadError';
    if (cause) this.cause = cause;
  }
}

const toBuffer = (image) => {
  if (Buffer.isBuffer(image)) return image;
  if (image?.data) return Buffer.from(image.data);
  throw new ImageUploadError('image must be a Buffer or an object with a data property');
};

const validateImage = async (buffer) => {
  if (buffer.byteLength === 0) {
    throw new ImageUploadError('Image buffer is empty');
  }
  if (buffer.byteLength > IMAGE_MAX_INPUT_BYTES) {
    throw new ImageUploadError(`Image exceeds maximum size of ${IMAGE_MAX_INPUT_BYTES} bytes`);
  }

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (error) {
    throw new ImageUploadError('Image data is not a valid or supported image', error);
  }

  const { format, width, height } = metadata;
  if (!format || !IMAGE_ALLOWED_FORMATS.has(format)) {
    throw new ImageUploadError(`Unsupported image format: ${format ?? 'unknown'}`);
  }
  if (!width || !height) {
    throw new ImageUploadError('Image is missing valid dimensions');
  }
  if (width < IMAGE_MIN_DIMENSION || height < IMAGE_MIN_DIMENSION) {
    throw new ImageUploadError(`Image dimensions must be at least ${IMAGE_MIN_DIMENSION}px`);
  }
  if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
    throw new ImageUploadError(`Image dimensions must not exceed ${IMAGE_MAX_DIMENSION}px`);
  }

  return metadata;
};

const renderVariant = (buffer, width) => {
  const pipeline = sharp(buffer);
  if (width) {
    pipeline.resize({ width, withoutEnlargement: true });
  }
  return pipeline.png({ compressionLevel: 6 }).toBuffer();
};

const rollback = async (uploaded) => {
  const results = await Promise.allSettled(
    uploaded.map(({ bucket, key }) => S3Services.removeFile({ Bucket: bucket, Key: key }))
  );
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      logger.error({ message: 'S3 rollback failed', key: uploaded[i].key, bucket: uploaded[i].bucket, reason: result.reason });
    }
  });
};

const ImageUploadUtility = async (name, image) => {
  if (typeof name !== 'string' || name.length === 0) {
    throw new ImageUploadError('name must be a non-empty string');
  }

  const inputBuffer = toBuffer(image);
  await validateImage(inputBuffer);

  const renderedBuffers = await Promise.all(
    VARIANTS.map((variant) => renderVariant(inputBuffer, variant.width))
  );

  const uploaded = [];
  try {
    for (let i = 0; i < VARIANTS.length; i += 1) {
      const { bucket } = VARIANTS[i];
      await S3Services.uploadPublicObject({
        Bucket: bucket,
        Key: name,
        data: renderedBuffers[i],
        mime: 'image/png',
      });
      uploaded.push({ bucket, key: name });
    }
  } catch (error) {
    await rollback(uploaded);
    throw new ImageUploadError('Image upload failed, rolled back partial uploads', error);
  }

  return {
    success: true,
    variants: VARIANTS.map((v) => v.key),
  };
};

export default ImageUploadUtility;
export { ImageUploadError, VARIANTS as IMAGE_VARIANTS };