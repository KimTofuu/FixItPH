const mongoose = require('mongoose');

const ResolvedReportSchema = new mongoose.Schema({
  originalReportId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, index: true },
  description: { type: String, required: true, index: true },
  image: { type: String, required: true, index: true },
  location: { type: String, required: true, index: true },
  latitude: { type: String, required: true, index: true },
  longitude: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [{
    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  resolvedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, required: true }, 
}, { collection: 'resolvedReports' });

module.exports = mongoose.model('ResolvedReport', ResolvedReportSchema);