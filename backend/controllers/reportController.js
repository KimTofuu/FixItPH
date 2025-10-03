const Report = require('../models/Report');
const User = require('../models/Users');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { title, description, location, latitude, longitude } = req.body;
    const image = req.file ? req.file.filename : null;
    const user = req.user.userId;
    const newReport = new Report({
      title,
      description,
      image,
      location,
      latitude, 
      longitude,  
      user,
    });
    await newReport.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

// Get all reports with user details
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().select('-__v').populate('user', 'fName lName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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

exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.userId; // Get from JWT, not from req.body
    const reports = await Report.find({ user: userId }).select('-__v').populate('user', 'fName lName email');
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
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