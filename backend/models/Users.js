const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fName: { type: String, required: true, index: true },
    lName: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    contact: { type: String, required: true },
    password: { type: String, required: true },
    barangay: { type: String, required: true },
    municipality: { type: String, required: true },

    // Optional profile picture
    profilePicture: {
        url: { type: String, default: "" },       // Cloudinary URL
        public_id: { type: String, default: "" }, // Cloudinary public_id for update/delete
    }
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);
