const Report = require('../models/Report');
const User = require('../models/Users');
const cloudinary = require('../config/cloudinary');
const { sendEmail } = require('../utils/emailService'); 
// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { title, description, location, latitude, longitude, category, isUrgent } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isUrgentBool = isUrgent === 'true' || isUrgent === true;
    const initialStatus = isUrgentBool ? 'pending' : 'awaiting-approval';

    let imageUrl = null;
    if (req.file) {
      // Upload image to Cloudinary if provided
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'fixit-reports',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      imageUrl = result.secure_url;
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

    // --- Update Email Acknowledgement ---
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
      console.log('Acknowledgement email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send acknowledgement email:', emailError);
    }
    // --- End of Email Logic ---

    const populatedReport = await Report.findById(newReport._id).populate('user', 'fName lName email profilePicture');
    res.status(201).json({ message: 'Report created successfully', report: populatedReport });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reports with user details
exports.getAllReports = async (req, res) => {
  try {
    // Only fetch reports that are approved and public
    const reports = await Report.find({ status: { $ne: 'awaiting-approval' } })
      .populate('user', 'fName lName email profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json(reports);
  } catch (err) {
    console.error('getAllReports error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all pending reports
exports.getAllPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' }).select('-__v').populate('user', 'fName lName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all in-progress reports
exports.getAllInProgressReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'in-progress' }).select('-__v').populate('user', 'fName lName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all resolved reports
exports.getAllResolvedReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'resolved' }).select('-__v').populate('user', 'fName lName email');
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
    const report = await Report.findById(id).select('-__v').populate('user', 'fName lName email');
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
    const reports = await Report.find({ user: id }).select('-__v').populate('user', 'fName lName email');
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
      .populate('user', 'fName lName email profilePicture') // Make sure profilePicture is included
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
    const user = req.user.userId; // or req.user.email or name, depending on your JWT

   
    const userDoc = await User.findById(user);

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
    const userId = req.user.userId;
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user owns this report
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

// update report (PATCH /reports/:id)
exports.updateReport = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

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
      } finally {
        // remove temp file saved by multer
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.warn('Failed to remove temp file:', err);
          });
        }
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
      .populate('user', 'fName lName email profilePicture') 
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('getReportsForApproval error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve a report (for admins)
exports.approveReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'pending' },
      { new: true }
    ).populate('user', 'fName lName email');
    
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
      console.log('Approval email sent successfully to:', report.user.email);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.json({ message: 'Report approved successfully', report });
  } catch (err) {
    console.error('approveReport error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('user', 'fName lName email');
    
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
      console.log('Rejection email sent successfully to:', userInfo.email);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }
    
    res.json({ message: 'Report rejected and deleted successfully' });
  } catch (err) {
    console.error('Reject report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getResolvedReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'resolved' })
      .populate('user', 'fName lName email profilePicture')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('getResolvedReports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update report status (for admins) - ADD THIS NEW FUNCTION
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reportId = req.params.id;

    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true }
    ).populate('user', 'fName lName email profilePicture');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};