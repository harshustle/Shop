async function placeOrder() {
  const payload = {
    customerName: 'Subham Sharma',
    phoneNumber: '9999999999',
    email: 's@gmail.com',
    address: 'Home: Flat 302, Green Valley Apartments, Gomti Nagar, Lucknow - 226010',
    products: [
      {
        productName: 'Philips 9W Crystal White Cool Day Light LED Bulb',
        quantity: 2,
        price: 95
      }
    ],
    items: [
      {
        skuSnapshot: 'PHIL-LED-9W-1',
        productTitleSnapshot: 'Philips 9W Crystal White Cool Day Light LED Bulb',
        unitPriceSnapshot: 95,
        quantity: 2,
        totalLinePrice: 190
      }
    ],
    subtotal: 190,
    discountAmount: 38,
    couponCode: 'FRESH20',
    shippingFee: 40,
    totalAmount: 192,
    paymentMethod: 'cod',
    paymentStatus: 'unpaid'
  };

  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('Order response status:', res.status);
  console.log('Created real order:', JSON.stringify(data, null, 2));
}

placeOrder().catch(console.error);
