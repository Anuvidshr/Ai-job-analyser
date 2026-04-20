const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  resumeText: String,
  jobDescription: String,
  matchScore: Number,
  strengths: [String],
  gaps: [String],
  suggestions: [String],
  keywords: [String],
  verdict: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analysis', AnalysisSchema);