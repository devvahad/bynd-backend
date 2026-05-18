import busboy from 'busboy';

const MultipartService = (req, res, next) => {
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('multipart/form-data')) return next();

  const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
  const fields = {};
  const files = {};

  bb.on('file', (name, stream) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => { files[name] = Buffer.concat(chunks); });
  });

  bb.on('field', (name, value) => { fields[name] = value; });

  bb.on('finish', () => {
    try {
      req.body = fields.data ? { ...JSON.parse(fields.data) } : {};
      Object.keys(fields).forEach((k) => {
        if (k !== 'data') req.body[k] = fields[k];
      });
    } catch {
      req.body = fields;
    }

    if (Object.keys(files).length) {
      const fileKeys = Object.keys(files);
      if (fileKeys.length === 1 && fileKeys[0] !== 'images') {
        req.body[fileKeys[0]] = files[fileKeys[0]];
      } else {
        req.body.images = fileKeys.map((k) => files[k]);
      }
    }

    req.files = files;
    next();
  });

  bb.on('error', (err) => next(err));
  req.pipe(bb);
};

export default MultipartService;