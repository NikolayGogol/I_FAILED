const sgMail = require('@sendgrid/mail')
const logger = require('firebase-functions/logger')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FROM_EMAIL = process.env.EMAIL_USER
const APP_NAME = 'I_FAILED'

async function sendVerificationEmail (email, verificationLink) {
  const subject = `Verify your email for ${APP_NAME}`
  const html = `
    <body style="margin:0;padding:0;background-color:#f8fafc;">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
            <span style="font-weight:700;font-size:18px;color:#0f172a;">${APP_NAME}</span>
          </div>
          <div style="padding:24px 24px 8px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Welcome to ${APP_NAME} 👋</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
              Please verify your email address to finish setting up your account.
            </p>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${verificationLink}"
                 style="display:inline-block;background-color:#1e293b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                Verify email
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#94a3b8;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 16px;font-size:12px;word-break:break-all;color:#0f172a;">
              ${verificationLink}
            </p>
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
              If you didn’t create an account, you can safely ignore this email.
            </p>
          </div>
          <div style="padding:12px 24px 16px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:4px 0;font-size:11px;color:#94a3b8;">
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
  const subject = `Welcome to ${APP_NAME}!`
  const html = `
    <body style="margin:0;padding:0;background-color:#f8fafc;">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
            <span style="font-weight:700;font-size:18px;color:#0f172a;">${APP_NAME}</span>
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Welcome, ${displayName || 'there'} 👋</h2>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#64748b;">
              Thanks for joining <strong>${APP_NAME}</strong>. This is your space to share failures, lessons learned, and help others avoid the same mistakes.
            </p>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#64748b;">
              You can start by creating your first post or exploring what others have shared in the feed.
            </p>
            <div style="text-align:center;margin:24px 0 8px;">
              <a href="${process.env.APP_URL || '#'}"
                 style="display:inline-block;background-color:#1e293b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                Go to feed
              </a>
            </div>
          </div>
          <div style="padding:12px 24px 16px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:4px 0;font-size:11px;color:#94a3b8;">
              You’re receiving this email because you signed up for ${APP_NAME}.
            </p>
            <p style="margin:4px 0;font-size:11px;color:#cbd5e1;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
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
  const subject = `Your verification code for ${APP_NAME}`
  const html = `
    <body style="margin:0;padding:0;background-color:#f8fafc;">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
            <span style="font-weight:700;font-size:18px;color:#0f172a;">${APP_NAME}</span>
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Reset your password</h2>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#64748b;">
              You requested to reset your password. Use the verification code below to continue.
            </p>
            <div style="background-color:#f1f5f9;padding:18px 24px;text-align:center;margin:20px 0;border-radius:12px;">
              <span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:10px;color:#1e293b;">
                ${otp}
              </span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
              This code will expire in <strong>15 minutes</strong>. If you didn’t request a password reset, you can safely ignore this email.
            </p>
          </div>
          <div style="padding:12px 24px 16px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:4px 0;font-size:11px;color:#94a3b8;">
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
  if (!process.env.SENDGRID_API_KEY || !FROM_EMAIL) {
    logger.error('SENDGRID_API_KEY or FROM_EMAIL is not set.')
    throw new Error('Email service is not configured.')
  }

  const msg = {
    to,
    from: {
      name: APP_NAME,
      email: FROM_EMAIL,
    },
    subject,
    html,
    text,
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

module.exports = { sendWelcomeEmail, sendVerificationEmail, sendOTPEmail, sendEmail }
