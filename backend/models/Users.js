const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fName: {
    type: String,
    required: true,
  },
  lName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: String,
    required: false,
    default: '',
  },
  password: {
    type: String,
    required: false,
    default: '',
  },
  barangay: {
    type: String,
    required: false,
    default: '',
  },
  municipality: {
    type: String,
    required: false,
    default: '',
  },
  profilePicture: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  // Reputation System
  reputation: {
    points: {
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      enum: ['Newcomer', 'Active', 'Contributor', 'Veteran', 'Expert', 'Legend'], 
      default: 'Newcomer',
    },
    badges: [{
      name: String,
      icon: String,
      earnedAt: { type: Date, default: Date.now },
    }],
    totalReports: {
      type: Number,
      default: 0,
    },
    verifiedReports: {
      type: Number,
      default: 0,
    },
    resolvedReports: {
      type: Number,
      default: 0,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
  },
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Additional fields
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true // Make sure this exists
});

// Method to calculate reputation level based on points
userSchema.methods.updateReputationLevel = function() {
  const points = this.reputation.points;
  
  if (points >= 1000) {
    this.reputation.level = 'Guardian';
  } else if (points >= 500) {
    this.reputation.level = 'Expert';
  } else if (points >= 200) {
    this.reputation.level = 'Trusted';
  } else if (points >= 50) {
    this.reputation.level = 'Contributor';
  } else {
    this.reputation.level = 'Newcomer';
  }
};

// Method to add reputation points
userSchema.methods.addReputationPoints = async function(points, reason) {
  this.reputation.points += points;
  this.updateReputationLevel();
  await this.save();
  
  console.log(`✅ ${this.fName} earned ${points} points for: ${reason}`);
  return this.reputation.points;
};

// Method to check and award badges
userSchema.methods.checkAndAwardBadges = async function() {
  const badges = [];
  
  // First Report Badge
  if (this.reputation.totalReports >= 1 && !this.reputation.badges.find(b => b.name === 'First Report')) {
    badges.push({ name: 'First Report', icon: '🎯', earnedAt: new Date() });
  }
  
  // Active Reporter Badge (10 reports)
  if (this.reputation.totalReports >= 10 && !this.reputation.badges.find(b => b.name === 'Active Reporter')) {
    badges.push({ name: 'Active Reporter', icon: '📢', earnedAt: new Date() });
  }
  
  // Verified Reporter Badge (5 verified reports)
  if (this.reputation.verifiedReports >= 5 && !this.reputation.badges.find(b => b.name === 'Verified Reporter')) {
    badges.push({ name: 'Verified Reporter', icon: '✅', earnedAt: new Date() });
  }
  
  // Problem Solver Badge (5 resolved reports)
  if (this.reputation.resolvedReports >= 5 && !this.reputation.badges.find(b => b.name === 'Problem Solver')) {
    badges.push({ name: 'Problem Solver', icon: '🔧', earnedAt: new Date() });
  }
  
  // Community Hero Badge (50 reports)
  if (this.reputation.totalReports >= 50 && !this.reputation.badges.find(b => b.name === 'Community Hero')) {
    badges.push({ name: 'Community Hero', icon: '🦸', earnedAt: new Date() });
  }
  
  // Helpful Citizen Badge (20 helpful votes)
  if (this.reputation.helpfulVotes >= 20 && !this.reputation.badges.find(b => b.name === 'Helpful Citizen')) {
    badges.push({ name: 'Helpful Citizen', icon: '💡', earnedAt: new Date() });
  }
  
  if (badges.length > 0) {
    this.reputation.badges.push(...badges);
    await this.save();
    console.log(`🏆 ${this.fName} earned ${badges.length} new badge(s)!`);
  }
  
  return badges;
};

module.exports = mongoose.model('User', userSchema);
