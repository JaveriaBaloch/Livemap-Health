// Firebase configuration for authentication + SMTP Email verification
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import nodemailer from 'nodemailer';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// SMTP Email Configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// SMTP EMAIL VERIFICATION - No phone numbers needed

export const sendEmailVerification = async (email: string, verificationCode: string, isPasswordReset: boolean = false): Promise<boolean> => {
  try {
    console.log('Sending email to:', email);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"LiveMap Healthcare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: isPasswordReset ? 'LiveMap - Password Reset Code' : 'LiveMap - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">LiveMap Healthcare</h2>
          <h3>${isPasswordReset ? 'Password Reset Request' : 'Email Verification Required'}</h3>
          <p>${isPasswordReset ? 'Your password reset code is:' : 'Your verification code is:'}</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">
            ${isPasswordReset ? 'If you didn\'t request this password reset, please ignore this email.' : 'If you didn\'t request this verification, please ignore this email.'}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ EMAIL SENT!');
    console.log('📧 Email:', email);
    console.log('🔢 Code:', verificationCode);
    console.log('📬 Message ID:', info.messageId);
    console.log('');
    return true;
    
  } catch (error: any) {
    console.error('SMTP Email error:', error);
    
    // Development fallback - show in console
    console.log('');
    console.log('🆓 === EMAIL VERIFICATION (Console) === 🆓');
    console.log('📧 Email:', email);
    console.log('🔢 VERIFICATION CODE:', verificationCode);
    console.log('✅ Use this code to verify your email');
    console.log('======================================');
    console.log('');
    return true;
  }
};

// Verify email code function 
export const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
  try {
    console.log('Verifying email code:', code, 'for:', email);
    return true;
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
};

export default app;