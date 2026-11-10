import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Wand2 } from 'lucide-react';
import { createProduct, getCategories, aiGenerateDescription, aiSuggestPrice } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const PRODUCT_TEMPLATES = [
  {
    label: '🥨 Coconut Murukku',
    title: 'Hand-Rolled Coconut Murukku (250g)',
    price: '160',
    quantity: 15,
    description: 'Crispy, golden South Indian snack made from fresh rice flour, pure coconut milk, and fragrant cumin seeds. 100% preservative-free.'
  },
  {
    label: '🌶️ Garlic Idli Podi',
    title: 'Traditional Garlic Idli Podi (200g)',
    price: '180',
    quantity: 20,
    description: 'Aromatic gun powder mix hand-roasted on iron tawa using heritage lentils, dried red chillies, and sun-dried organic garlic cloves.'
  },
  {
    label: '🥭 Mango Thokku Pickle',
    title: 'Heritage Mango Thokku Pickle (500g)',
    price: '240',
    quantity: 12,
    description: 'Spicy, tangy grated raw mango pickle slow-cooked in pure wood-pressed gingelly (sesame) oil and authentic whole spices.'
  },
  {
    label: '🧶 Woolen Sweater',
    title: 'Hand-Knitted Soft Woolen Sweater (Unisex)',
    price: '850',
    quantity: 5,
    description: 'Bespoke hand-knitted warm winter sweater crafted with pure premium acrylic-wool yarn with classic diamond stitch patterns.'
  },
  {
    label: '🌿 Herbal Hair Oil',
    title: 'Pure Cold-Pressed Herbal Hair Oil (200ml)',
    price: '290',
    quantity: 10,
    description: 'Traditional Ayurvedic hair nourishment oil infused with fresh curry leaves, amla, bhringraj, and pure cold-pressed coconut oil.'
  },
  {
    label: '🌱 Vermicompost 5kg',
    title: '100% Organic Vermicompost Fertilizer (5kg)',
    price: '220',
    quantity: 25,
    description: 'Nutrient-rich natural organic vermicompost enriched with beneficial soil microbes for thriving potted vegetables and flower plants.'
  }
];

export const CreateProductModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [categories, setCategories] = useState([]);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCategories().then((res) => {
        setCategories(res.data || []);
        if (res.data?.[0]) setCategory(res.data[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setPrice(tpl.price);
    setQuantity(tpl.quantity);
    setDescription(tpl.description);
    showToast(`Loaded "${tpl.label}" template! Click AI Auto-Draft to customize.`, 'info');
  };

  const handleAIFill = async () => {
    if (!title.trim()) {
      showToast('Please enter a product title first (e.g. Mango Pickle)', 'error');
      return;
    }
    setGeneratingAI(true);
    try {
      const [descRes, priceRes] = await Promise.all([
        aiGenerateDescription({
          name: user?.first_name || 'Artisan',
          skills: [title],
          experience_years: 15,
          tone: 'warm'
        }),
        aiSuggestPrice({
          service: title,
          experience: 15,
          city: 'Chennai'
        })
      ]);

      if (descRes.data.description) setDescription(descRes.data.description);
      if (priceRes.data.recommended_price && !price) setPrice(priceRes.data.recommended_price);
      showToast('AI drafted your product description & fair price!', 'success');
    } catch {
      showToast('AI suggestion error', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProduct({
        title,
        category,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        description,
      });
      showToast('Handmade product listed in marketplace successfully!', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to list product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-warm-xl p-6 border border-warmgray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="badge-tag bg-sage text-white font-bold">Sell in Marketplace</span>
            <h3 className="font-heading text-xl font-bold text-warmgray-900 mt-1">List Handmade Product</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Quick Example Presets */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-warmgray-500 mb-1.5">
              ⚡ Quick Example Templates (Click to Auto-Fill)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cream-100 hover:bg-sage-100 text-warmgray-700 hover:text-sage-900 border border-warmgray-200 transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Product Title</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Homemade Mango Thokku Pickle (500g)"
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
              <button
                type="button"
                onClick={handleAIFill}
                disabled={generatingAI}
                className="px-3.5 py-2 rounded-xl bg-sage-100 text-sage-800 text-xs font-bold hover:bg-sage-200 flex items-center gap-1 shrink-0"
                title="Auto-fill with AI"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{generatingAI ? 'Writing...' : 'AI Auto-Fill'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 250"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Stock Quantity Available</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Description & Ingredients</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh homemade ingredients, shelf life, packing details..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-secondary text-sm !px-6 flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              {loading ? 'Listing...' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
