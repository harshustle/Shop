async function testMetrics() {
  // 1. Authenticate admin
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9161955178', password: 'admin' })
  });
  const { token } = await loginRes.json();

  // 2. Fetch admin metrics
  const metricsRes = await fetch('http://localhost:3000/api/admin/metrics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const metrics = await metricsRes.json();
  console.log('\n=== REAL METRICS FROM DB ===');
  console.log('Total Orders count in DB:', metrics.totalOrders);
  console.log('Total Revenue in DB: ₹', metrics.totalRevenue);
  console.log('Pending Orders count:', metrics.pendingOrders);
  console.log('Recent orders array count:', metrics.recentOrders.length);

  // 3. Fetch reviews
  const revRes = await fetch('http://localhost:3000/api/reviews/admin', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const reviews = await revRes.json();
  console.log('\n=== REAL REVIEWS IN DB: ===', reviews.length);
  reviews.forEach(r => console.log(`  - [${r.rating}★] "${r.title}": ${r.comment.slice(0, 40)}... (status: ${r.status})`));

  // 4. Fetch coupons
  const coupRes = await fetch('http://localhost:3000/api/coupons/admin', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const coupons = await coupRes.json();
  console.log('\n=== REAL COUPONS IN DB: ===', coupons.length);
  coupons.forEach(c => console.log(`  - [${c.code}] ${c.discountType}: ${c.discountValue}, used: ${c.usedCount || 0}`));
}

testMetrics().catch(console.error);
