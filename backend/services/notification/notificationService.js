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
        const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

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
     * Send Mobile SMS OTP (Fast2SMS or console fallback)
     */
    async sendSMS({ phone, otp, message }) {
        const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
        const textMessage = message || `Your FreshCart verification OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
        const apiKey = process.env.FAST2SMS_API_KEY;

        console.log(`\n======================================================`);
        console.log(`📱 [SMS DISPATCHER] Sending SMS to: +91 ${cleanPhone}`);
        console.log(`[OTP CODE]: ${otp}`);
        console.log(`[MESSAGE]: ${textMessage}`);

        if (apiKey && apiKey.trim() !== '') {
            try {
                const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                    variables_values: otp,
                    route: 'otp',
                    numbers: cleanPhone
                }, {
                    headers: {
                        'authorization': apiKey.trim()
                    },
                    timeout: 8000
                });

                console.log(`[FAST2SMS STATUS]: Delivered via Fast2SMS Gateway!`, response.data);
                console.log(`======================================================\n`);
                return { success: true, channel: 'sms', provider: 'Fast2SMS', details: response.data };
            } catch (err) {
                console.error(`[FAST2SMS ERROR]:`, err.response?.data || err.message);
                console.log(`======================================================\n`);
                return { success: true, channel: 'sms', provider: 'ConsoleFallback', devOtp: otp };
            }
        }

        console.log(`[NOTICE]: FAST2SMS_API_KEY not set in .env. OTP displayed above for instant development login.`);
        console.log(`======================================================\n`);
        return { success: true, channel: 'sms', provider: 'ConsoleFallback', devOtp: otp };
    }

    /**
     * Send Branded HTML OTP Email
     */
    async sendEmail({ to, subject, otp, name = 'Valued Customer' }) {
        const targetEmail = to.trim().toLowerCase();
        const mailSubject = subject || `FreshCart Login Verification OTP: ${otp}`;

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F7FB; margin: 0; padding: 0; }
            .container { max-width: 540px; margin: 30px auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
            .header { background-color: #00B074; padding: 32px 24px; text-align: center; color: #FFFFFF; }
            .logo-text { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
            .subtitle { font-size: 13px; opacity: 0.9; margin-top: 4px; font-weight: 600; }
            .body { padding: 36px 32px; color: #1E293B; line-height: 1.6; }
            .greeting { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
            .intro { font-size: 14px; color: #64748B; margin-bottom: 24px; }
            .otp-box { background: #F0FDF4; border: 2px dashed #00B074; border-radius: 20px; padding: 24px; text-align: center; margin: 28px 0; }
            .otp-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #00875A; margin-bottom: 8px; }
            .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #0F172A; font-family: monospace; }
            .expiry { font-size: 12px; font-weight: 700; color: #EF4444; margin-top: 8px; }
            .footer { padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #94A3B8; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo-text">🛒 FreshCart</h1>
              <p class="subtitle">Fresh Groceries & Daily Essentials Delivered in 10-15 Mins</p>
            </div>
            <div class="body">
              <div class="greeting">Hello ${name},</div>
              <p class="intro">You requested to sign in to your FreshCart account. Use the verification code below to complete your login securely:</p>
              
              <div class="otp-box">
                <div class="otp-label">Single-Use Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="expiry">⏱️ Expires in 10 minutes</div>
              </div>

              <p style="font-size: 12px; color: #64748B; margin-top: 24px;">
                If you did not request this login code, please disregard this email or secure your account.
              </p>
            </div>
            <div class="footer">
              FreshCart Hyperlocal E-Commerce Platform • Gomti Nagar / Kushinagar, UP<br/>
              Questions? Reach out to support@freshcart.com
            </div>
          </div>
        </body>
        </html>
        `;

        console.log(`\n======================================================`);
        console.log(`✉️ [EMAIL DISPATCHER] Sending Verification OTP to: ${targetEmail}`);
        console.log(`[OTP CODE]: ${otp}`);
        console.log(`[SUBJECT]: ${mailSubject}`);

        // If Nodemailer SMTP is configured, send real email
        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: `"FreshCart Security" <${process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@freshcart.com'}>`,
                    to: targetEmail,
                    subject: mailSubject,
                    text: `Your FreshCart verification OTP is: ${otp}. Valid for 10 minutes.`,
                    html: htmlContent
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
