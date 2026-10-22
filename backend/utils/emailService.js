import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer Transporter
 * Supports live Gmail / SMTP credentials from .env, with automatic graceful fallback.
 */
const createTransporter = async () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    // Live SMTP Transporter (e.g. Gmail App Password)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  // Fallback: Create test transporter or simulated logger if credentials not yet configured
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal_pass',
    },
  });
};

/**
 * Send Borrow Confirmation Email to user's registered Gmail address
 * @param {Object} options
 * @param {Object} options.user - User document with email and name
 * @param {Object} options.book - Book document with title, author, isbn, shelfLocation
 * @param {Date} options.borrowDate - Date of borrowing
 * @param {Date} options.dueDate - Return due date
 */
export const sendBorrowConfirmationEmail = async ({ user, book, borrowDate, dueDate }) => {
  try {
    if (!user || !user.email) {
      console.warn('⚠️ [Email Service]: No recipient email provided. Skipping email dispatch.');
      return { success: false, reason: 'No recipient email' };
    }

    const recipientEmail = user.email;
    const recipientName = user.name || 'Valued Member';
    const bookTitle = book?.title || 'Unknown Title';
    const bookAuthor = book?.author || 'Unknown Author';
    const bookIsbn = book?.isbn || 'N/A';
    const shelfLocation = book?.shelfLocation || 'Main Catalog';

    const formattedBorrowDate = new Date(borrowDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailSubject = `📚 Borrow Confirmation: "${bookTitle}" - Librio Central Library`;

    // HTML Email Template with professional library styling
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #ccfbf1; }
    .badge { display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 20px 0; }
    .book-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .book-author { font-size: 13px; color: #64748b; margin-bottom: 16px; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .details-table td:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; width: 40%; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .due-highlight { color: #e11d48; font-weight: 800; font-size: 14px; }
    .policy-box { background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 16px; margin: 24px 0; font-size: 12px; color: #9f1239; line-height: 1.5; }
    .policy-box strong { color: #881337; }
    .btn-container { text-align: center; margin: 28px 0 12px; }
    .btn { display: inline-block; background-color: #0d9488; color: #ffffff !important; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3); }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">📖 Official Circulation Confirmation</div>
      <h1>Librio Central Library</h1>
      <p>Automated Member Services & Book Circulation Desk</p>
    </div>

    <div class="content">
      <div class="greeting">Hello, ${recipientName}!</div>
      <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        Thank you for visiting Librio. Your book checkout has been processed successfully. Below are the official borrowing records and due dates for your reference:
      </p>

      <div class="card">
        <div class="book-title">${bookTitle}</div>
        <div class="book-author">by ${bookAuthor}</div>

        <table class="details-table">
          <tr>
            <td class="label">ISBN Number:</td>
            <td class="value">${bookIsbn}</td>
          </tr>
          <tr>
            <td class="label">Shelf Location:</td>
            <td class="value">${shelfLocation}</td>
          </tr>
          <tr>
            <td class="label">📅 Borrow Date:</td>
            <td class="value">${formattedBorrowDate}</td>
          </tr>
          <tr>
            <td class="label">⏰ Return Due Date:</td>
            <td class="value due-highlight">${formattedDueDate}</td>
          </tr>
          <tr>
            <td class="label">Borrow Duration:</td>
            <td class="value">14 Days (Standard Loan)</td>
          </tr>
        </table>
      </div>

      <div class="policy-box">
        ⚠️ <strong>Important Return Guidelines:</strong><br>
        Please return the book on or before <strong>${formattedDueDate}</strong>. Books returned after this date incur a late return overdue fee of <strong>₹5 per day</strong> until returned. You can settle fines or check your status anytime on your member portal.
      </div>

      <div class="btn-container">
        <a href="http://localhost:5173/dashboard" class="btn">View My Borrowed Books & Due Dates →</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px;">Librio Central Library • Digital Circulation Desk</p>
      <p style="margin: 0;">This is an automated confirmation sent to your registered Gmail: <strong>${recipientEmail}</strong>.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text alternative for email clients that do not render HTML
    const textContent = `
Librio Central Library - Book Borrow Confirmation

Hello ${recipientName},

Your book checkout has been processed successfully!

========================================
Book Title:     ${bookTitle}
Author:         ${bookAuthor}
ISBN:           ${bookIsbn}
Borrow Date:    ${formattedBorrowDate}
Due Date:       ${formattedDueDate}
Borrow Period:  14 Days
========================================

Please return the book on or before ${formattedDueDate}. Overdue returns accrue a penalty of ₹5 per day.

View your account dashboard: http://localhost:5173/dashboard

Thank you for reading with Librio Central Library!
    `.trim();

    // Check if live credentials exist
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = await createTransporter();
      const senderFrom = process.env.EMAIL_FROM || `"Librio Central Library" <${process.env.EMAIL_USER}>`;

      const info = await transporter.sendMail({
        from: senderFrom,
        to: recipientEmail,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✉️ [Email Sent]: Live confirmation sent to ${recipientEmail} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, live: true };
    } else {
      // Graceful local development simulation
      console.log('\n================================================================');
      console.log(`📧 [Simulated Email Dispatch] - Live credentials not set in .env`);
      console.log(`👉 Recipient:   ${recipientEmail} (${recipientName})`);
      console.log(`👉 Subject:     ${emailSubject}`);
      console.log(`👉 Book Name:   ${bookTitle}`);
      console.log(`👉 Borrow Date: ${formattedBorrowDate}`);
      console.log(`👉 Due Date:    ${formattedDueDate}`);
      console.log(`ℹ️ [Tip]: Set EMAIL_USER & EMAIL_PASS in backend/.env for live Gmail SMTP delivery.`);
      console.log('================================================================\n');

      return {
        success: true,
        simulated: true,
        details: { recipientEmail, bookTitle, formattedBorrowDate, formattedDueDate },
      };
    }
  } catch (error) {
    // Non-blocking: log the error and don't fail the borrow process
    console.error('❌ [Email Service Error]: Failed to send borrow confirmation email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Registration OTP Email to user's Gmail address
 * @param {Object} options
 * @param {string} options.email - User's Gmail address
 * @param {string} options.name - User's full name
 * @param {string} options.otp - 6-digit OTP code
 */
export const sendRegistrationOtpEmail = async ({ email, name, otp }) => {
  try {
    if (!email) {
      console.warn('⚠️ [Email Service]: No recipient email provided for OTP.');
      return { success: false, error: 'Recipient email is required' };
    }

    const recipientEmail = email.toLowerCase().trim();
    const recipientName = name ? name.trim() : 'New Member';
    const emailSubject = `🔐 Your Librio Verification Code: ${otp}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b; }
    .container { max-width: 540px; margin: 28px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #ccfbf1; }
    .badge { display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .content { padding: 32px 28px; text-align: center; }
    .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #0f172a; text-align: left; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px; text-align: left; }
    .otp-card { background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 16px; padding: 24px 16px; margin: 24px 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #0f766e; letter-spacing: 1.5px; margin-bottom: 8px; }
    .otp-code { font-family: 'SF Pro Mono', 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #115e59; margin: 0; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 500; }
    .security-notice { background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px; margin: 24px 0 12px; font-size: 12px; color: #9a3412; text-align: left; line-height: 1.5; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">🛡️ Account Security</div>
      <h1>Librio Central Library</h1>
      <p>Member Email Verification</p>
    </div>

    <div class="content">
      <div class="greeting">Hello ${recipientName},</div>
      <p class="message">
        Welcome to Librio Central Library! Please enter the One-Time Password (OTP) below on your registration screen to verify your email address and activate your membership.
      </p>

      <div class="otp-card">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">⏳ Valid for <strong>5 minutes</strong> only</div>
      </div>

      <div class="security-notice">
        🔒 <strong>Security Warning:</strong> Never share this OTP code with anyone. Librio Library staff will never ask for your verification code. If you did not request this registration, you can safely ignore this email.
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px;">Librio Central Library • Digital Circulation Desk</p>
      <p style="margin: 0;">Sent to: <strong>${recipientEmail}</strong></p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Librio Central Library - Member Email Verification

Hello ${recipientName},

Welcome to Librio Central Library!
Your One-Time Password (OTP) for account registration is:

===========================
       ${otp}
===========================

This verification code is valid for 5 minutes only.
Do not share this code with anyone.

If you did not request this registration, you can safely ignore this email.

Librio Central Library
    `.trim();

    // Check if live credentials exist
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = await createTransporter();
        const senderFrom = process.env.EMAIL_FROM || `"Librio Central Library" <${process.env.EMAIL_USER}>`;

        const info = await transporter.sendMail({
          from: senderFrom,
          to: recipientEmail,
          subject: emailSubject,
          text: textContent,
          html: htmlContent,
        });

        console.log(`✉️ [Live OTP Email Sent]: Successfully dispatched OTP to ${recipientEmail} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, live: true };
      } catch (smtpError) {
        console.error('❌ [Live SMTP Error]: Failed to dispatch via Gmail SMTP:', smtpError.message);
        console.log('\n================================================================');
        console.log(`⚠️ [Fallback to Simulated OTP Dispatch] - SMTP failed (${smtpError.message})`);
        console.log(`👉 Recipient:   ${recipientEmail} (${recipientName})`);
        console.log(`👉 6-Digit OTP: ${otp}`);
        console.log(`👉 Validity:    5 minutes`);
        console.log('================================================================\n');

        return {
          success: true,
          simulated: true,
          otp,
          warning: `Failed to deliver real email via SMTP (${smtpError.message}). Simulation mode activated.`,
        };
      }
    } else {
      console.log('\n================================================================');
      console.log(`📧 [Simulated OTP Email Dispatch] - Live credentials not set in backend/.env`);
      console.log(`👉 Recipient:   ${recipientEmail} (${recipientName})`);
      console.log(`👉 6-Digit OTP: ${otp}`);
      console.log(`👉 Validity:    5 minutes`);
      console.log(`ℹ️ [Tip]: Set EMAIL_USER & EMAIL_PASS in backend/.env for real Gmail delivery.`);
      console.log('================================================================\n');

      return {
        success: true,
        simulated: true,
        otp,
      };
    }
  } catch (error) {
    console.error('❌ [Email Service Error]: Failed to send registration OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

