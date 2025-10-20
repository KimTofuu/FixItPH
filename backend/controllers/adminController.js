const bcrypt = require('bcryptjs');
const Admin = require('../models/Admins');
const jwt = require('jsonwebtoken');
const Report = require('../models/Report'); // Needed for updateReportStatus

// --- Admin Registration ---
exports.register = async (req, res) => {
  try {
    const {
      barangayName,
      officialEmail,
      password,
      barangayAddress,
      officialContact,
      municipality,
    } = req.body;

    let admin = await Admin.findOne({ officialEmail });
    if (admin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new Admin({
      barangayName,
      officialEmail,
      password: hashedPassword,
      barangayAddress,
      officialContact,
      municipality,
    });

    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Admin Login ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ officialEmail: email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // --- CRITICAL PART ---
    // Create a JWT payload that explicitly sets the role to 'admin'
    const payload = {
      userId: admin._id,
      email: admin.officialEmail,
      role: 'admin', // This will satisfy your isAdmin middleware
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: "Admin logged in successfully",
      token,
      admin: {
        id: admin._id,
        email: admin.officialEmail,
        barangayName: admin.barangayName,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Update Report Status ---
exports.updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;

        if (!['pending', 'in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json(report);
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Reject (Delete) a Report ---
exports.rejectReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({ message: 'Report rejected and deleted successfully' });
  } catch (err) {
    console.error('Reject report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};