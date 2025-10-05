const bcrypt = require('bcryptjs');
const Admin = require('../models/Admins');
const jwt = require('jsonwebtoken');
const Report = require('../models/Report');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ officialEmail: email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

exports.register = async (req, res) => {
  try {
    const { barangayName, officialEmail, password, barangayAddress, officialContact, municipality } = req.body;
    const existingAdmin = await Admin.findOne({ officialEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ barangayName, officialEmail, password: hashedPassword, barangayAddress, officialContact, municipality });
    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    // If marking as resolved, transfer to resolvedReports
    if (status === 'resolved') {
      // Create resolved report
      const resolvedReport = new ResolvedReport({
        originalReportId: report._id,
        title: report.title,
        description: report.description,
        image: report.image,
        location: report.location,
        latitude: report.latitude,
        longitude: report.longitude,
        user: report.user,
        comments: report.comments || [],
        createdAt: report.createdAt,
        resolvedAt: new Date()
      });

      await resolvedReport.save();
      
      // Remove from original reports table
      await Report.findByIdAndDelete(reportId);
      
      res.status(200).json({ 
        message: "Report resolved and moved to resolved reports", 
        resolvedReport 
      });
    } else {
      // Normal status update
      report.status = status;
      await report.save();
      res.status(200).json({ message: "Status updated", report });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
    console.error(err);
  }
};