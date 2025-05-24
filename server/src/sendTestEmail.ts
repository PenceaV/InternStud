import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('Attempting to send email with user:', 'alexdragomirescu@internstud.ro');
console.log('EMAIL_PASSWORD variable is set:', !!process.env.EMAIL_PASSWORD);

const transporter = nodemailer.createTransport({
  host: 'mail.internstud.ro',  // Hostico mail server
  port: 587,
  secure: false,
  auth: {
    user: 'alexdragomirescu@internstud.ro',
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mailOptions = {
  from: 'alexdragomirescu@internstud.ro',
  to: 'alexdragomirescu@internstud.ro', // Send test email to yourself
  subject: 'Test Email from InternStud Backend',
  text: 'This is a test email sent from the InternStud backend.',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending test email:', error);
  } else {
    console.log('Test email sent successfully:', info.response);
  }
}); 