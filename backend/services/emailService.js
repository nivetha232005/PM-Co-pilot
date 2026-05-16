// services/emailService.js
// Reusable email service using Nodemailer + Gmail SMTP (App Password)
// All functions are async and log results to EmailLog collection.

const nodemailer = require('nodemailer');
const EmailLog   = require('../models/EmailLog');

// ── Transporter (created once, reused) ──────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // Gmail App Password (16 chars, no spaces)
  },
  tls: { rejectUnauthorized: false },
});

// ── Base HTML email template ─────────────────────────────────────────────────
function buildHtmlEmail({ userName, subject, heading, bodyHtml, dashboardUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header  { background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px 40px; color:#fff; }
    .header h1 { margin:0; font-size:22px; font-weight:700; letter-spacing:-0.5px; }
    .header p  { margin:6px 0 0; opacity:0.85; font-size:14px; }
    .body    { padding:32px 40px; color:#374151; line-height:1.7; }
    .body h2 { margin-top:0; font-size:18px; color:#111827; }
    .cta-btn { display:inline-block; margin-top:24px; padding:12px 28px; background:#6366f1; color:#fff; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; }
    .footer  { background:#f9fafb; border-top:1px solid #e5e7eb; padding:20px 40px; font-size:12px; color:#9ca3af; text-align:center; }
    .badge   { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; background:#ede9fe; color:#7c3aed; margin-bottom:12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>◈ PM Copilot</h1>
      <p>Your AI-powered project management assistant</p>
    </div>
    <div class="body">
      <p>Hi <strong>${userName || 'there'}</strong>,</p>
      ${bodyHtml}
      ${dashboardUrl ? `<a href="${dashboardUrl}" class="cta-btn">Open Dashboard →</a>` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PM Copilot &nbsp;·&nbsp; Sent on ${new Date().toLocaleString()}</p>
      <p>You received this because you have an account on PM Copilot.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Core send function ───────────────────────────────────────────────────────
async function sendEmail({ to, subject, userName, bodyHtml, dashboardUrl }) {
  const html = buildHtmlEmail({ userName, subject, heading: subject, bodyHtml, dashboardUrl });

  let status = 'sent';
  let errorMsg = '';

  try {
    await transporter.sendMail({
      from:    `"PM Copilot" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent → ${to} | "${subject}"`);
  } catch (err) {
    status   = 'failed';
    errorMsg = err.message;
    console.error(`❌ Email failed → ${to} | ${err.message}`);
  }

  // Log every attempt (don't await — fire & forget)
  EmailLog.create({ to, subject, status, error: errorMsg }).catch(() => {});

  return status === 'sent';
}

// ── Named email triggers ─────────────────────────────────────────────────────

/**
 * Send a welcome email after Google login (first-time users).
 */
async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to PM Copilot! 🎉',
    userName: user.name,
    bodyHtml: `
      <div class="badge">NEW ACCOUNT</div>
      <h2>You're all set!</h2>
      <p>Your PM Copilot account is ready. Start uploading project documents, chatting with your AI copilot, and tracking risks & tasks — all in one place.</p>
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>📄 Upload project PDFs for instant AI analysis</li>
        <li>💬 Ask your AI Copilot anything about your project</li>
        <li>📊 View tasks, risks, and timelines on the Dashboard</li>
      </ul>
    `,
    dashboardUrl: process.env.CLIENT_URL,
  });
}

/**
 * Send an email when a new project update / announcement is posted.
 */
async function sendProjectUpdateEmail(user, update) {
  return sendEmail({
    to: user.email,
    subject: `📢 New ${update.type.charAt(0).toUpperCase() + update.type.slice(1)}: ${update.title}`,
    userName: user.name,
    bodyHtml: `
      <div class="badge">${update.type.toUpperCase()}</div>
      <h2>${update.title}</h2>
      <p>${update.description}</p>
      <p style="color:#9ca3af;font-size:12px;">Posted on ${new Date(update.createdAt).toLocaleString()}</p>
    `,
    dashboardUrl: process.env.CLIENT_URL,
  });
}

/**
 * Send bulk emails to a list of users (e.g., all users on admin update).
 * Sends in parallel with Promise.allSettled so one failure doesn't block others.
 */
async function sendBulkEmail(users, { subject, buildBodyHtml }) {
  const results = await Promise.allSettled(
    users.map(user =>
      sendEmail({
        to:          user.email,
        subject,
        userName:    user.name,
        bodyHtml:    buildBodyHtml(user),
        dashboardUrl: process.env.CLIENT_URL,
      })
    )
  );

  const sent   = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - sent;
  console.log(`📧 Bulk email complete: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendProjectUpdateEmail,
  sendBulkEmail,
};
