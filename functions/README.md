# Firebase Cloud Functions - OTP Password Reset

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Email Service

You need to set up environment variables for email sending. Create a `.env` file in the `functions` directory or set them in Firebase Functions config:

#### Option 1: Gmail SMTP (Recommended for testing)

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Set environment variables:

```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
firebase functions:config:set email.from="your-email@gmail.com"
```

#### Option 2: Custom SMTP Server

```bash
firebase functions:config:set smtp.host="smtp.yourdomain.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set email.user="noreply@yourdomain.com"
firebase functions:config:set email.password="your-password"
firebase functions:config:set email.from="noreply@yourdomain.com"
```

#### Option 3: Use Environment Variables (for local development)

Create `functions/.env` file:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### 3. Deploy Functions

```bash
firebase deploy --only functions
```

### 4. API Endpoints

#### Send OTP Code
```
POST /api/sendPasswordResetOTP
Body: { "email": "user@example.com" }
```

#### Verify OTP Code
```
POST /api/verifyPasswordResetOTP
Body: { "email": "user@example.com", "code": "123456" }
```

#### Reset Password with OTP
```
POST /api/resetPasswordWithOTP
Body: { 
  "email": "user@example.com", 
  "code": "123456", 
  "newPassword": "newpassword123" 
}
```

#### Cleanup Expired OTPs (Optional - for maintenance)
```
POST /api/cleanupExpiredOTPs
```

### 5. Firestore Collection

The functions use a Firestore collection called `passwordResetOTPs` to store OTP codes. Make sure Firestore is enabled in your Firebase project.

### 6. Security Rules

Add Firestore security rules to protect the OTP collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /passwordResetOTPs/{email} {
      // Only allow server-side access
      allow read, write: if false;
    }
  }
}
```

### 7. Testing Locally

```bash
cd functions
npm run dev
```

The functions will be available at `http://localhost:5001/your-project-id/us-central1/api`

## Notes

- OTP codes expire after 10 minutes
- Maximum 5 verification attempts per OTP code
- OTP codes are automatically cleaned up after expiration
- Email templates can be customized in the `sendOTPEmail` function
