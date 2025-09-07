const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    image: { type: String, required: true, index: true },
    description: { type: String, required: true, index: true },
    location: { type: String, required: true, index: true },
    issueType: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { collection: 'reports' });

module.exports = mongoose.model('Report', ReportSchema);