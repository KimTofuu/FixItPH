require('dotenv').config();
const nodemailer = require('nodemailer');

// console.log('EMAIL_USER set?', !!process.env.EMAIL_USER);
// console.log('EMAIL_PASS set?', !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error('Nodemailer verify error:', err);
  } else {
    console.log('Nodemailer transporter ready');
  }
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your FixItPH verification code',
    html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };