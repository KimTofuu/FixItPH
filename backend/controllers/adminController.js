const bcrypt = require('bcryptjs');
const Admin = require('../models/Admins');
const jwt = require('jsonwebtoken');
const Report = require('../models/Report');
const User = require('../models/Users'); // Add this
const { sendEmail, emailTemplates } = require('../config/emailConfig'); // Add this

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
    const { reason } = req.body; // Get reason from request body
    const adminId = req.user.userId;

    console.log(`🗑️ Admin ${adminId} attempting to delete report ${reportId}`);

    // Populate both user and flags.userId to get email addresses
    const report = await Report.findById(reportId)
      .populate('user', 'fName lName email')
      .populate('flags.userId', 'fName lName email');
    
    if (!report) {
      console.log('❌ Report not found');
      return res.status(404).json({ message: 'Report not found' });
    }

    // Store data before deletion
    const reportOwner = report.user;
    const reportTitle = report.title;
    const flaggers = report.flags || [];
    const removalReason = reason || 'This report violated our community guidelines and was flagged multiple times by community members.';

    console.log(`📋 Deleting report: "${reportTitle}" by user ${reportOwner.fName} ${reportOwner.lName}`);
    console.log(`🚩 Flag count: ${report.flagCount || 0}`);

    // Delete the report
    await Report.findByIdAndDelete(reportId);
    console.log(`✅ Report ${reportId} deleted successfully by admin ${adminId}`);

    // Send email to report owner
    if (reportOwner && reportOwner.email) {
      const ownerName = `${reportOwner.fName} ${reportOwner.lName}`;
      const ownerEmail = emailTemplates.reportRemoved(ownerName, reportTitle, removalReason);
      
      console.log(`📧 Sending removal notification to ${reportOwner.email}`);
      await sendEmail(reportOwner.email, ownerEmail.subject, ownerEmail.html);
    }

    // Send thank you emails to all flaggers
    const emailPromises = flaggers.map(async (flag) => {
      if (flag.userId && flag.userId.email) {
        const flaggerName = `${flag.userId.fName} ${flag.userId.lName}`;
        const thankYouEmail = emailTemplates.thankFlagger(flaggerName, reportTitle);
        
        console.log(`📧 Sending thank you email to ${flag.userId.email}`);
        return sendEmail(flag.userId.email, thankYouEmail.subject, thankYouEmail.html);
      }
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);
    console.log(`✅ All notification emails sent`);

    res.json({ 
      message: 'Flagged report deleted successfully and notifications sent',
      deletedReport: {
        id: reportId,
        title: reportTitle,
        flagCount: report.flagCount
      },
      emailsSent: {
        owner: reportOwner?.email ? true : false,
        flaggers: flaggers.filter(f => f.userId?.email).length
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

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('fName lName email address barangay archived lastLogin createdAt reputation')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      _id: user._id,
      id: user._id,
      name: `${user.fName} ${user.lName}`,
      email: user.email,
      address: user.address || user.barangay || 'No address provided',
      archived: user.archived || false,
      lastLogin: user.lastLogin,
      reputation: user.reputation
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('fName lName email address barangay archived lastLogin createdAt reputation');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's report count
    const reportCount = await Report.countDocuments({ user: userId });

    res.json({
      _id: user._id,
      id: user._id,
      name: `${user.fName} ${user.lName}`,
      email: user.email,
      address: user.address || user.barangay || 'No address provided',
      archived: user.archived || false,
      lastLogin: user.lastLogin,
      reputation: user.reputation,
      reportCount
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
};

// Archive user
exports.archiveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    console.log(`📦 Admin ${adminId} attempting to archive user ${userId}`);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.archived) {
      return res.status(400).json({ message: 'User is already archived' });
    }

    user.archived = true;
    user.archivedAt = new Date();
    user.archivedBy = adminId;
    await user.save();

    console.log(`✅ User ${userId} archived successfully by admin ${adminId}`);

    res.json({
      message: 'User archived successfully',
      user: {
        _id: user._id,
        name: `${user.fName} ${user.lName}`,
        archived: user.archived
      }
    });
  } catch (error) {
    console.error('Archive user error:', error);
    res.status(500).json({ message: 'Server error while archiving user' });
  }
};

// Unarchive user
exports.unarchiveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    console.log(`📦 Admin ${adminId} attempting to unarchive user ${userId}`);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.archived) {
      return res.status(400).json({ message: 'User is not archived' });
    }

    user.archived = false;
    user.archivedAt = null;
    user.archivedBy = null;
    await user.save();

    console.log(`✅ User ${userId} unarchived successfully by admin ${adminId}`);

    res.json({
      message: 'User unarchived successfully',
      user: {
        _id: user._id,
        name: `${user.fName} ${user.lName}`,
        archived: user.archived
      }
    });
  } catch (error) {
    console.error('Unarchive user error:', error);
    res.status(500).json({ message: 'Server error while unarchiving user' });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      archived: { $ne: true },
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const archivedUsers = await User.countDocuments({ archived: true });
    const totalReports = await Report.countDocuments();

    res.json({
      totalUsers,
      activeUsers,
      archivedUsers,
      totalReports
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
};

module.exports = exports;