const sgMail = require('@sendgrid/mail')
const { logger } = require('firebase-functions')
const {
  colors,
  APP_NAME,
  LOGO_URL,
  VERIFY_LINK,
} = require('./constants')

function validateEnv () {
  if (!process.env.EMAIL_USER || !process.env.SENDGRID_API_KEY) {
    throw new Error('Missing environment variables for email sending.')
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

function renderMentionsInEmail (text) {
  if (!text) {
    return ''
  }
  const baseUrl = process.env.VERIFY_LINK
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
  return text.replace(
    mentionRegex,
    `<a href="${baseUrl}/user-info/$2" style="font-weight:bold;color:${colors.primary};text-decoration:none;">@$1</a>`,
  )
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
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">Welcome, ${displayName}!</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              We're excited to have you on board. Get ready to explore a world of ideas and connect with others.
            </p>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${VERIFY_LINK}"
                 target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                Get Started
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              If you have any questions, feel free to reach out to our support team.
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
  const text = `Welcome, ${displayName}!\n\nWe're excited to have you on board. Get started by visiting: ${VERIFY_LINK}`
  return sendEmail({ to: email, subject, html, text })
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
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">Verify Your Email</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              Please click the button below to verify your email address and complete your registration.
            </p>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${verificationLink}"
                 target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                Verify Email
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              If you did not request this, please ignore this email.
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
  const text = `Please verify your email by clicking this link: ${verificationLink}`
  return sendEmail({ to: email, subject, html, text })
}

async function sendOTPEmail (email, otp) {
  validateEnv()

  const subject = `Your One-Time Password for ${APP_NAME}`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">Your One-Time Password</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              Use the following One-Time Password (OTP) to complete your action. This OTP is valid for 10 minutes.
            </p>
            <div style="background-color:${colors.background};padding:18px 24px;margin:20px 0;border-radius:12px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:4px;color:${colors.textPrimary};">
                ${otp}
              </p>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              If you did not request this, please ignore this email.
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
  const text = `Your One-Time Password is: ${otp}`
  return sendEmail({ to: email, subject, html, text })
}

async function sendLikeNotificationEmail (email, displayName, postTitle, postLink) {
  validateEnv()

  const subject = `Someone liked your post!`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">Your Post Got a Like!</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              Great news! <strong>${displayName}</strong> liked your post: <em>"${postTitle}"</em>.
            </p>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${postLink}"
                 target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                View Post
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              Keep creating great content! You can manage your email notification preferences in your settings.
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
  const text = `${displayName} liked your post: "${postTitle}". View it here: ${postLink}`
  return sendEmail({ to: email, subject, html, text })
}

async function sendCommentNotificationEmail (email, displayName, postTitle, commentText, postLink) {
  validateEnv()
  const renderedCommentText = renderMentionsInEmail(commentText)

  const subject = `You have a new comment on your post!`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">New Comment on Your Post</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              <strong>${displayName}</strong> commented on your post: <em>"${postTitle}"</em>.
            </p>
            <div style="background-color:${colors.background};padding:18px 24px;margin:20px 0;border-radius:12px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:${colors.textPrimary};">
                "${renderedCommentText}"
              </p>
            </div>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${postLink}"
                 target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                View Comment
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              You can manage your email notification preferences in your settings.
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
  const text = `${displayName} commented on your post: "${postTitle}".\n\nComment: "${commentText}"\n\nView the comment here: ${postLink}`
  return sendEmail({ to: email, subject, html, text })
}

async function sendMentionNotificationEmail (email, mentionerName, postTitle, commentText, postLink) {
  validateEnv()
  const renderedCommentText = renderMentionsInEmail(commentText)

  const subject = `You were mentioned in a comment!`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">You Were Mentioned!</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              <strong>${mentionerName}</strong> mentioned you in a comment on the post: <em>"${postTitle}"</em>.
            </p>
            <div style="background-color:${colors.background};padding:18px 24px;margin:20px 0;border-radius:12px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:${colors.textPrimary};">
                "${renderedCommentText}"
              </p>
            </div>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${postLink}"
                 target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                View Comment
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              You can manage your email notification preferences in your settings.
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
    ${mentionerName} mentioned you in a comment on the post: "${postTitle}".\n\nComment: "${commentText}"\n\nView the comment here: ${postLink}\n\nYou can manage your email notification preferences in your settings.
  `
  return sendEmail({ to: email, subject, html, text })
}

async function sendFollowerNotificationEmail (email, followerName, followerProfileLink) {
  validateEnv()

  const subject = `You have a new follower!`
  const html = `
    <body style="margin:0;padding:0;background-color:${colors.background};">
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:640px; margin:24px auto; padding:0 16px;">
        <div style="background:${colors.surface};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.1);overflow:hidden;border:1px solid ${colors.border};">
          <div style="padding:20px 24px;border-bottom:1px solid ${colors.border};">
            <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="height:32px;">
          </div>
          <div style="padding:24px 24px 16px;">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.textPrimary};">You Have a New Follower!</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${colors.textSecondary};">
              <strong>${followerName}</strong> is now following you.
            </p>
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${followerProfileLink}"
                 target="_blank"
                 style="display:inline-block;background-color:${colors.primary};color:${colors.surface};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">
                View Their Profile
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${colors.textSecondary};">
              You can manage your email notification preferences in your settings.
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
  const text = `${followerName} is now following you. View their profile here: ${followerProfileLink}`
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

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendOTPEmail,
  sendEmail,
  sendLikeNotificationEmail,
  sendCommentNotificationEmail,
  sendMentionNotificationEmail,
  sendFollowerNotificationEmail,
}
