const express = require('express');
const router = express.Router();
const { analyzeThread } = require('../services/aiService');
const Analysis = require('../models/Analysis');

router.post('/', async (req, res) => {
  try {
    const { threadText } = req.body;
    const aiResult = await analyzeThread(threadText);
    
    const analysis = new Analysis({ threadText, ...aiResult });
    await analysis.save();
    
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;