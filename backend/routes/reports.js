const express = require('express');
const router = express.Router();
const Report = require('../models/Report'); // Make sure you have this model

// POST /reports - create a new report
router.post('/', async (req, res) => {
  try {
    const { image, description, issueType, location, status, user } = req.body;
    const newReport = new Report({ image, description, issueType, location, status, user });
    await newReport.save();

    // Populate the user field to get the user's name
    await newReport.populate('user', 'fName lName');

    res.status(201).json({
      message: 'Report submitted successfully',
      reporter: `${newReport.user.fName} ${newReport.user.lName}`
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /reports - get all reports with user details
router.get('/', async (req, res) => {
  try {
    // Populate the user field to get user details
    const reports = await Report.find().populate('user', 'name email'); // adjust fields as needed
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getAllReports', async (req, res) => {
  try {
    const reports = await Report.find().select('-__v').populate('user', 'fName lName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getAllPendingReports', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' }).select('-__v').populate('user', 'fName lName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getAllInProgressReports', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'in-progress' }).select('-__v').populate('user', 'fName lName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getAllResolvedReports', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'resolved' }).select('-__v').populate('user', 'fName lName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/getReport', async (req, res) => {
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
});

router.post('/getReportbyUser', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const reports = await Report.find({ user: id }).select('-__v')
      .populate('user', 'fName lName email');
    if (!reports || reports.length === 0) {
      return res.status(404).json({ message: 'No reports found for this user' });
    }
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
});

module.exports = router;