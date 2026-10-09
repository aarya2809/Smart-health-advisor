const express = require('express');
const router = express.Router();
const { generateChatResponse } = require('../controllers/aiController');
const protect = require('../middleware/authMiddleware');

router.post('/chat', protect, generateChatResponse);

module.exports = router;
