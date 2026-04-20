const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');

router.get('/', async (req, res) => {
  try {
    const results = await Analysis.find().sort({ createdAt: -1 }).limit(20);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;