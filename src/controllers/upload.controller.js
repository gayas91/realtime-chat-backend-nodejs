const uploadService = require('../services/upload.service');
const asyncHandler = require('../utils/asyncHandler');

const uploadFile = asyncHandler(async (req, res) => {
  const file = uploadService.getFileMetadata(req.file);

  res.status(201).json({
    success: true,
    data: {
      file,
    },
  });
});

module.exports = {
  uploadFile,
};
