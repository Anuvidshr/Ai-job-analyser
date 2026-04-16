const mongoose = require('mongoose');
const AnalysisSchema = new mongoose.Schema({
  threadText: String,
  summary: String,
  topics: [String],
  sentimentScore: Number,
  engagementLevel: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Analysis', AnalysisSchema);