const express = require('express');
const router = express.Router();
const { analyzeResume } = require('../services/aiService');
const Analysis = require('../models/Analysis');

router.post('/', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription)
      return res.status(400).json({ error: 'Resume and job description required' });

    const aiResult = await analyzeResume(resumeText, jobDescription);
    const analysis = new Analysis({ resumeText, jobDescription, ...aiResult });
    await analysis.save();

    res.json(analysis);
  } catch (err) {
    console.error('❌ Analysis Error:', err.message);
    const status = err.message.includes('not configured') || err.message.includes('Invalid') ? 400 : 500;
    res.status(status).json({ 
      error: err.message || 'Analysis failed. Please try again.'
    });
  }
});

module.exports = router;