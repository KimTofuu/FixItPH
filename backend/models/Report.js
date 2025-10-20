const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, required: true, index: true },
    image: { type: String, required: true, index: true },
    location: { type: String, required: true, index: true },
    latitude: { type: String, required: true, index: true },
    longitude: { type: String, required: true, index: true },
    category: {
        type: String,
        required: true,
        enum: [
            'Infrastructure',
            'Utilities',
            'Sanitation and Waste',
            'Environment and Public Spaces',
            'Community and Safety',
            'Government / Administrative',
            'Others'
        ],
        index: true
    },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [
        {
            user: { type: String, required: true },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now, index: true }
}, { collection: 'reports' });

module.exports = mongoose.model('Report', ReportSchema);