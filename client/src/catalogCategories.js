export const CATALOG_CATEGORIES = [
  { slug: 'paan-corner', name: 'Paan Corner', icon: '🌿', color: '#E8F5E9' },
  { slug: 'dairy-bread', name: 'Dairy, Bread & Eggs', icon: '🥛', color: '#FFF4CC' },
  { slug: 'vegetables-fruits', name: 'Fruits & Vegetables', icon: '🥦', color: '#E8F8F0' },
  { slug: 'cold-drinks-juices', name: 'Cold Drinks & Juices', icon: '🥤', color: '#E0F2FE' },
  { slug: 'snacks-munchies', name: 'Snacks & Munchies', icon: '🍿', color: '#FFF0D9' },
  { slug: 'breakfast-instant-food', name: 'Breakfast & Instant Food', icon: '🥣', color: '#FEF3C7' },
  { slug: 'sweet-tooth', name: 'Sweet Tooth', icon: '🍫', color: '#FCE7F3' },
  { slug: 'bakery-biscuits', name: 'Bakery & Biscuits', icon: '🍪', color: '#FFF1E6' },
  { slug: 'tea-coffee-more', name: 'Tea, Coffee & Milk Drinks', icon: '☕', color: '#F5EDE3' },
  { slug: 'atta-rice-dal', name: 'Atta, Rice & Dal', icon: '🌾', color: '#FEF3C7' },
  { slug: 'masalas-spices', name: 'Masala, Oil & More', icon: '🧂', color: '#FEE2E2' },
  { slug: 'sauces-spreads', name: 'Sauces & Spreads', icon: '🥫', color: '#FFE4E6' },
  { slug: 'chicken-meat-fish', name: 'Chicken, Meat & Fish', icon: '🍗', color: '#FDE2E2' },
  { slug: 'organic-healthy-living', name: 'Organic & Healthy Living', icon: '🥬', color: '#DCFCE7' },
  { slug: 'baby-care', name: 'Baby Care', icon: '🍼', color: '#EDE9FE' },
  { slug: 'pharma-wellness', name: 'Pharma & Wellness', icon: '🩹', color: '#DBEAFE' },
  { slug: 'cleaning-household', name: 'Cleaning Essentials', icon: '🧹', color: '#E0F2FE' },
  { slug: 'home-office', name: 'Home & Office', icon: '🏠', color: '#F3F4F6' },
  { slug: 'personal-care', name: 'Personal Care', icon: '🧴', color: '#FCE7F3' },
  { slug: 'pet-care', name: 'Pet Care', icon: '🐶', color: '#FEF3C7' }
];

export const SHOP_CATEGORY_FILTERS = [
  { slug: 'all', name: 'All Items' },
  ...CATALOG_CATEGORIES.map(({ slug, name }) => ({ slug, name }))
];
