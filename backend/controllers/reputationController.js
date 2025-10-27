const User = require('../models/Users');
const Report = require('../models/Report');

// Reputation point values
const REPUTATION_POINTS = {
  CREATE_REPORT: 10,
  VERIFIED_REPORT: 50,
  RESOLVED_REPORT: 100,
  HELPFUL_VOTE: 5,
  URGENT_REPORT_RESOLVED: 150,
  FIRST_REPORT: 20,
};

// Get user reputation
exports.getUserReputation = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    
    const user = await User.findById(userId).select('fName lName reputation profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        fName: user.fName,
        lName: user.lName,
        profilePicture: user.profilePicture,
      },
      reputation: user.reputation,
    });
  } catch (err) {
    console.error('Get reputation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Award reputation for creating a report
exports.awardReportCreation = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    user.reputation.totalReports += 1;
    
    // Award points
    let points = REPUTATION_POINTS.CREATE_REPORT;
    if (user.reputation.totalReports === 1) {
      points += REPUTATION_POINTS.FIRST_REPORT; // Bonus for first report
    }
    
    await user.addReputationPoints(points, 'Creating a report');
    await user.checkAndAwardBadges();
    
    return user.reputation;
  } catch (err) {
    console.error('Award report creation error:', err);
  }
};

// Award reputation for verified report
exports.awardVerifiedReport = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    user.reputation.verifiedReports += 1;
    await user.addReputationPoints(REPUTATION_POINTS.VERIFIED_REPORT, 'Report verified by admin');
    await user.checkAndAwardBadges();
    
    return user.reputation;
  } catch (err) {
    console.error('Award verified report error:', err);
  }
};

// Award reputation for resolved report
exports.awardResolvedReport = async (reportId) => {
  try {
    const report = await Report.findById(reportId).populate('user');
    if (!report || !report.user) return;
    
    const user = report.user;
    user.reputation.resolvedReports += 1;
    
    let points = REPUTATION_POINTS.RESOLVED_REPORT;
    if (report.priority === 'urgent') {
      points = REPUTATION_POINTS.URGENT_REPORT_RESOLVED;
    }
    
    await user.addReputationPoints(points, 'Report resolved');
    await user.checkAndAwardBadges();
    
    return user.reputation;
  } catch (err) {
    console.error('Award resolved report error:', err);
  }
};

// Vote report as helpful
exports.voteHelpful = async (req, res) => {
  try {
    const { reportId } = req.params;
    const voterId = req.userId;
    
    const report = await Report.findById(reportId).populate('user');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user already voted
    if (report.votedBy.includes(voterId)) {
      return res.status(400).json({ message: 'You already voted this report as helpful' });
    }
    
    // Can't vote own report
    if (report.user._id.toString() === voterId) {
      return res.status(400).json({ message: 'You cannot vote your own report' });
    }
    
    // Add vote
    report.helpfulVotes += 1;
    report.votedBy.push(voterId);
    await report.save();
    
    // Award reputation to report author
    const user = report.user;
    user.reputation.helpfulVotes += 1;
    await user.addReputationPoints(REPUTATION_POINTS.HELPFUL_VOTE, 'Received helpful vote');
    await user.checkAndAwardBadges();
    
    res.json({
      message: 'Voted as helpful',
      helpfulVotes: report.helpfulVotes,
      reputation: user.reputation,
    });
  } catch (err) {
    console.error('Vote helpful error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topUsers = await User.find({ role: 'user' })
      .select('fName lName reputation profilePicture')
      .sort({ 'reputation.points': -1 })
      .limit(limit);
    
    res.json(topUsers);
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;