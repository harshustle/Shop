const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
    constructor() {
        this.transporter = null;
        this.initEmailTransporter();
    }

    /**
     * Initialize Nodemailer SMTP Transporter
     * Supports Gmail App Passwords, Brevo, SendGrid, or any standard SMTP
     */
    initEmailTransporter() {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT || 587;
        const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
        const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

        if (smtpUser && smtpPass) {
            if (process.env.GMAIL_USER) {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: smtpUser,
                        pass: smtpPass
                    }
                });
            } else {
                this.transporter = nodemailer.createTransport({
                    host: smtpHost || 'smtp.gmail.com',
                    port: Number(smtpPort),
                    secure: Number(smtpPort) === 465,
                    auth: {
                        user: smtpUser,
                        pass: smtpPass
                    }
                });
            }
            console.log('[NotificationService] SMTP Email Transporter initialized with:', smtpUser);
        } else {
            this.transporter = null;
        }
    }

    /**
     * Send Mobile SMS OTP
     * Sends transactional SMS through APITxT's unified OTP endpoint.
     * Development keeps a console fallback so local testing is still possible.
     */
    async sendSMS({ phone, otp }) {
        const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);

        const apiUrl = (process.env.APITXT_API_URL || 'https://apitxt.com/api/sendOTP').trim();
        const authKey = (process.env.APITXT_AUTH_KEY || process.env.APITXT_API_KEY || '').trim();
        const templateId = (process.env.APITXT_TEMPLATE_ID || '').trim();
        const isProduction = process.env.NODE_ENV === 'production';
        const missingSettings = authKey ? [] : ['APITXT_AUTH_KEY'];

        if (missingSettings.length === 0) {
            try {
                const form = new URLSearchParams({
                    authkey: authKey,
                    mobile: `91${cleanPhone}`,
                    otp: otp.toString(),
                    channel: 'sms',
                    country: '91'
                });
                if (templateId) form.set('template_id', templateId);

                const response = await axios.post(apiUrl, form.toString(), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 15000
                });

                if (response.data?.status !== 'success') {
                    throw new Error(response.data?.message || 'APITxT rejected the SMS request');
                }

                console.log(`[SMS] APITxT accepted OTP message for +91${cleanPhone}; request: ${response.data?.data?.request_id || 'unknown'}`);
                return {
                    success: true,
                    channel: 'sms',
                    provider: 'APITxT',
                    requestId: response.data?.data?.request_id
                };
            } catch (error) {
                const providerError = error.response?.data?.message || error.message;
                console.error(`[SMS] APITxT dispatch failed for +91${cleanPhone}: ${providerError}`);
                throw new Error(`SMS provider failed: ${providerError}`);
            }
        }

        if (isProduction) {
            throw new Error('APITxT authentication key is missing');
        }

        console.warn(`[SMS DEV FALLBACK] APITxT is incomplete (${missingSettings.join(', ')}). OTP for +91${cleanPhone}: ${otp}`);
        return {
            success: true,
            channel: 'sms',
            provider: 'ConsoleFallback',
            devOtp: otp
        };
    }

    /**
     * Send Branded HTML OTP Email
     */
    async sendEmail({ to, subject, otp, name = 'Valued Customer' }) {
        const targetEmail = to.trim().toLowerCase();
        const mailSubject = subject || `FreshCart Login Verification OTP: ${otp}`;

        const htmlContent = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #00B074;">
            <h1 style="color: #00B074; font-size: 24px; margin: 0; font-weight: 800;">🛒 FreshCart</h1>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Fresh Groceries Delivered in 10-15 Minutes</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px 0;">Hello <b>${name}</b>,</p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0; line-height: 1.5;">Use the single-use verification code below to verify your FreshCart account:</p>
            <div style="background-color: #f0fdf4; border: 2px dashed #00B074; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #00875a; display: block; margin-bottom: 6px; letter-spacing: 1px;">Verification OTP Code</span>
              <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${otp}</span>
              <span style="font-size: 12px; color: #ef4444; display: block; margin-top: 8px; font-weight: 600;">⏱️ Valid for 10 minutes</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0;">If you did not request this verification code, please ignore this email.</p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            FreshCart Hyperlocal Platform • Security Team
          </div>
        </div>
        `;

        console.log(`\n======================================================`);
        console.log(`✉️ [EMAIL DISPATCHER] Sending Verification OTP to: ${targetEmail}`);
        console.log(`[OTP CODE]: ${otp}`);
        console.log(`[SUBJECT]: ${mailSubject}`);

        // If Nodemailer SMTP is configured, send real email
        if (this.transporter) {
            try {
                const senderEmail = process.env.GMAIL_USER || 'hsrivastav099@gmail.com';
                const senderAddress = `"FreshCart" <${senderEmail}>`;

                const info = await this.transporter.sendMail({
                    from: senderAddress,
                    to: targetEmail,
                    replyTo: senderEmail,
                    subject: mailSubject,
                    text: `Hello ${name},\n\nYour FreshCart verification code is: ${otp}\nThis code is valid for 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
                    html: htmlContent,
                    priority: 'high',
                    headers: {
                        'X-Priority': '1',
                        'X-MSMail-Priority': 'High',
                        'Importance': 'High'
                    }
                });

                console.log(`[SMTP EMAIL STATUS]: Successfully sent via SMTP! MessageID: ${info.messageId}`);
                console.log(`======================================================\n`);
                return { success: true, channel: 'email', messageId: info.messageId };
            } catch (err) {
                console.error(`[SMTP EMAIL ERROR]:`, err.message);
                console.log(`======================================================\n`);
                return { success: true, channel: 'email', provider: 'ConsoleFallback', devOtp: otp };
            }
        }

        console.log(`[NOTICE]: SMTP credentials not set in .env. OTP displayed above for instant development login.`);
        console.log(`======================================================\n`);
        return { success: true, channel: 'email', provider: 'ConsoleFallback', devOtp: otp };
    }
}

module.exports = new NotificationService();
