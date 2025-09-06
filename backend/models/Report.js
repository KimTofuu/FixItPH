const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    image: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    issueType: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { collection: 'reports' });

module.exports = mongoose.model('Report', ReportSchema);