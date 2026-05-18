import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import ResponseUtility from '../utility/response.js';

const { AWS_ACCESSID, AWS_SECRET, S3_BUCKET, AWS_REGION } = process.env;

const s3 = new S3Client({
  region: AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: AWS_ACCESSID,
    secretAccessKey: AWS_SECRET,
  },
});

const S3Services = {

  uploadToBucket: ({ Bucket = S3_BUCKET, data, Key }) =>
    new Promise(async (resolve, reject) => {
      if (!Bucket || !data || !Key) return reject(ResponseUtility.MISSING_PROPS());
      try {
        const upload = new Upload({
          client: s3,
          params: { Bucket, Key, Body: data },
        });
        const result = await upload.done();
        return resolve(ResponseUtility.SUCCESS({ data: result }));
      } catch (err) {
        return reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading file.', error: err }));
      }
    }),

  uploadPublicObject: ({ Bucket = S3_BUCKET, data, Key, mime }) =>
    new Promise(async (resolve, reject) => {
      if (!Bucket || !data || !Key) return reject(ResponseUtility.MISSING_PROPS());
      try {
        await s3.send(new PutObjectCommand({
          ACL: 'public-read',
          Bucket,
          Key,
          Body: data,
          ContentType: mime,
        }));
        return resolve(ResponseUtility.SUCCESS());
      } catch (err) {
        return reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading public file.', error: err }));
      }
    }),

  uploadLocalFile: ({ Key, Bucket = S3_BUCKET, localPath }) =>
    new Promise(async (resolve, reject) => {
      try {
        const Body = fs.readFileSync(path.resolve(localPath, Key));
        await s3.send(new PutObjectCommand({ Bucket, Key, Body }));
        return resolve(ResponseUtility.SUCCESS());
      } catch (err) {
        return reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading local file.', error: err }));
      }
    }),

  findFile: ({ Bucket = S3_BUCKET, Key }) =>
    new Promise(async (resolve, reject) => {
      try {
        const result = await s3.send(new GetObjectCommand({ Bucket, Key }));
        return resolve(ResponseUtility.SUCCESS({ data: result }));
      } catch (err) {
        return reject(ResponseUtility.GENERIC_ERR({ message: 'Error fetching file.', error: err }));
      }
    }),

  removeFile: ({ Bucket = S3_BUCKET, Key }) =>
    new Promise(async (resolve, reject) => {
      if (!Bucket || !Key) return reject(ResponseUtility.MISSING_PROPS());
      try {
        await s3.send(new DeleteObjectCommand({ Bucket, Key }));
        return resolve(ResponseUtility.SUCCESS());
      } catch (err) {
        return reject(ResponseUtility.GENERIC_ERR({ message: 'Error deleting file.', error: err }));
      }
    }),

  listBucketContent: ({ Bucket = S3_BUCKET, Folder }) =>
    new Promise(async (resolve, reject) => {
      try {
        const result = await s3.send(
          new ListObjectsV2Command({ Bucket, Prefix: `${Folder}/` }),
        );
        const files = (result.Contents ?? [])
          .filter((o) => o.Key !== `${Folder}/`)
          .map((o) => o.Key);
        return resolve(ResponseUtility.SUCCESS({ data: files }));
      } catch (err) {
        return reject(ResponseUtility.GENERIC_ERR({ message: 'Error listing bucket content.', error: err }));
      }
    }),

  S3: s3,
};

export default S3Services;