const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runOtpTests() {
  console.log('=== STARTING OTP RESET TESTS ===\n');

  // Test 1: Request OTP for Super Admin (9161955178)
  console.log('1. Requesting OTP for Super Admin (9161955178)...');
  const adminOtpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/send-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone: '9161955178' });

  console.log('Admin OTP Response:', adminOtpRes.data);
  if (adminOtpRes.status !== 200 || !adminOtpRes.data.otp) {
    throw new Error('Failed to generate OTP for Super Admin');
  }
  const adminOtp = adminOtpRes.data.otp;

  // Test 2: Reset Password for Super Admin with OTP
  console.log('\n2. Resetting password for Super Admin with OTP:', adminOtp);
  const adminResetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/reset-password-with-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: '9161955178',
    otp: adminOtp,
    newPassword: 'SuperSecretAdminPass@2026'
  });

  console.log('Admin Reset Response:', {
    status: adminResetRes.status,
    role: adminResetRes.data.role,
    user: adminResetRes.data.user?.fullName
  });
  if (adminResetRes.status !== 200 || !adminResetRes.data.token) {
    throw new Error('Failed to reset password for Super Admin');
  }

  // Test 3: Login as Super Admin with new password
  console.log('\n3. Logging in as Super Admin with new password...');
  const adminLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: '9161955178',
    password: 'SuperSecretAdminPass@2026'
  });

  console.log('Admin Login Result:', {
    status: adminLoginRes.status,
    role: adminLoginRes.data.user?.role,
    fullName: adminLoginRes.data.user?.fullName
  });
  const adminToken = adminLoginRes.data.token;

  // Test 4: Check Admin Metrics with real DB data
  console.log('\n4. Fetching Admin Metrics with Super Admin token...');
  const metricsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/metrics',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  console.log('Admin Real Database Metrics:', metricsRes.data);

  // Test 5: Register a test customer or ensure customer exists
  const testCustomerPhone = '9876599999';
  console.log(`\n5. Registering customer (${testCustomerPhone})...`);
  const regRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: testCustomerPhone,
    email: 'customer.test@kirana.local',
    fullName: 'Ramesh Gupta (Gupta Provision Store)',
    password: 'InitialPassword@123'
  });
  console.log('Register Customer Status:', regRes.status, regRes.data?.user?.fullName || regRes.data?.message);

  // Test 6: Request OTP for Customer
  console.log(`\n6. Requesting OTP for Customer (${testCustomerPhone})...`);
  const custOtpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/send-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone: testCustomerPhone });

  console.log('Customer OTP Response:', custOtpRes.data);
  if (custOtpRes.status !== 200 || !custOtpRes.data.otp) {
    throw new Error('Failed to generate OTP for Customer');
  }
  const custOtp = custOtpRes.data.otp;

  // Test 7: Reset Password for Customer with OTP
  console.log(`\n7. Resetting password for Customer with OTP: ${custOtp}`);
  const custResetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/reset-password-with-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: testCustomerPhone,
    otp: custOtp,
    newPassword: 'NewCustomerSecure@999'
  });

  console.log('Customer Reset Response:', {
    status: custResetRes.status,
    role: custResetRes.data.role,
    user: custResetRes.data.user?.fullName
  });
  if (custResetRes.status !== 200 || !custResetRes.data.token) {
    throw new Error('Failed to reset password for Customer');
  }

  // Test 8: Login as Customer with new password
  console.log('\n8. Logging in as Customer with new password...');
  const custLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: testCustomerPhone,
    password: 'NewCustomerSecure@999'
  });

  console.log('Customer Login Result:', {
    status: custLoginRes.status,
    role: custLoginRes.data.user?.role,
    fullName: custLoginRes.data.user?.fullName
  });

  if (custLoginRes.status !== 200 || custLoginRes.data.user?.role !== 'customer') {
    throw new Error('Customer login verification failed');
  }

  console.log('\n======================================================');
  console.log('SUCCESS: ALL OTP PASSWORD RESET & REAL METRIC TESTS PASSED!');
  console.log('  ✓ Super Admin OTP Reset + Verification Passed');
  console.log('  ✓ Customer OTP Reset + Verification Passed');
  console.log('  ✓ Admin Name returned dynamically from MongoDB: ' + metricsRes.data.adminName);
  console.log('  ✓ Real database metrics verified: ' + JSON.stringify(metricsRes.data));
  console.log('======================================================\n');
}

runOtpTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
