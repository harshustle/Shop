/**
 * Migration 003: Seed SuperAdmin User
 * Provisions the default SuperAdmin credentials (9161955178 / admin) with bcrypt hash
 */
const bcrypt = require('bcrypt');

module.exports = {
    name: '003_seed_superadmin_user',
    up: async (db) => {
        console.log('  -> Checking SuperAdmin user account...');
        const existing = await db.collection('users').findOne({ phone: '9161955178' });

        const hashedPassword = await bcrypt.hash('admin', 10);

        if (!existing) {
            await db.collection('users').insertOne({
                phone: '9161955178',
                email: 'admin@shop.local',
                fullName: 'Harsh Srivastava',
                password: hashedPassword,
                role: 'admin',
                metadata: { isSuperAdmin: true, department: 'Executive Store Operations' },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('  ✓ SuperAdmin user created (Phone: 9161955178, Name: Harsh Srivastava).');
        } else {
            await db.collection('users').updateOne(
                { phone: '9161955178' },
                {
                    $set: {
                        role: 'admin',
                        password: hashedPassword,
                        fullName: 'Harsh Srivastava',
                        updatedAt: new Date()
                    }
                }
            );
            console.log('  ✓ SuperAdmin credentials verified and name set to Harsh Srivastava.');
        }
    },

    down: async (db) => {
        // Rollback if necessary
    }
};
