import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import { ResponseUtility } from '../utility/index.js';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, AWS_REGION } = process.env;

const s3 = new S3Client({
  region: AWS_REGION || 'us-east-1',
  maxAttempts: 3,
  credentials:
    AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
      ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
      : undefined,
});

function assertRequired(props) {
  const missing = Object.entries(props)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);
  if (missing.length) {
    throw ResponseUtility.MISSING_PROPS({ message: `Missing required props: ${missing.join(', ')}.` });
  }
}

function wrapError(message, err) {
  if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
    return ResponseUtility.GENERIC_ERR({ message: `${message} File not found.`, error: err, code: 'NOT_FOUND' });
  }
  return ResponseUtility.GENERIC_ERR({ message, error: err });
}


const S3Services = {
  async uploadToBucket({ Bucket = S3_BUCKET, data, Key, mime }) {
    assertRequired({ Bucket, data, Key });

    const upload = new Upload({
      client: s3,
      params: { Bucket, Key, Body: data, ...(mime && { ContentType: mime }) },
    });

    try {
      const result = await upload.done();
      return ResponseUtility.SUCCESS({ data: result });
    } catch (err) {
      await upload.abort().catch(() => { });
      throw wrapError('Error uploading file.', err);
    }
  },

  async uploadPublicObject({ Bucket = S3_BUCKET, data, Key, mime, acl }) {
    assertRequired({ Bucket, data, Key });

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key,
          Body: data,
          ContentType: mime,
          ...(acl && { ACL: acl }),
        })
      );
      return ResponseUtility.SUCCESS();
    } catch (err) {
      throw wrapError('Error uploading public file.', err);
    }
  },

  async uploadLocalFile({ Key, Bucket = S3_BUCKET, localPath, mime }) {
    assertRequired({ Key, Bucket, localPath });

    try {
      const Body = await fs.readFile(localPath);
      await s3.send(new PutObjectCommand({ Bucket, Key, Body, ...(mime && { ContentType: mime }) }));
      return ResponseUtility.SUCCESS();
    } catch (err) {
      throw wrapError('Error uploading local file.', err);
    }
  },

  async findFile({ Bucket = S3_BUCKET, Key, asBuffer = false }) {
    assertRequired({ Bucket, Key });

    try {
      const result = await s3.send(new GetObjectCommand({ Bucket, Key }));
      if (asBuffer && result.Body) {
        const bytes = await result.Body.transformToByteArray();
        return ResponseUtility.SUCCESS({ data: { ...result, Body: Buffer.from(bytes) } });
      }
      return ResponseUtility.SUCCESS({ data: result });
    } catch (err) {
      throw wrapError('Error fetching file.', err);
    }
  },

  async fileExists({ Bucket = S3_BUCKET, Key }) {
    assertRequired({ Bucket, Key });

    try {
      await s3.send(new HeadObjectCommand({ Bucket, Key }));
      return ResponseUtility.SUCCESS({ data: true });
    } catch (err) {
      if (err?.$metadata?.httpStatusCode === 404) {
        return ResponseUtility.SUCCESS({ data: false });
      }
      throw wrapError('Error checking file existence.', err);
    }
  },

  async removeFile({ Bucket = S3_BUCKET, Key }) {
    assertRequired({ Bucket, Key });

    try {
      await s3.send(new DeleteObjectCommand({ Bucket, Key }));
      return ResponseUtility.SUCCESS();
    } catch (err) {
      throw wrapError('Error deleting file.', err);
    }
  },

  async listBucketContent({ Bucket = S3_BUCKET, Folder, maxKeys = 1000 }) {
    assertRequired({ Bucket, Folder });

    try {
      const prefix = `${Folder}/`;
      const files = [];
      let continuationToken;

      do {
        const result = await s3.send(
          new ListObjectsV2Command({
            Bucket,
            Prefix: prefix,
            MaxKeys: maxKeys,
            ContinuationToken: continuationToken,
          })
        );

        (result.Contents ?? []).filter((o) => o.Key !== prefix).forEach((o) => files.push(o.Key));
        continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
      } while (continuationToken);

      return ResponseUtility.SUCCESS({ data: files });
    } catch (err) {
      throw wrapError('Error listing bucket content.', err);
    }
  },

  async getPresignedUrl({ Bucket = S3_BUCKET, Key, expiresInSeconds = 3600, operation = 'get' }) {
    assertRequired({ Bucket, Key });

    try {
      const command =
        operation === 'put'
          ? new PutObjectCommand({ Bucket, Key })
          : new GetObjectCommand({ Bucket, Key });

      const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
      return ResponseUtility.SUCCESS({ data: { url } });
    } catch (err) {
      throw wrapError('Error generating presigned URL.', err);
    }
  },

  S3: s3,
};

export default S3Services;