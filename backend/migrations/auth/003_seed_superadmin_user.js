/** Migration 003: provision the single store-owner account from secrets. */
const bcrypt = require('bcryptjs');

module.exports = {
    name: '003_seed_superadmin_user',
    up: async (db) => {
        const phone = (process.env.SUPER_ADMIN_PHONE || '9161955178').replace(/\D/g, '').slice(-10);
        const email = (process.env.SUPER_ADMIN_EMAIL || 'harshustle@gmail.com').trim().toLowerCase();
        const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
        if (!bootstrapPassword || bootstrapPassword.length < 12) {
            throw new Error('ADMIN_BOOTSTRAP_PASSWORD (minimum 12 characters) is required to provision the store owner');
        }

        const hashedPassword = await bcrypt.hash(bootstrapPassword, 12);
        await db.collection('users').updateMany(
            { role: 'admin', phone: { $ne: phone } },
            { $set: { role: 'customer', updatedAt: new Date() } }
        );
        await db.collection('users').updateOne(
            { phone },
            {
                $set: {
                    email,
                    fullName: 'harshustle',
                    password: hashedPassword,
                    role: 'admin',
                    isActive: true,
                    isPhoneVerified: true,
                    updatedAt: new Date()
                },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
        console.log(`  Store owner secured for phone ending ${phone.slice(-4)}.`);
    },
    down: async () => {}
};
