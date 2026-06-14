const express = require('express');

const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadSingleFile } = require('../middlewares/upload.middleware');

const router = express.Router();

router.post('/', authenticate, uploadSingleFile, uploadController.uploadFile);

module.exports = router;
