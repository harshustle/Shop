require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { connectDB, disconnectDB } = require('../../config/db');
const User = require('../../models/auth/User');

const phone = (process.env.SUPER_ADMIN_PHONE || '9161955178').replace(/\D/g, '').slice(-10);
const email = (process.env.SUPER_ADMIN_EMAIL || 'harshustle@gmail.com').trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

async function run() {
    if (!password || password.length < 12) {
        throw new Error('ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters');
    }

    await connectDB();
    await User.updateMany({ role: 'admin', phone: { $ne: phone } }, { $set: { role: 'customer' } });

    let owner = await User.findOne({ phone });
    if (!owner) owner = new User({ phone, fullName: 'harshustle' });
    owner.fullName = 'harshustle';
    owner.email = email;
    owner.password = password;
    owner.role = 'admin';
    owner.isActive = true;
    owner.isPhoneVerified = true;
    await owner.save();

    console.log(`Store owner secured for phone ending ${phone.slice(-4)}; all other admin roles removed.`);
}

run()
    .then(disconnectDB)
    .catch(async (error) => {
        console.error(error.message);
        await disconnectDB();
        process.exitCode = 1;
    });
