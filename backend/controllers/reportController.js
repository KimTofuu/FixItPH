const Report = require('../models/Report');
const User = require('../models/Users');
const ResolvedReport = require('../models/ResolvedReport'); // 1. Add this import
const cloudinary = require('../config/cloudinary');
const { sendEmail } = require('../utils/emailService'); 
const reputationController = require('./reputationController');

// Helper function to format reports with string IDs
const formatReportsWithStringIds = (reports) => {
  return reports.map(report => {
    const reportObj = report.toObject ? report.toObject() : report;
    return {
      ...reportObj,
      votedBy: (reportObj.votedBy || []).map(id => id.toString()),
      user: reportObj.user ? {
        ...reportObj.user,
        _id: reportObj.user._id ? reportObj.user._id.toString() : undefined
      } : null
    };
  });
};

// Create a new report
exports.createReport = async (req, res) => {
  try {
    console.log('📝 Creating report...');
    console.log('Decoded Token:', req.user);
    console.log('req.user.userId:', req.user?.userId);

    const { title, description, location, latitude, longitude, category, isUrgent } = req.body;
    const userId = req.user?.userId || req.userId; // Fixed: use req.user.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isUrgentBool = isUrgent === 'true' || isUrgent === true;
    const initialStatus = isUrgentBool ? 'pending' : 'awaiting-approval';

    let imageUrl = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'fixit-reports',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    const newReport = new Report({
      title,
      description,
      image: imageUrl,
      location,
      latitude,
      longitude,
      category,
      isUrgent: isUrgentBool,
      status: initialStatus,
      user: userId,
    });

    await newReport.save();
    console.log('✅ Report saved to database');

    // Award reputation BEFORE sending response
    if (reputationController && typeof reputationController.awardReportCreation === 'function') {
      try {
        console.log('🏆 Awarding reputation points...');
        const reputation = await reputationController.awardReportCreation(userId);
        console.log('✅ Reputation awarded:', reputation);
      } catch (repError) {
        console.error('❌ Reputation award error:', repError);
        // Don't fail the request if reputation fails
      }
    }

    // Send email acknowledgement
    const emailStatus = isUrgentBool ? 'Pending' : 'Awaiting Approval';
    const emailDetails = isUrgentBool
      ? 'Your urgent report has been posted and is now pending review by our team.'
      : 'Your report has been submitted and is now awaiting approval from an administrator before it is posted publicly.';

    try {
      const emailMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Report Received!</h2>
          <p>Hi ${user.fName},</p>
          <p>${emailDetails}</p>
          <h3>Report Details:</h3>
          <ul>
            <li><strong>Report ID:</strong> ${newReport._id}</li>
            <li><strong>Title:</strong> ${title}</li>
            <li><strong>Status:</strong> ${emailStatus}</li>
          </ul>
          <p>Thank you for helping improve our community!</p>
        </div>
      `;
      await sendEmail({
        to: user.email,
        subject: `Your FixItPH Report is ${emailStatus} (ID: ${newReport._id})`,
        html: emailMessage,
      });
      console.log('📧 Acknowledgement email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send acknowledgement email:', emailError);
    }

    // Populate user data with reputation before sending response
    const populatedReport = await Report.findById(newReport._id)
      .populate('user', 'fName lName email profilePicture reputation');

    res.status(201).json({ 
      message: 'Report created successfully', 
      report: populatedReport 
    });
  } catch (err) {
    console.error('❌ Create report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update report status (for admins)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reportId = req.params.id;

    // Handle non-resolved status updates normally
    if (status !== 'resolved') {
      if (!['pending', 'in-progress'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      const report = await Report.findByIdAndUpdate(
        reportId,
        { status },
        { new: true }
      ).populate('user', 'fName lName email profilePicture reputation');

      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      return res.json(report);
    }

    // --- Handle 'resolved' status: Move the report ---
    console.log(`📦 Attempting to resolve and move report ID: ${reportId}`);
    
    // Find the original report
    const originalReport = await Report.findById(reportId).lean();
    if (!originalReport) {
      return res.status(404).json({ message: 'Original report not found to resolve' });
    }

    console.log('📄 Original report found:', {
      id: originalReport._id,
      title: originalReport.title,
      category: originalReport.category,
      user: originalReport.user,
      hasImages: originalReport.images?.length || 0,
      hasVideos: originalReport.videos?.length || 0,
      hasComments: originalReport.comments?.length || 0
    });

    // Create a new ResolvedReport document with ALL necessary fields
    const resolvedReportData = {
      originalReportId: originalReport._id,
      title: originalReport.title,
      description: originalReport.description,
      category: originalReport.category, // ADDED
      image: originalReport.image || (originalReport.images?.[0]) || null,
      images: originalReport.images || [], // ADDED
      videos: originalReport.videos || [], // ADDED
      location: originalReport.location,
      latitude: originalReport.latitude || null,
      longitude: originalReport.longitude || null,
      isUrgent: originalReport.isUrgent || false, // ADDED
      user: originalReport.user,
      comments: (originalReport.comments || []).map(c => ({
        author: c.author || 'Unknown', // FIXED: Now uses 'author' consistently
        text: c.text || '',
        createdAt: c.createdAt || new Date()
      })),
      createdAt: originalReport.createdAt || new Date(),
      updatedAt: originalReport.updatedAt || new Date(), // ADDED
      resolvedAt: new Date(),
    };

    console.log('💾 Creating ResolvedReport with data:', {
      originalReportId: resolvedReportData.originalReportId,
      title: resolvedReportData.title,
      category: resolvedReportData.category,
      user: resolvedReportData.user,
      imagesCount: resolvedReportData.images.length,
      videosCount: resolvedReportData.videos.length,
      commentsCount: resolvedReportData.comments.length
    });

    const newResolvedReport = new ResolvedReport(resolvedReportData);
    
    // Save the new ResolvedReport
    await newResolvedReport.save();
    console.log(`✅ Report ${reportId} successfully saved to ResolvedReport collection.`);

    // Delete the original report from the main collection
    await Report.findByIdAndDelete(reportId);
    console.log(`✅ Original report ${reportId} deleted from Report collection.`);

    // Award reputation points to the user who reported it
    if (reputationController?.awardResolvedReport) {
      try {
        await reputationController.awardResolvedReport(originalReport.user);
        console.log('✅ Reputation awarded for resolved report');
      } catch (repError) {
        console.error('❌ Reputation award error:', repError);
      }
    }

    // Populate the user field before returning
    const populatedReport = await ResolvedReport.findById(newResolvedReport._id)
      .populate('user', 'fName lName email profilePicture reputation');

    console.log('🎉 Report successfully resolved and archived!');

    // Return a success response
    res.json({
      message: 'Report marked as resolved and archived successfully.',
      resolvedReport: populatedReport,
    });

  } catch (err) {
    console.error('❌ Update status error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// When admin verifies a report
exports.verifyReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.userId || req.userId; // Fixed
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    report.isVerified = true;
    report.verifiedBy = userId;
    report.verifiedAt = new Date();
    await report.save();
    
    // Award reputation
    try {
      await reputationController.awardVerifiedReport(report.user);
      console.log('✅ Reputation awarded for verified report');
    } catch (repError) {
      console.error('❌ Reputation award error:', repError);
    }
    
    res.json({ message: 'Report verified', report });
  } catch (err) {
    console.error('Verify report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reports with user details
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: { $ne: 'Rejected' } })
      .populate('user', 'fName lName email profilePicture reputation')
      .sort({ createdAt: -1 });

    // Normalize votedBy to always be strings
    const normalizedReports = reports.map(report => {
      const reportObj = report.toObject();
      
      // Ensure votedBy is an array of strings
      if (reportObj.votedBy) {
        reportObj.votedBy = reportObj.votedBy.map(id => id.toString());
      } else {
        reportObj.votedBy = [];
      }
      
      return reportObj;
    });

    res.json(normalizedReports);
  } catch (err) {
    console.error('Get all reports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all pending reports
exports.getAllPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .select('-__v')
      .populate('user', 'fName lName email reputation');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all in-progress reports
exports.getAllInProgressReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'in-progress' })
      .select('-__v')
      .populate('user', 'fName lName email reputation');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all resolved reports
exports.getAllResolvedReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'resolved' })
      .select('-__v')
      .populate('user', 'fName lName email reputation');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// return all resolved reports (from ResolvedReport collection)
exports.getResolvedReports = async (req, res) => {
  try {
    const resolved = await ResolvedReport.find().lean();
    return res.json(resolved);
  } catch (err) {
    console.error('getResolvedReport error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// return count of resolved reports (fast)
exports.getResolvedReportsCount = async (req, res) => {
  try {
    const count = await ResolvedReport.countDocuments();
    return res.json({ count });
  } catch (err) {
    console.error('getResolvedReportsCount error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a report by ID
exports.getReport = async (req, res) => {
  try {
    const { id } = req.body;
    const report = await Report.findById(id)
      .select('-__v')
      .populate('user', 'fName lName email reputation');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

// Get reports by user
exports.getReportByUser = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const reports = await Report.find({ user: id })
      .select('-__v')
      .populate('user', 'fName lName email reputation');
    if (!reports || reports.length === 0) {
      return res.status(404).json({ message: 'No reports found for this user' });
    }
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

// Get my reports
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const reports = await Report.find({ user: userId })
      .populate('user', 'fName lName email profilePicture reputation')
      .sort({ createdAt: -1 });
    return res.status(200).json(reports);
  } catch (err) {
    console.error('getMyReports error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { text } = req.body;
    const userId = req.user?.userId || req.userId;
    const userDoc = await User.findById(userId);
    const comment = {
      user: `${userDoc.fName} ${userDoc.lName}`,
      text,
      createdAt: new Date()
    };
    const report = await Report.findByIdAndUpdate(
      reportId,
      { $push: { comments: comment } },
      { new: true }
    );
    res.status(200).json(report.comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user?.userId || req.userId;
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }
    await Report.findByIdAndDelete(reportId);
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

exports.updateReport = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.userId || req.userId;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    if (userId && report.user && report.user.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { title, description, location, latitude, longitude, removeImage, category } = req.body;
    if (title !== undefined) report.title = title;
    if (description !== undefined) report.description = description;
    if (location !== undefined) report.location = location;
    if (latitude !== undefined) report.latitude = latitude;
    if (longitude !== undefined) report.longitude = longitude;
    if (category !== undefined) report.category = category;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'fixit-reports',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' },
          ],
        });
        report.image = result.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    } else if (removeImage === 'true' || removeImage === true) {
      report.image = null;
    }
    await report.save();
    return res.json(report);
  } catch (err) {
    console.error('updateReport error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getReportsForApproval = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'awaiting-approval' })
      .populate('user', 'fName lName email profilePicture reputation') 
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('getReportsForApproval error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'pending' },
      { new: true }
    ).populate('user', 'fName lName email reputation');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    try {
      const emailMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Report Approved!</h2>
          <p>Hi ${report.user.fName},</p>
          <p>Great news! Your report has been approved by our administrators and is now publicly visible.</p>
          <h3>Report Details:</h3>
          <ul>
            <li><strong>Report ID:</strong> ${report._id}</li>
            <li><strong>Title:</strong> ${report.title}</li>
            <li><strong>Status:</strong> Pending</li>
          </ul>
          <p>Our team will now review and work on resolving this issue. You will be notified of any updates.</p>
          <p>Thank you for helping improve our community!</p>
        </div>
      `;
      await sendEmail({
        to: report.user.email,
        subject: `Your FixItPH Report Has Been Approved (ID: ${report._id})`,
        html: emailMessage,
      });
      console.log('📧 Approval email sent successfully to:', report.user.email);
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError);
    }
    res.json({ message: 'Report approved successfully', report });
  } catch (err) {
    console.error('approveReport error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('user', 'fName lName email reputation');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    const userInfo = {
      fName: report.user.fName,
      email: report.user.email,
    };
    const reportTitle = report.title;
    const reportId = report._id;
    await Report.findByIdAndDelete(req.params.id);
    try {
      const emailMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Report Not Approved</h2>
          <p>Hi ${userInfo.fName},</p>
          <p>We regret to inform you that your report was not approved for public posting.</p>
          <h3>Report Details:</h3>
          <ul>
            <li><strong>Report ID:</strong> ${reportId}</li>
            <li><strong>Title:</strong> ${reportTitle}</li>
          </ul>
          <p><strong>Possible reasons for rejection:</strong></p>
          <ul>
            <li>The report did not meet our community guidelines</li>
            <li>The issue was duplicate or already reported</li>
            <li>Insufficient information provided</li>
            <li>The issue is outside the scope of our service</li>
          </ul>
          <p>If you believe this was a mistake or would like to resubmit with more details, please feel free to create a new report.</p>
          <p>Thank you for your understanding.</p>
        </div>
      `;
      await sendEmail({
        to: userInfo.email,
        subject: `Your FixItPH Report Was Not Approved (ID: ${reportId})`,
        html: emailMessage,
      });
      console.log('📧 Rejection email sent successfully to:', userInfo.email);
    } catch (emailError) {
      console.error('❌ Failed to send rejection email:', emailError);
    }
    res.json({ message: 'Report rejected and deleted successfully' });
  } catch (err) {
    console.error('Reject report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getResolvedReports = async (req, res) => {
  try {
    const resolvedReports = await ResolvedReport.find()
      .populate('user', 'fName lName email profilePicture reputation')
      .sort({ resolvedAt: -1 }); // Sort by resolved date, newest first
    
    console.log(`📊 Fetched ${resolvedReports.length} resolved reports from ResolvedReport collection`);
    res.json(resolvedReports);
  } catch (err) {
    console.error('getResolvedReports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update the existing getAllResolvedReports to use the same logic
exports.getAllResolvedReports = async (req, res) => {
  try {
    const resolvedReports = await ResolvedReport.find()
      .populate('user', 'fName lName email profilePicture reputation')
      .sort({ resolvedAt: -1 });
    res.json(resolvedReports);
  } catch (err) {
    console.error('getAllResolvedReports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Flag a report
exports.flagReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user already flagged this report
    if (report.flags && report.flags.some((flag) => flag.userId.toString() === userId)) {
      return res.status(400).json({ message: 'You have already flagged this report' });
    }

    // Initialize flags array if it doesn't exist
    if (!report.flags) {
      report.flags = [];
    }

    // Add the flag
    report.flags.push({
      userId,
      reason,
      description: description || '',
      createdAt: new Date()
    });

    report.flagCount = report.flags.length;

    await report.save();

    console.log(`🚩 Report ${reportId} flagged by user ${userId}. Total flags: ${report.flagCount}`);

    // If report has too many flags (e.g., 3+), notify admins or auto-hide
    if (report.flagCount >= 3) {
      console.log(`⚠️ Report ${reportId} has reached ${report.flagCount} flags. Consider review.`);
      // You can add admin notification logic here
    }

    res.json({
      message: 'Report flagged successfully',
      flagCount: report.flagCount
    });

  } catch (error) {
    console.error('Flag report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFlaggedReports = async (req, res) => {
  try {
    const flaggedReports = await Report.find({ 
      flagCount: { $gt: 0 } 
    })
      .populate('user', 'fName lName email profilePicture')
      .populate('flags.userId', 'fName lName email')
      .sort({ flagCount: -1, createdAt: -1 });

    console.log(`📊 Found ${flaggedReports.length} flagged reports`);
    res.json(flaggedReports);
  } catch (error) {
    console.error('Get flagged reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dismiss a specific flag
exports.dismissFlag = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { flagUserId } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Remove the specific flag
    report.flags = report.flags.filter(
      (flag) => flag.userId.toString() !== flagUserId
    );
    report.flagCount = report.flags.length;

    await report.save();

    console.log(`✅ Dismissed flag from user ${flagUserId} on report ${reportId}`);
    res.json({ message: 'Flag dismissed successfully', flagCount: report.flagCount });
  } catch (error) {
    console.error('Dismiss flag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dismiss all flags for a report
exports.dismissAllFlags = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.flags = [];
    report.flagCount = 0;

    await report.save();

    console.log(`✅ Dismissed all flags for report ${reportId}`);
    res.json({ message: 'All flags dismissed successfully' });
  } catch (error) {
    console.error('Dismiss all flags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};