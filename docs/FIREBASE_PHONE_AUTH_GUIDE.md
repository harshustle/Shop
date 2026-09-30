# Google Firebase Phone Authentication Setup (10,000 Free SMS / Month)

FreshCart includes built-in support for **Google Firebase Phone Authentication**, providing **10,000 SMS verifications every month completely FREE** on Google's global telecom infrastructure with enterprise reCAPTCHA bot-prevention.

---

## 1. How It Works in FreshCart

```text
[Customer enters Mobile Number]
            │
            ▼
[Client: Invisible reCAPTCHA] 
            │
            ▼
[Google Firebase Auth API sends real SMS to user's phone]
            │
            ▼
[Customer types 6-digit OTP in FreshCart UI]
            │
            ▼
[Client: confirmationResult.confirm(otp)]
            │
            ▼
[ID Token sent to Backend: POST /api/auth/firebase-login]
            │
            ▼
[Customer authenticated with FreshCart JWT Token!]
```

---

## 2. 5-Minute Setup in Firebase Console

### Step 1: Create a Firebase Project
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** or **"Create a project"** (e.g., `FreshCart`).
3. Google Analytics can be enabled or disabled as preferred. Click **Create Project**.

### Step 2: Enable Phone Authentication
1. In the left navigation bar, go to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Phone**.
4. Switch the toggle to **Enable**.
5. *(Optional for Testing)* Under **Phone numbers for testing**, add:
   - Phone: `+91 9999999999`
   - Verification code: `123456`
   (This allows instant testing without consuming SMS limits!)
6. Click **Save**.

### Step 3: Add Authorized Domains
1. In the **Authentication** section, click the **Settings** tab.
2. Select **Authorized domains**.
3. By default, `localhost` is authorized.
4. If deploying to production, click **Add domain** and enter your live domain or EC2 public IP.

### Step 4: Register Web App & Get Config Keys
1. In the left sidebar, click the **Project Settings (gear icon)**.
2. Under **Your apps**, click the **Web icon (`</>`)**.
3. App nickname: `FreshCart Web`, then click **Register app**.
4. You will see your `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "freshcart-xxxx.firebaseapp.com",
     projectId: "freshcart-xxxx",
     storageBucket: "freshcart-xxxx.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789...:web:..."
   };
   ```

### Step 5: Put Keys into `client/.env`
Open `client/.env` on your machine or server and paste the values:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=freshcart-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=freshcart-xxxx
VITE_FIREBASE_STORAGE_BUCKET=freshcart-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
VITE_FIREBASE_APP_ID=1:123456789...:web:...
```

That's it! As soon as `client/.env` has `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID`, the FreshCart login page automatically routes mobile SMS OTP through Google Firebase with 10,000 free SMS/month.

---

## 3. FreshCart Authentication Architecture

| Action | Mobile Channel | Email Channel | Authentication Type |
| :--- | :--- | :--- | :--- |
| **Signup (Registration)** | 💬 **SMS OTP** (Firebase / Gateway) | ✉️ **Email OTP** (Nodemailer HTML) | **OTP Verification + Set Password** |
| **Routine Login** | 🔑 Mobile + Password | 🔑 Email + Password | **Password Verification** (Instant) |
| **Forgot Password** | 💬 **SMS OTP** (6-digit code) | ✉️ **Email OTP** (6-digit code) | **OTP Verification + Reset Password** |
| **Admin Direct** | 👑 `9161955178` | &mdash; | **Password**: `admin` |

---

## 4. Automatic Fallback Mechanism
If Firebase credentials are left blank in `.env`, the system does NOT crash:
- It seamlessly falls back to the backend SMS dispatcher (Fast2SMS or local developer mode banner), allowing you to develop and test offline uninterrupted.
