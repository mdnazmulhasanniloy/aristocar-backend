import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, subject: string, html: string) => {
  console.log('🚀 ~ sendEmail ~ html:', to);
  const transporter = nodemailer.createTransport({
    // host: 'smtp.gmail.com', // Change this based on your AWS region
    // host: 'smtp.mail.us-east-1.awsapps.com', // Change this based on your AWS region
    host: 'email-smtp.eu-west-1.amazonaws.com', // Change this based on your AWS region
    port: 587, // Use 587 if not using SSL
    secure: false, // True for port 465, false for 587
    // port: 465, // Use 587 if not using SSL
    // secure: true, // True for port 465, false for 587
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      // user: config.nodemailer_host_email,
      // pass: config.nodemailer_host_pass,
      user: 'AKIAXZ5NGO5NG3ODA7P3',
      pass: 'BAOJqzx7+eNmh7KgyH8k4dFyMnzQhBjuBLdzOWt7TExn',
    },
    tls: {
      rejectUnauthorized: false, // Required for some servers
    },
  });

  const res = await transporter.sendMail({
    from: 'noreply@aristocar.eu', // sender address
    to, // list of receivers
    subject,
    text: '', // plain text body
    html, // html body
  });
  console.log(res);
};
