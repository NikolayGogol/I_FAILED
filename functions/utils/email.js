const sgMail = require('@sendgrid/mail')
const logger = require('firebase-functions/logger')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FROM_EMAIL = process.env.EMAIL_USER
//
async function sendWelcomeEmail (email, displayName) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome, ${displayName}!</h2>
      <p>Thank you for joining our application. We are excited to have you on board.</p>
    </div>
  `
  return sendEmail({ to: email, subject: 'Welcome to Our App!', html })
}

async function sendEmail ({ to, subject, html }) {
  const msg = { to, from: FROM_EMAIL, subject, html }
  try {
    await sgMail.send(msg)
    logger.info(`Email sent to ${to}. Subject: ${subject}`)
    return { success: true }
  } catch (error) {
    logger.error('SendGrid Error:', error.response ? error.response.body : error)
    throw new Error('Failed to send email via SendGrid')
  }
}

module.exports = { sendWelcomeEmail }
