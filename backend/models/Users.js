const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fName: { type: String, required: true },
    lName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    barangay: { type: String, required: true },
    municipality: { type: String, required: true },
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);