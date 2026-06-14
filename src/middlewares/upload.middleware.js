const fs = require('fs');
const path = require('path');

const multer = require('multer');

const ApiError = require('../utils/ApiError');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'audio/mpeg',
  'audio/wav',
]);
const EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/zip': '.zip',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const sanitizeBaseName = (fileName) =>
  path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .toLowerCase();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const safeBaseName = sanitizeBaseName(file.originalname) || 'file';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    callback(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (_req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return callback(new ApiError(400, 'File type is not allowed'));
  }

  return callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

const handleUploadError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File size exceeds 10MB limit'));
    }

    return next(error);
  });
};

module.exports = {
  uploadSingleFile: handleUploadError(upload.single('file')),
};
