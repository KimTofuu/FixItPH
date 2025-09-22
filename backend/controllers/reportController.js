const Report = require('../models/Report');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { title, description, location } = req.body;
    // If you want to use issueType and status, set defaults or get from req.body
    // const { issueType, status } = req.body;
    // const user = req.user.userId; // If using JWT

    const image = req.file ? req.file.filename : null;

    const user = req.user.userId;
    const newReport = new Report({
      title,
      description,
      image,
      location,
      // issueType,
      // status,
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