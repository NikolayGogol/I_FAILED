const sgMail = require('@sendgrid/mail')
const logger = require('firebase-functions/logger')

const APP_NAME = 'IFELL'
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/ifailed-25dab.firebasestorage.app/o/Logo.png?alt=media&token=5597847f-b4fa-4d32-b193-5f8a6bcdf771'

// Define your brand colors here
const colors = {
  primary: '#D65A1F',
  textPrimary: '#1C1C1B',
  textSecondary: '#454541',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#DCDCD8',
}

// Function to validate environment variables
function validateEnv () {
  if (!process.env.SENDGRID_API_KEY) {
    logger.error('SENDGRID_API_KEY is not set in environment variables.')
    throw new Error('Email service configuration error: Missing API Key.')
  }
  if (!process.env.EMAIL_USER) {
    logger.error('EMAIL_USER is not set in environment variables.')
    throw new Error('Email service configuration error: Missing Sender Email.')
  }
}

// Initialize SendGrid with API Key
try {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  }
} catch (error) {
  logger.error('Error initializing SendGrid:', error)
}

async function sendVerificationEmail (email, verificationLink) {
  validateEnv()

  const subject = `Verify your email for ${APP_NAME}`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 8px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">Welcome to ${APP_NAME} 👋</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              Please verify your email address to finish setting up your account.
            </p>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${verificationLink}"
              target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                Verify email
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 16px;font-size:12px;word-break:break-all;color:${colors.textPrimary};">
              ${verificationLink}
            </p>
            <p style="margin:0 0 4px;font-size:12px;color:${colors.textSecondary};">
              If you didn’t create an account, you can safely ignore this email.
            </p>
          </div>
          <div style="padding:12px 24px 16px;border-top:1px solid ${colors.border};text-align:center;">
            <p style="margin:4px 0;font-size:11px;color:${colors.textSecondary};">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
  `
  const text = `
    Welcome to ${APP_NAME}!\n\nPlease copy and paste the following link in your browser to verify your email address:\n\n${verificationLink}\n\nIf you did not request this, please ignore this email.
  `
  return sendEmail({ to: email, subject, html, text })
}

async function sendWelcomeEmail (email, displayName) {
  validateEnv()

  const subject = `Welcome to ${APP_NAME}!`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">Welcome, ${displayName || 'there'} 👋</h2>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              Thanks for joining <strong>${APP_NAME}</strong>. This is your space to share failures, lessons learned, and help others avoid the same mistakes.
            </p>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              You can start by creating your first post or exploring what others have shared in the feed.
            </p>
            <div style="text-align:center;margin:24px 0 8px;">
              <a href="${process.env.VERIFY_LINK || '#'}"
              target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                Go to feed
              </a>
            </div>
          </div>
          <div style="padding:12px 24px 16px;border-top:1px solid ${colors.border};text-align:center;">
            <p style="margin:4px 0;font-size:11px;color:${colors.textSecondary};">
              You’re receiving this email because you signed up for ${APP_NAME}.
            </p>
          </div>
        </div>
      </div>
    </body>
  `
  const text = `
Welcome, ${displayName}!

Thank you for joining our application. We are excited to have you on board.

You are receiving this email because you signed up on ${APP_NAME}.
  `
  return sendEmail({ to: email, subject, html, text })
}

async function sendOTPEmail (email, otp) {
  validateEnv()

  const subject = `Your verification code for ${APP_NAME}`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">Reset your password</h2>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              You requested to reset your password. Use the verification code below to continue.
            </p>
            <div style="background-color:${colors.background};padding:18px 24px;text-align:center;margin:20px 0;border-radius:12px;">
              <span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:10px;color:${colors.primary};">
                ${otp}
              </span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:${colors.textSecondary};">
              This code will expire in <strong>15 minutes</strong>. If you didn’t request a password reset, you can safely ignore this email.
            </p>
          </div>
          <div style="padding:12px 24px 16px;border-top:1px solid ${colors.border};text-align:center;">
            <p style="margin:4px 0;font-size:11px;color:${colors.textSecondary};">
              Need help? Reply to this email and our team will get back to you.
            </p>
          </div>
        </div>
      </div>
    </body>
  `
  const text = `
    Your verification code for ${APP_NAME} is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.
  `
  return sendEmail({ to: email, subject, html, text })
}

async function sendEmail ({ to, subject, html, text }) {
  const msg = {
    to,
    from: {
      email: process.env.EMAIL_USER,
      name: APP_NAME,
    },
    subject,
    text,
    html,
  }

  try {
    await sgMail.send(msg)
    logger.info(`Email sent to ${to}. Subject: ${subject}`)
    return { success: true }
  } catch (error) {
    logger.error('SendGrid Error:', error)

    if (error.response) {
      logger.error('SendGrid Response Body:', error.response.body)
    }

    throw new Error('Failed to send email via SendGrid')
  }
}

module.exports = { sendWelcomeEmail, sendVerificationEmail, sendOTPEmail, sendEmail }
