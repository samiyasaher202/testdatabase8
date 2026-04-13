/**
 * Optional SMTP for package-lost alerts. Set in .env:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE (0|1), SMTP_USER, SMTP_PASS,
 *   MAIL_FROM="National Postal <noreply@example.com>"
 * If SMTP_HOST is unset, email sending is skipped (alerts still appear in-app via API).
 */

function smtpConfigured() {
  return Boolean(String(process.env.SMTP_HOST || '').trim())
}

function createTransporter() {
  if (!smtpConfigured()) return null
  let nodemailer
  try {
    nodemailer = require('nodemailer')
  } catch {
    return null
  }
  const port = Number(process.env.SMTP_PORT) || 587
  const secure = process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true'
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  })
}

/**
 * @returns {Promise<boolean>} true if sent or SMTP not used; false if send failed (caller should retry)
 */
async function sendLostPackageEmail({ to, subject, text }) {
  const from = String(process.env.MAIL_FROM || '').trim()
  if (!smtpConfigured() || !from) return true

  const transport = createTransporter()
  if (!transport) {
    console.warn('[lost_alert_mailer] nodemailer missing — run: npm install nodemailer')
    return true
  }

  await transport.sendMail({
    from,
    to,
    subject: subject || 'Package status: LOST',
    text,
  })
  return true
}

module.exports = {
  smtpConfigured,
  sendLostPackageEmail,
}
