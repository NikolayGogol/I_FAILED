const sgMail = require('@sendgrid/mail')
const logger = require('firebase-functions/logger')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FROM_EMAIL = process.env.EMAIL_USER
const APP_NAME = 'I_FAILED' // Using project name as a default

async function sendWelcomeEmail (email, displayName) {
  const subject = `Welcome to ${APP_NAME}!`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome, ${displayName}!</h2>
      <p>Thank you for joining our application. We are excited to have you on board.</p>
      <br>
      <p style="font-size: 12px; color: #888;">You are receiving this email because you signed up on ${APP_NAME}.</p>
    </div>
  `
  const text = `
Welcome, ${displayName}!

Thank you for joining our application. We are excited to have you on board.

You are receiving this email because you signed up on ${APP_NAME}.
  `
  return sendEmail({ to: email, subject, html, text })
}

async function sendEmail ({ to, subject, html, text }) {
  if (!process.env.SENDGRID_API_KEY || !FROM_EMAIL) {
    logger.error('SENDGRID_API_KEY or FROM_EMAIL is not set.')
    throw new Error('Email service is not configured.')
  }

  const msg = {
    to,
    from: {
        name: APP_NAME,
        email: FROM_EMAIL
    },
    subject,
    html,
    text, // Plain text version of the email
  }

  try {
    await sgMail.send(msg)
    logger.info(`Email sent to ${to}. Subject: ${subject}`)
    return { success: true }
  } catch (error) {
    logger.error('SendGrid Error:', error.response ? error.response.body : error)
    throw new Error('Failed to send email via SendGrid')
  }
}

module.exports = { sendWelcomeEmail, sendEmail }
