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

// Get admin profile
exports.getProfile = async (req, res) => {
  try {
    const adminId = req.user.userId; // From JWT token
    const admin = await Admin.findById(adminId).select('-password'); // Exclude password
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);
  } catch (err) {
    console.error('Get admin profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update admin profile
exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { barangayName, barangayAddress, municipality, officialContact, password } = req.body;

    const updateData = {
      barangayName,
      barangayAddress,
      municipality,
      officialContact,
    };

    // If password is provided, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Profile updated successfully', admin });
  } catch (err) {
    console.error('Update admin profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFlaggedReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const adminId = req.user.userId;

    console.log(`🗑️ Admin ${adminId} attempting to delete report ${reportId}`);

    const report = await Report.findById(reportId);
    
    if (!report) {
      console.log('❌ Report not found');
      return res.status(404).json({ message: 'Report not found' });
    }

    // Log report details before deletion
    console.log(`📋 Deleting report: "${report.title}" by user ${report.user}`);
    console.log(`🚩 Flag count: ${report.flagCount || 0}`);

    await Report.findByIdAndDelete(reportId);
    
    console.log(`✅ Report ${reportId} deleted successfully by admin ${adminId}`);
    
    res.json({ 
      message: 'Flagged report deleted successfully',
      deletedReport: {
        id: reportId,
        title: report.title,
        flagCount: report.flagCount
      }
    });

  } catch (err) {
    console.error('❌ Delete flagged report error:', err);
    res.status(500).json({ message: 'Server error while deleting report' });
  }
};

// --- Batch Delete Multiple Flagged Reports ---
exports.batchDeleteReports = async (req, res) => {
  try {
    const { reportIds } = req.body; // Array of report IDs
    const adminId = req.user.userId;

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of report IDs' });
    }

    console.log(`🗑️ Admin ${adminId} attempting to delete ${reportIds.length} reports`);

    const deleteResult = await Report.deleteMany({ 
      _id: { $in: reportIds } 
    });

    console.log(`✅ Deleted ${deleteResult.deletedCount} reports`);

    res.json({ 
      message: `Successfully deleted ${deleteResult.deletedCount} report(s)`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (err) {
    console.error('❌ Batch delete reports error:', err);
    res.status(500).json({ message: 'Server error while deleting reports' });
  }
};

// --- Delete Report and Ban User (Nuclear option) ---
exports.deleteReportAndWarnUser = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { warningMessage } = req.body;
    const adminId = req.user.userId;

    const report = await Report.findById(reportId).populate('user', 'fName lName email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const userId = report.user._id;
    const userName = `${report.user.fName} ${report.user.lName}`;

    console.log(`⚠️ Admin ${adminId} deleting report and warning user ${userName}`);

    // Delete the report
    await Report.findByIdAndDelete(reportId);

    // Here you could:
    // 1. Send a warning email to the user
    // 2. Add a warning count to the user model
    // 3. Temporarily suspend the user if too many warnings
    // For now, we'll just log it

    console.log(`✅ Report deleted and user ${userName} warned: ${warningMessage || 'No message'}`);

    res.json({ 
      message: 'Report deleted and user warned successfully',
      deletedReport: {
        id: reportId,
        title: report.title,
        user: userName
      },
      warning: warningMessage || 'Generic warning issued'
    });

  } catch (err) {
    console.error('❌ Delete and warn error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};