const express = require('express');

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(authValidator.registerSchema), authController.register);
router.post('/login', validate(authValidator.loginSchema), authController.login);
router.post(
  '/refresh-token',
  validate(authValidator.refreshTokenSchema),
  authController.refreshToken
);
router.post('/logout', validate(authValidator.logoutSchema), authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
