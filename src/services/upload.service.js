const path = require('path');

const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const getFileUrl = (fileName) => `${config.appBaseUrl.replace(/\/$/, '')}/uploads/${fileName}`;

const getFileMetadata = (file) => {
  if (!file) {
    throw new ApiError(400, 'File is required');
  }

  return {
    url: getFileUrl(file.filename),
    fileName: file.filename,
    originalName: path.basename(file.originalname),
    mimeType: file.mimetype,
    size: file.size,
  };
};

const getMessageTypeFromMimeType = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  return 'file';
};

module.exports = {
  getFileMetadata,
  getMessageTypeFromMimeType,
};
