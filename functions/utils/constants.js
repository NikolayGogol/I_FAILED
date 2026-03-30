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

module.exports = {
  APP_NAME,
  LOGO_URL,
  colors,
  VERIFY_LINK: process.env.VERIFY_LINK
}
