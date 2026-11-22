/** Migration 003: provision the single store-owner account from secrets. */
const bcrypt = require('bcryptjs');

module.exports = {
    name: '003_seed_superadmin_user',
    up: async (db) => {
        const phone = (process.env.SUPER_ADMIN_PHONE || '9161955178').replace(/\D/g, '').slice(-10);
        const email = (process.env.SUPER_ADMIN_EMAIL || 'harshustle@gmail.com').trim().toLowerCase();
        const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
        const users = db.collection('users');
        const existingOwner = await users.findOne({ phone });

        // Bootstrap credentials are needed only for first-time provisioning.
        // Re-running deployments must never require or reset the owner's password.
        if (!existingOwner && (!bootstrapPassword || bootstrapPassword.length < 12)) {
            throw new Error('ADMIN_BOOTSTRAP_PASSWORD (minimum 12 characters) is required to provision the store owner');
        }

        await users.updateMany(
            { role: 'admin', phone: { $ne: phone } },
            { $set: { role: 'customer', updatedAt: new Date() } }
        );
        const ownerFields = {
            email,
            fullName: 'harshustle',
            role: 'admin',
            isActive: true,
            isPhoneVerified: true,
            updatedAt: new Date()
        };
        if (!existingOwner) {
            ownerFields.password = await bcrypt.hash(bootstrapPassword, 12);
        }

        await users.updateOne(
            { phone },
            {
                $set: ownerFields,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
        console.log(`  Store owner secured for phone ending ${phone.slice(-4)}.`);
    },
    down: async () => {}
};
