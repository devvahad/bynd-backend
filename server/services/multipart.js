import busboy from 'busboy';

const DEFAULT_LIMITS = {
  fileSize: 10 * 1024 * 1024,
  files: 10,
  fields: 50,
  fieldSize: 1 * 1024 * 1024,
};

function createUploadError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function createMultipartService(limits = {}) {
  const mergedLimits = { ...DEFAULT_LIMITS, ...limits };

  return function MultipartService(req, res, next) {
    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('multipart/form-data')) return next();

    let settled = false;
    const settle = (fn) => {
      if (settled) return;
      settled = true;
      fn();
    };

    let bb;
    try {
      bb = busboy({ headers: req.headers, limits: mergedLimits });
    } catch (error) {
      return next(createUploadError('Malformed multipart request.', 400));
    }

    const fields = {};
    const files = {};

    const fail = (error) => settle(() => next(error));

    bb.on('field', (name, value, info) => {
      if (info.nameTruncated || info.valueTruncated) {
        return fail(createUploadError(`Field "${name}" exceeds the maximum allowed size.`, 413));
      }
      fields[name] = value;
    });

    bb.on('file', (name, stream, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      let fileSizeExceeded = false;

      stream.on('data', (chunk) => chunks.push(chunk));

      stream.on('limit', () => {
        fileSizeExceeded = true;
        stream.resume();
      });

      stream.on('error', fail);

      stream.on('end', () => {
        if (fileSizeExceeded) {
          return fail(createUploadError(`File "${filename}" exceeds the maximum allowed size.`, 413));
        }

        const fileEntry = { buffer: Buffer.concat(chunks), filename, mimeType };
        if (files[name] !== undefined) {
          files[name] = Array.isArray(files[name]) ? [...files[name], fileEntry] : [files[name], fileEntry];
        } else {
          files[name] = fileEntry;
        }
      });
    });

    bb.on('filesLimit', () => fail(createUploadError('Too many files uploaded.', 413)));
    bb.on('fieldsLimit', () => fail(createUploadError('Too many fields submitted.', 413)));
    bb.on('partsLimit', () => fail(createUploadError('Too many parts in multipart payload.', 413)));
    bb.on('error', fail);

    bb.on('finish', () => {
      settle(() => {
        try {
          req.body = fields.data ? { ...JSON.parse(fields.data) } : {};
        } catch {
          return next(createUploadError('Invalid JSON in "data" field.', 400));
        }

        Object.keys(fields).forEach((key) => {
          if (key !== 'data') req.body[key] = fields[key];
        });

        const fileKeys = Object.keys(files);
        if (fileKeys.length === 1 && fileKeys[0] !== 'images') {
          req.body[fileKeys[0]] = files[fileKeys[0]];
        } else if (fileKeys.length) {
          req.body.images = fileKeys.flatMap((key) => (Array.isArray(files[key]) ? files[key] : [files[key]]));
        }

        req.files = files;
        next();
      });
    });

    req.on('aborted', () => fail(createUploadError('Request aborted by client.', 400)));

    req.pipe(bb);
  };
}

const MultipartService = createMultipartService();

export default MultipartService;