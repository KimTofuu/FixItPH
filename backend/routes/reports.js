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

module.exports = router;