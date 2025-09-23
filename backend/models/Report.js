const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, required: true, index: true },
    image: { type: String, required: true, index: true },
    location: { type: String, required: true, index: true },
    latitude: { type: String, required: true, index: true },   // <-- add this
    longitude: { type: String, required: true, index: true },  // <-- add this
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { collection: 'reports' });

module.exports = mongoose.model('Report', ReportSchema);