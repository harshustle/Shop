import { Sparkles, Wheat, Cookie, Coffee, Heart, Sparkle, Utensils, Box, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
  { id: 'all', name: 'All Kirana', icon: Sparkles, color: 'bg-amber-100 text-amber-800' },
  { id: 'staples-and-grains', name: 'Staples & Grains', icon: Wheat, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'packaged-foods-snacks', name: 'Packaged Foods & Snacks', icon: Cookie, color: 'bg-orange-100 text-orange-800' },
  { id: 'beverages-drinks', name: 'Beverages & Chai', icon: Coffee, color: 'bg-emerald-100 text-emerald-800' },
  { id: 'personal-care-hygiene', name: 'Personal Care & Hygiene', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  { id: 'home-cleaning-pooja', name: 'Cleaning & Pooja Essentials', icon: Sparkle, color: 'bg-purple-100 text-purple-800' },
  { id: 'household-kitchenware', name: 'Household & Kitchenware', icon: Utensils, color: 'bg-blue-100 text-blue-800' },
  { id: 'packaging-disposables', name: 'Packaging & Disposables', icon: Box, color: 'bg-stone-100 text-stone-800' },
  { id: 'electricals-hardware', name: 'Electricals & Hardware', icon: Zap, color: 'bg-cyan-100 text-cyan-800' }
];

const CategoryRail = () => {
  const { selectedCategory, setSelectedCategory } = useCart();

  return (
    <div className="py-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2.5 min-w-max pb-1">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition duration-200 border active:scale-95 ${
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`p-1 rounded-lg ${isSelected ? 'bg-white/20 text-white' : cat.color}`}>
                <Icon size={14} />
              </div>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryRail;
