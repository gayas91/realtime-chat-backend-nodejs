const express = require('express');
const authRoutes = require('./auth.routes');
const conversationRoutes = require('./conversation.routes');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use(healthRoutes);

module.exports = router;
